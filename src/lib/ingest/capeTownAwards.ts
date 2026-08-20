/**
 * City of Cape Town — Tender Awards open data feed.
 *
 * This is a genuinely free, public, no-auth ArcGIS REST FeatureServer run by
 * the City of Cape Town's own open data portal — confirmed live via direct
 * query on 2026-08-20. It is NOT the same thing as Western Cape provincial
 * government (which has no open tender API), and it is NOT the same as
 * easytenders.co.za or similar commercial aggregators, which require a paid/
 * gated API arrangement and are not integrated here.
 *
 *   Endpoint: https://services6.arcgis.com/nyYfO9SxHU2ChQd9/arcgis/rest/services/Tender_Awards_2021_to_2026/FeatureServer/0/query
 *   Auth: none required.
 *
 * Important caveat: this dataset covers tender AWARD DECISIONS (who won,
 * what the decision was — Approved/Cancelled/Withdrawn/etc.), not open
 * bids currently accepting submissions. So a "confirmed" match against this
 * source means "this reference number matches a real City of Cape Town
 * supply chain decision on record" — useful for verifying a tender actually
 * exists/existed, but it doesn't mean the tender is still open for bidding.
 * closingDate is deliberately left null for these records (there isn't a
 * meaningful "closing date" for an already-decided award) — the decision
 * date and outcome are folded into the title text instead so they're still
 * visible to the user without implying it's an open opportunity.
 *
 * The live dataset has ~17,600 total records going back to 2021. Syncing
 * everything on every run would be slow and mostly pointless for a scam-
 * verification tool (most checks concern something recent), so this only
 * pulls decisions from the last `daysBack` days (default 400, i.e. a bit
 * over a year) on each run. Upserts are idempotent, so re-running is safe.
 */

import { getOrCreateSource, upsertListingByReference, updateSourceLastSync } from "@/db/repo";

const FEATURE_SERVER_URL =
  "https://services6.arcgis.com/nyYfO9SxHU2ChQd9/arcgis/rest/services/Tender_Awards_2021_to_2026/FeatureServer/0/query";

const SOURCE_NAME = "City of Cape Town (Open Data — Tender Awards)";

interface CoctAwardAttributes {
  TTS_Reference: string | null;
  Decision_Reference: string | null;
  Description: string | null;
  Vendor: string | null;
  Value_of_Decision__Fixed_: string | null;
  Date_of_decision: number | null; // epoch ms
  Decision_Code: string | null;
  ObjectId: number;
}

interface FeatureServerQueryResponse {
  features: { attributes: CoctAwardAttributes }[];
  exceededTransferLimit?: boolean;
}

async function queryPage(params: {
  dateFromSqlTimestamp: string; // e.g. "2025-07-16 00:00:00"
  resultOffset: number;
  resultRecordCount: number;
}): Promise<FeatureServerQueryResponse> {
  const url = new URL(FEATURE_SERVER_URL);
  // Verified directly against this live endpoint: a bare epoch-ms numeric
  // comparison against this esriFieldTypeDate field returns an ArcGIS error
  // object (HTTP 200 with {"error": {...}} in the body — not an HTTP error
  // status, so it would fail silently if unchecked). The SQL92 TIMESTAMP
  // literal syntax below is what this service actually accepts.
  url.searchParams.set(
    "where",
    `Date_of_decision >= TIMESTAMP '${params.dateFromSqlTimestamp}'`
  );
  url.searchParams.set("outFields", "*");
  url.searchParams.set("f", "json");
  url.searchParams.set("resultOffset", String(params.resultOffset));
  url.searchParams.set("resultRecordCount", String(params.resultRecordCount));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Cape Town Tender Awards API returned ${res.status} for ${url.toString()}`);
  }

  const data = await res.json();
  // ArcGIS returns HTTP 200 even for a malformed query — the failure shows
  // up as an `error` object in the JSON body instead of an HTTP status, so
  // this has to be checked explicitly or a bad query fails silently.
  if (data.error) {
    throw new Error(
      `Cape Town Tender Awards API rejected the query: ${JSON.stringify(data.error)}`
    );
  }
  return data;
}

function mapRecordToListing(attrs: CoctAwardAttributes, sourceId: number) {
  const referenceNumber = attrs.TTS_Reference || attrs.Decision_Reference || `COCT-${attrs.ObjectId}`;
  const decisionDate = attrs.Date_of_decision
    ? new Date(attrs.Date_of_decision).toISOString().slice(0, 10)
    : "unknown date";
  const outcome = attrs.Decision_Code || "decision on record";
  const vendor = attrs.Vendor ? ` — awarded to ${attrs.Vendor.replace(/\n/g, ", ")}` : "";
  const value = attrs.Value_of_Decision__Fixed_ ? ` (${attrs.Value_of_Decision__Fixed_})` : "";

  const baseTitle = attrs.Description || "City of Cape Town supply chain decision";
  const title = `${baseTitle} — ${outcome} on ${decisionDate}${vendor}${value}`;

  return {
    type: "tender" as const,
    referenceNumber,
    title,
    issuingBody: "City of Cape Town",
    sourceId,
    sourceUrl: "https://odp-cctegis.opendata.arcgis.com/",
    status: /approved/i.test(outcome) ? "awarded" : outcome.toLowerCase(),
    closingDate: null,
    province: "Western Cape",
    ingestedAt: new Date().toISOString(),
    isPlaceholder: false,
  };
}

export async function syncCapeTownAwards(options?: { daysBack?: number }) {
  const daysBack = options?.daysBack ?? 400;

  const source = await getOrCreateSource({
    name: SOURCE_NAME,
    baseUrl: "https://odp-cctegis.opendata.arcgis.com/",
    ingestionMethod: "api",
    trustTier: "official",
    notes:
      "Tender award decisions (not open bids) from the City of Cape Town's own open data ArcGIS FeatureServer. Free, public, no-auth.",
  });

  const dateFromSqlTimestamp = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " "); // "YYYY-MM-DD HH:MM:SS", the SQL92 literal format this API requires
  const resultRecordCount = 500;
  let resultOffset = 0;
  let totalUpserted = 0;
  const MAX_PAGES = 50; // safety net; 500 * 50 = 25,000 records, well above what a ~400-day window should ever return

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await queryPage({ dateFromSqlTimestamp, resultOffset, resultRecordCount });

    for (const feature of data.features) {
      const mapped = mapRecordToListing(feature.attributes, source.id);
      await upsertListingByReference(mapped);
      totalUpserted += 1;
    }

    if (data.features.length < resultRecordCount) break;
    resultOffset += resultRecordCount;
  }

  await updateSourceLastSync(source.id, new Date().toISOString());

  return { totalUpserted };
}
