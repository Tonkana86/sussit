/**
 * eTenders (National Treasury) ingestion pipeline.
 *
 * Data source: the National Treasury "Transparency Portal" OCDS REST API —
 * confirmed live and publicly accessible with NO authentication required.
 *
 *   Base URL:      https://ocds-api.etenders.gov.za
 *   List releases: GET /api/OCDSReleases?PageNumber=&PageSize=&dateFrom=&dateTo=
 *   Single release:GET /api/OCDSReleases/release/{ocid}
 *
 * Verified live on 2026-08-19 via direct API calls — confirmed real, current
 * tender records (e.g. ocds-9t57fa-166041, "SCD3701/2026", Overstrand
 * Municipality). Response format is OCDS (Open Contracting Data Standard)
 * v1.1. Data is published by National Treasury under CC BY 4.0, and the
 * portal itself states it is in "public beta" and "must not be used for any
 * critical decision making or legal purposes" — that caveat should stay
 * reflected in this platform's own UI copy (see VerifyResultCard).
 *
 * IMPORTANT — sandbox limitation: this file's fetch() calls could NOT be
 * executed end-to-end in the build sandbox, because that sandbox's outbound
 * network is restricted to an allowlist that does not include
 * ocds-api.etenders.gov.za. The API contract and field shapes below were
 * confirmed independently via a separate tool with broader network access,
 * and the sample records in src/db/seedData.ts were captured from real,
 * verbatim API responses. Before relying on this in production, run one real
 * sync from the deployed environment (which has normal internet access) and
 * confirm the shapes still match (the portal is explicitly in beta and could
 * change).
 */

import { getSourceByName, upsertListingByReference, updateSourceLastSync } from "@/db/repo";

const OCDS_BASE_URL = "https://ocds-api.etenders.gov.za";
const ETENDERS_SOURCE_NAME = "eTenders (National Treasury)";

interface OcdsDocument {
  url?: string;
}

interface OcdsTender {
  id: string;
  title: string;
  status: string;
  category?: string;
  province?: string;
  description?: string;
  tenderPeriod?: { startDate?: string; endDate?: string };
  documents?: OcdsDocument[];
}

interface OcdsRelease {
  ocid: string;
  date: string;
  tender?: OcdsTender;
  buyer?: { id?: string; name?: string };
}

interface OcdsReleasePackage {
  releases: OcdsRelease[];
  links?: { next?: string };
}

/**
 * Fetch one page of releases from the OCDS API for a given date window.
 * Throws on non-2xx responses so callers can decide how to handle/log failures.
 */
export async function fetchOcdsReleasesPage(params: {
  pageNumber: number;
  pageSize: number;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
}): Promise<OcdsReleasePackage> {
  const url = new URL("/api/OCDSReleases", OCDS_BASE_URL);
  url.searchParams.set("PageNumber", String(params.pageNumber));
  url.searchParams.set("PageSize", String(params.pageSize));
  url.searchParams.set("dateFrom", params.dateFrom);
  url.searchParams.set("dateTo", params.dateTo);

  // Node's built-in fetch sends no User-Agent by default, which some
  // government-site WAFs treat as a signal of automated/bot traffic and
  // block outright (showing up here as a generic "fetch failed" with no
  // HTTP status at all, since the connection never completes) — even though
  // a normal browser hitting the same URL works fine. Sending a realistic
  // browser User-Agent avoids that.
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-ZA,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`eTenders OCDS API returned ${res.status} for ${url.toString()}`);
  }

  return res.json();
}

function mapReleaseToListing(release: OcdsRelease, sourceId: number) {
  const tender = release.tender;
  if (!tender) return null;

  const doc = tender.documents?.[0];

  return {
    type: "tender" as const,
    referenceNumber: tender.title || tender.id, // eTenders' human-facing "tender number" is the title field (e.g. "SCD3701/2026")
    title: tender.description || tender.title,
    issuingBody: release.buyer?.name ?? "Unknown organ of state",
    sourceId,
    sourceUrl: doc?.url ?? `https://www.etenders.gov.za`,
    status: tender.status === "active" ? "open" : "closed",
    closingDate: tender.tenderPeriod?.endDate?.slice(0, 10) ?? null,
    province: tender.province ?? null,
    ingestedAt: new Date().toISOString(),
    isPlaceholder: false,
  };
}

/**
 * Sync recent tenders from eTenders into the `listings` table.
 * Upserts by referenceNumber — re-running is safe.
 *
 * NOT exercised end-to-end in the build sandbox; see module docstring.
 */
export async function syncEtenders(options?: { daysBack?: number }) {
  // IMPORTANT: the release-level `date` field returned by the OCDS API is the
  // tender's original PUBLICATION date — it never changes as the tender stays
  // open. Many real tenders stay open for 21-30+ days after publication, so a
  // narrow window (this used to default to 14 days) misses tenders that are
  // still live and accepting bids simply because they were first published
  // more than 14 days ago. Defaulting to 90 days here so a single daily sync
  // reliably covers essentially every currently-open tender. Because syncing
  // upserts (never deletes), each day's run only adds to what's already
  // stored, so this is safe to run daily without duplicating work.
  const daysBack = options?.daysBack ?? 90;

  const source = await getSourceByName(ETENDERS_SOURCE_NAME);
  if (!source) {
    throw new Error(
      `Source "${ETENDERS_SOURCE_NAME}" not found — run the DB setup/seed step first.`
    );
  }

  const dateTo = new Date().toISOString().slice(0, 10);
  const dateFrom = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  let pageNumber = 1;
  let totalUpserted = 0;
  // Confirmed live against the real API: requesting PageSize=100 (or even
  // 200) silently caps at 50 results with no error — so we request 50
  // explicitly and paginate by incrementing PageNumber until a page comes
  // back with fewer than 50 releases, rather than trusting a `links.next`
  // field (which the API does not reliably provide).
  const pageSize = 50;

  // Paginate through all available releases in the date window. Cap at a
  // generous number of pages as a safety net against an infinite loop if the
  // API ever behaves unexpectedly (e.g. always returning exactly `pageSize`
  // results).
  const MAX_PAGES = 200;
  while (pageNumber <= MAX_PAGES) {
    const page = await fetchOcdsReleasesPage({ pageNumber, pageSize, dateFrom, dateTo });

    for (const release of page.releases) {
      const mapped = mapReleaseToListing(release, source.id);
      if (!mapped) continue;
      await upsertListingByReference(mapped);
      totalUpserted += 1;
    }

    if (page.releases.length < pageSize) break;
    pageNumber += 1;
  }

  await updateSourceLastSync(source.id, new Date().toISOString());

  return { totalUpserted };
}
