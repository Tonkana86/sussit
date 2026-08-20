import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, like, or } from "drizzle-orm";
import path from "path";
import * as schema from "./schema";
import type { ListingRow, NewListing, NewScamReport, ScamReportRow, SourceRow } from "./types";
import { rankFuzzyMatches } from "./fuzzyRank";
import { findApprovedMatchInMemory } from "./scamMatch";

// Lazily created — this module is statically imported by repo.ts alongside
// pg-repo.ts regardless of which one is actually selected, so opening the
// sqlite file at module load time would happen even in Postgres/production
// mode. Deferring to first use avoids that.
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const dbPath = path.join(process.cwd(), "data", "tenderverify.db");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

export async function listSources(): Promise<SourceRow[]> {
  return getDb().select().from(schema.sources).all() as unknown as SourceRow[];
}

export async function getSourceByName(name: string): Promise<SourceRow | null> {
  const rows = getDb().select().from(schema.sources).where(eq(schema.sources.name, name)).all();
  return (rows[0] as unknown as SourceRow) ?? null;
}

export async function insertSource(data: Omit<SourceRow, "id">): Promise<SourceRow> {
  const info = getDb().insert(schema.sources).values(data).run();
  const rows = getDb()
    .select()
    .from(schema.sources)
    .where(eq(schema.sources.id, Number(info.lastInsertRowid)))
    .all();
  return rows[0] as unknown as SourceRow;
}

export async function findApprovedScamReportMatch(query: string): Promise<ScamReportRow | null> {
  // See src/db/scamMatch.ts — matching (including phone-format-tolerant
  // contact-detail matching) happens in application code, identically to
  // the Postgres repo.
  const rows = getDb()
    .select()
    .from(schema.scamReports)
    .where(eq(schema.scamReports.status, "approved"))
    .all() as unknown as ScamReportRow[];
  return findApprovedMatchInMemory(rows, query);
}

export async function findListingExact(ref: string): Promise<ListingRow | null> {
  // Plain `like` with no wildcards is a case-insensitive equality check for
  // ASCII in SQLite (unlike `eq`, which is case-sensitive) — kept consistent
  // with the case-insensitive ILIKE match used on the Postgres side.
  const rows = getDb().select().from(schema.listings).where(like(schema.listings.referenceNumber, ref)).all();
  return (rows[0] as unknown as ListingRow) ?? null;
}

/**
 * Returns every listing whose reference number, title, or issuing body
 * contains `query`, ranked so a match in the reference number (strongest
 * signal) sorts before a title match, which sorts before an issuing-body-only
 * match — so the most relevant result is always first without hiding the
 * rest. Capped at 10 to keep results page-able and not need to render 30 rows
 * for a common department name.
 */
export async function findListingsFuzzy(query: string): Promise<ListingRow[]> {
  const rows = getDb()
    .select()
    .from(schema.listings)
    .where(
      or(
        like(schema.listings.referenceNumber, `%${query}%`),
        like(schema.listings.title, `%${query}%`),
        like(schema.listings.issuingBody, `%${query}%`)
      )
    )
    .all() as unknown as ListingRow[];

  return rankFuzzyMatches(rows, query).slice(0, 10);
}

export async function insertSearchLog(query: string, tier: string): Promise<void> {
  getDb().insert(schema.searchLogs)
    .values({ query, resultTier: tier, searchedAt: new Date().toISOString() })
    .run();
}

export async function insertScamReport(data: NewScamReport): Promise<void> {
  getDb().insert(schema.scamReports).values(data).run();
}

export async function upsertListingByReference(listing: NewListing): Promise<void> {
  const existing = getDb()
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.referenceNumber, listing.referenceNumber))
    .all();

  if (existing[0]) {
    getDb().update(schema.listings)
      .set(listing)
      .where(eq(schema.listings.referenceNumber, listing.referenceNumber))
      .run();
  } else {
    getDb().insert(schema.listings).values(listing).run();
  }
}

export async function updateSourceLastSync(sourceId: number, timestamp: string): Promise<void> {
  getDb().update(schema.sources)
    .set({ lastSuccessfulSync: timestamp })
    .where(eq(schema.sources.id, sourceId))
    .run();
}

export async function listAllScamReports(): Promise<ScamReportRow[]> {
  const rows = getDb()
    .select()
    .from(schema.scamReports)
    .orderBy(schema.scamReports.id)
    .all();
  return rows.reverse() as unknown as ScamReportRow[]; // newest first
}

export async function updateScamReportStatus(id: number, status: string): Promise<void> {
  getDb().update(schema.scamReports).set({ status }).where(eq(schema.scamReports.id, id)).run();
}

export async function deletePlaceholderListings(): Promise<number> {
  const placeholders = getDb()
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.isPlaceholder, true))
    .all();
  getDb().delete(schema.listings).where(eq(schema.listings.isPlaceholder, true)).run();
  return placeholders.length;
}

export async function deleteDemoScamReports(): Promise<number> {
  const demos = getDb()
    .select()
    .from(schema.scamReports)
    .where(eq(schema.scamReports.reportedReferenceNumber, "TND-9999-FAKE"))
    .all();
  getDb()
    .delete(schema.scamReports)
    .where(eq(schema.scamReports.reportedReferenceNumber, "TND-9999-FAKE"))
    .run();
  return demos.length;
}

export async function deleteSourceByName(name: string): Promise<number> {
  const rows = getDb().select().from(schema.sources).where(eq(schema.sources.name, name)).all();
  getDb().delete(schema.sources).where(eq(schema.sources.name, name)).run();
  return rows.length;
}
