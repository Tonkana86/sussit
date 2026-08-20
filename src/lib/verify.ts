import {
  listSources,
  findApprovedScamReportMatch,
  findListingExact,
  findListingsFuzzy,
  insertSearchLog as repoInsertSearchLog,
} from "@/db/repo";
import type { ListingRow, SourceRow } from "@/db/types";

export type VerifyTier = "confirmed" | "flagged" | "not_found";

export interface ListingSummary {
  type: string;
  referenceNumber: string;
  title: string;
  issuingBody: string;
  sourceName: string;
  sourceUrl: string | null;
  status: string;
  closingDate: string | null;
  isPlaceholder: boolean;
}

export interface VerifyResult {
  tier: VerifyTier;
  query: string;
  message: string;
  /** The single best/primary match, when there is one. Kept for simple display. */
  listing?: ListingSummary;
  /** All matches found, including the primary one — used when a fuzzy search
   * turns up more than one real listing, so the user isn't shown just the
   * first result and left unsure whether others exist. */
  listings?: ListingSummary[];
  matchedScamReport?: {
    reportedCompanyName: string;
    description: string;
    reportedReferenceNumber: string | null;
  };
  sourcesChecked: string[];
}

function toSummary(listing: ListingRow, allSources: SourceRow[]): ListingSummary {
  const source = allSources.find((s) => s.id === listing.sourceId);
  return {
    type: listing.type,
    referenceNumber: listing.referenceNumber,
    title: listing.title,
    issuingBody: listing.issuingBody,
    sourceName: source?.name ?? "Unknown source",
    sourceUrl: listing.sourceUrl,
    status: listing.status,
    closingDate: listing.closingDate,
    isPlaceholder: listing.isPlaceholder,
  };
}

/**
 * Core verification logic.
 *
 * Confidence tiers are intentionally conservative (see spec Section 4):
 * - "confirmed": query matches a listing from a known source.
 * - "flagged": query matches a pattern in the community scam-report database.
 * - "not_found": no match in any currently-connected source. This is NOT the
 *   same as "this is a scam" — it may simply mean the relevant official
 *   source isn't integrated yet. The UI must say this explicitly.
 *
 * Match order matters for accuracy: an EXACT reference-number match against
 * an official listing is checked first and always wins, because it's the
 * most definitive signal available — it would be a real correctness/
 * liability problem if a genuine, exact-matching official tender got labeled
 * "flagged as a likely scam" just because its issuer's name loosely
 * resembled text in an unrelated old scam report. Only after ruling out an
 * exact official match do we check the community scam-report database, and
 * only after that do we fall back to a fuzzy (partial title/issuer) listing
 * match, since a fuzzy match is weaker evidence than either of the other two.
 */
export async function verifyQuery(rawQuery: string): Promise<VerifyResult> {
  const query = rawQuery.trim();

  const allSources = await listSources();
  const sourcesChecked = allSources.map((s) => s.name);

  if (!query) {
    return {
      tier: "not_found",
      query,
      message: "Please enter a reference number, company, or department name to check.",
      sourcesChecked,
    };
  }

  // 1. Exact reference-number match against an official listing — the
  //    strongest possible signal, so it's checked and returned before
  //    anything else, including the scam-report database.
  const exactMatch = await findListingExact(query);
  if (exactMatch) {
    const summary = toSummary(exactMatch, allSources);
    return {
      tier: "confirmed",
      query,
      message: exactMatch.isPlaceholder
        ? "DEMO MATCH ONLY — this record is fabricated placeholder data for development, not a real listing. Live source integration is still pending."
        : `Matched against ${summary.sourceName}.`,
      listing: summary,
      listings: [summary],
      sourcesChecked,
    };
  }

  // 2. Community scam-report database — a known scam pattern should surface
  //    even if a matching fake listing doesn't exist anywhere else.
  const approvedFlag = await findApprovedScamReportMatch(query);
  if (approvedFlag) {
    return {
      tier: "flagged",
      query,
      message:
        "This matches a report in our community scam database. Do not make any payments or share personal/banking details.",
      matchedScamReport: {
        reportedCompanyName: approvedFlag.reportedCompanyName,
        description: approvedFlag.description,
        reportedReferenceNumber: approvedFlag.reportedReferenceNumber,
      },
      sourcesChecked,
    };
  }

  // 3. Fuzzy (partial title/issuer/reference) match against listings — weaker
  //    evidence than either of the above, so checked last. May return more
  //    than one real listing (e.g. a department name with several tenders);
  //    all are returned so the user can see every match rather than just one.
  const fuzzyMatches = await findListingsFuzzy(query);
  if (fuzzyMatches.length > 0) {
    const summaries = fuzzyMatches.map((m) => toSummary(m, allSources));
    return {
      tier: "confirmed",
      query,
      message: summaries[0].isPlaceholder
        ? "DEMO MATCH ONLY — this record is fabricated placeholder data for development, not a real listing. Live source integration is still pending."
        : summaries.length > 1
          ? `Found ${summaries.length} possible matches.`
          : `Matched against ${summaries[0].sourceName}.`,
      listing: summaries[0],
      listings: summaries,
      sourcesChecked,
    };
  }

  return {
    tier: "not_found",
    query,
    message:
      "We couldn't find this in any of the sources we currently check. This does NOT confirm it's a scam — it may just mean we haven't connected to the relevant source yet. Verify directly with the issuing organisation using contact details from their official website, never from the listing itself.",
    sourcesChecked,
  };
}

export async function logSearch(query: string, tier: VerifyTier) {
  await repoInsertSearchLog(query, tier);
}
