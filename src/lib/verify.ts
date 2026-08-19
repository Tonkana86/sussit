import {
  listSources,
  findApprovedScamReportMatch,
  findListingExact,
  findListingFuzzy,
  insertSearchLog as repoInsertSearchLog,
} from "@/db/repo";

export type VerifyTier = "confirmed" | "flagged" | "not_found";

export interface VerifyResult {
  tier: VerifyTier;
  query: string;
  message: string;
  listing?: {
    type: string;
    referenceNumber: string;
    title: string;
    issuingBody: string;
    sourceName: string;
    sourceUrl: string | null;
    status: string;
    closingDate: string | null;
    isPlaceholder: boolean;
  };
  matchedScamReport?: {
    reportedCompanyName: string;
    description: string;
    reportedReferenceNumber: string | null;
  };
  sourcesChecked: string[];
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

  // 1. Check scam report database first — a known scam pattern should surface
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

  // 2. Check known listings by exact reference number, then fuzzy title/issuer match.
  const matched = (await findListingExact(query)) ?? (await findListingFuzzy(query));

  if (matched) {
    const source = allSources.find((s) => s.id === matched.sourceId);
    return {
      tier: "confirmed",
      query,
      message: matched.isPlaceholder
        ? "DEMO MATCH ONLY — this record is fabricated placeholder data for development, not a real listing. Live source integration is still pending."
        : `Matched against ${source?.name ?? "a connected source"}.`,
      listing: {
        type: matched.type,
        referenceNumber: matched.referenceNumber,
        title: matched.title,
        issuingBody: matched.issuingBody,
        sourceName: source?.name ?? "Unknown source",
        sourceUrl: matched.sourceUrl,
        status: matched.status,
        closingDate: matched.closingDate,
        isPlaceholder: matched.isPlaceholder,
      },
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
