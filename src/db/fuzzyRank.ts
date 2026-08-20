import type { ListingRow } from "./types";

/**
 * Shared ranking used by both the SQLite and Postgres repos so a fuzzy
 * search's result ordering behaves identically regardless of backend: a
 * match in the reference number outranks a match in the title, which
 * outranks a match only in the issuing body — since a reference-number hit
 * is the strongest signal that this is the record the user actually meant.
 */
export function rankFuzzyMatches(rows: ListingRow[], query: string): ListingRow[] {
  const q = query.toLowerCase();
  function score(row: ListingRow): number {
    if (row.referenceNumber.toLowerCase().includes(q)) return 0;
    if (row.title.toLowerCase().includes(q)) return 1;
    return 2;
  }
  return [...rows].sort((a, b) => score(a) - score(b));
}
