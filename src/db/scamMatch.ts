import type { ScamReportRow } from "./types";

/**
 * Shared scam-report matching logic used by both the SQLite and Postgres
 * repos. Matching happens in application code (rather than a SQL LIKE
 * clause) specifically so phone numbers can be compared in a
 * format-tolerant way — a user searching "0712345678" should match a report
 * that recorded the same number as "+27 71 234 5678" or "27712345678".
 * Community scam reports are expected to stay a small table (this is a
 * public-interest tool, not a high-volume consumer app), so fetching all
 * approved reports and matching in-memory is a reasonable trade-off for that
 * flexibility, rather than needing near-identical regex/normalisation logic
 * written twice in two different SQL dialects.
 */
export function findApprovedMatchInMemory(
  approvedReports: ScamReportRow[],
  rawQuery: string
): ScamReportRow | null {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return null;

  const queryDigits = query.replace(/\D/g, "");

  for (const report of approvedReports) {
    const textFields = [report.reportedReferenceNumber, report.reportedCompanyName]
      .filter((f): f is string => Boolean(f))
      .map((f) => f.toLowerCase());

    // Reference number / company name: plain case-insensitive substring match.
    if (textFields.some((f) => f.includes(query))) return report;

    const contact = report.contactDetailsUsedByScammer;
    if (contact) {
      const contactLower = contact.toLowerCase();
      // Email addresses and other free-text contact details: substring match.
      if (contactLower.includes(query)) return report;

      // Phone/bank-account-style numbers: compare digits only, and compare
      // the last 9 digits specifically so a South African number matches
      // regardless of whether it was entered as 0xx..., +27xx..., or 27xx...
      // (all three represent the same 9-digit local number). Require at
      // least 7 digits in the query to avoid short numbers matching almost
      // anything by coincidence.
      if (queryDigits.length >= 7) {
        const contactDigits = contact.replace(/\D/g, "");
        if (contactDigits.length >= 7) {
          const queryLast9 = queryDigits.slice(-9);
          const contactLast9 = contactDigits.slice(-9);
          if (queryLast9.length === 9 && queryLast9 === contactLast9) return report;
          if (contactDigits.includes(queryDigits)) return report;
        }
      }
    }
  }

  return null;
}
