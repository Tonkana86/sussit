import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, like, or } from "drizzle-orm";
import path from "path";
import * as schema from "./schema";
import type { ListingRow, NewListing, NewScamReport, ScamReportRow, SourceRow } from "./types";

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

export async function findApprovedScamReportMatch(query: string): Promise<ScamReportRow | null> {
  const rows = getDb()
    .select()
    .from(schema.scamReports)
    .where(
      or(
        like(schema.scamReports.reportedReferenceNumber, `%${query}%`),
        like(schema.scamReports.reportedCompanyName, `%${query}%`)
      )
    )
    .all();
  const approved = rows.find((r) => r.status === "approved");
  return (approved as unknown as ScamReportRow) ?? null;
}

export async function findListingExact(ref: string): Promise<ListingRow | null> {
  const rows = getDb().select().from(schema.listings).where(eq(schema.listings.referenceNumber, ref)).all();
  return (rows[0] as unknown as ListingRow) ?? null;
}

export async function findListingFuzzy(query: string): Promise<ListingRow | null> {
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
    .all();
  return (rows[0] as unknown as ListingRow) ?? null;
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
