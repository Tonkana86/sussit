import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, like, or, sql, desc } from "drizzle-orm";
import * as schema from "./pg-schema";
import { getPgConnectionString } from "./pg-connection";
import type { ListingRow, NewListing, NewScamReport, ScamReportRow, SourceRow } from "./types";

// Lazily created so this module can be imported without a Postgres
// connection string being set (e.g. in the sqlite-only local dev path)
// without throwing at import time.
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = getPgConnectionString();
    if (!connectionString) {
      throw new Error(
        "No Postgres connection string found (checked DATABASE_URL, POSTGRES_URL, DATABASE_URL_UNPOOLED) — cannot use the Postgres repo."
      );
    }
    _pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // most managed PG providers (Neon/Supabase/Vercel Postgres) require TLS
    });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

/**
 * Creates all tables if they don't already exist. Safe to call on every
 * request — CREATE TABLE IF NOT EXISTS is idempotent. This exists so a
 * non-technical user can bootstrap the production database by visiting a
 * URL once (see /api/admin/init-db), instead of needing to run drizzle-kit
 * or any CLI migration tool against the production database.
 *
 * NOT exercised against a real Postgres instance in the build sandbox (no
 * outbound network to any Postgres host from here) — the SQL below is
 * standard, portable DDL, but verify it runs cleanly on first deploy.
 */
export async function ensureSchema(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sources (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      ingestion_method TEXT NOT NULL,
      trust_tier TEXT NOT NULL,
      last_successful_sync TEXT,
      notes TEXT
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      reference_number TEXT NOT NULL,
      title TEXT NOT NULL,
      issuing_body TEXT NOT NULL,
      source_id INTEGER NOT NULL,
      source_url TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      closing_date TEXT,
      province TEXT,
      ingested_at TEXT NOT NULL,
      is_placeholder BOOLEAN NOT NULL DEFAULT false
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS scam_reports (
      id SERIAL PRIMARY KEY,
      reported_reference_number TEXT,
      reported_company_name TEXT NOT NULL,
      description TEXT NOT NULL,
      contact_details_used_by_scammer TEXT,
      evidence_urls TEXT,
      reporter_email TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      moderator_notes TEXT,
      created_at TEXT NOT NULL
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS search_logs (
      id SERIAL PRIMARY KEY,
      query TEXT NOT NULL,
      result_tier TEXT NOT NULL,
      searched_at TEXT NOT NULL
    );
  `);
}

export async function countSources(): Promise<number> {
  const db = getDb();
  const rows = await db.select().from(schema.sources);
  return rows.length;
}

export async function listSources(): Promise<SourceRow[]> {
  const db = getDb();
  return (await db.select().from(schema.sources)) as unknown as SourceRow[];
}

export async function getSourceByName(name: string): Promise<SourceRow | null> {
  const db = getDb();
  const rows = await db.select().from(schema.sources).where(eq(schema.sources.name, name));
  return (rows[0] as unknown as SourceRow) ?? null;
}

export async function findApprovedScamReportMatch(query: string): Promise<ScamReportRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.scamReports)
    .where(
      or(
        like(schema.scamReports.reportedReferenceNumber, `%${query}%`),
        like(schema.scamReports.reportedCompanyName, `%${query}%`)
      )
    );
  const approved = rows.find((r) => r.status === "approved");
  return (approved as unknown as ScamReportRow) ?? null;
}

export async function findListingExact(ref: string): Promise<ListingRow | null> {
  const db = getDb();
  const rows = await db.select().from(schema.listings).where(eq(schema.listings.referenceNumber, ref));
  return (rows[0] as unknown as ListingRow) ?? null;
}

export async function findListingFuzzy(query: string): Promise<ListingRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.listings)
    .where(
      or(
        like(schema.listings.referenceNumber, `%${query}%`),
        like(schema.listings.title, `%${query}%`),
        like(schema.listings.issuingBody, `%${query}%`)
      )
    );
  return (rows[0] as unknown as ListingRow) ?? null;
}

export async function insertSearchLog(query: string, tier: string): Promise<void> {
  const db = getDb();
  await db.insert(schema.searchLogs).values({ query, resultTier: tier, searchedAt: new Date().toISOString() });
}

export async function insertScamReport(data: NewScamReport): Promise<void> {
  const db = getDb();
  await db.insert(schema.scamReports).values(data);
}

export async function upsertListingByReference(listing: NewListing): Promise<void> {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.referenceNumber, listing.referenceNumber));

  if (existing[0]) {
    await db
      .update(schema.listings)
      .set(listing)
      .where(eq(schema.listings.referenceNumber, listing.referenceNumber));
  } else {
    await db.insert(schema.listings).values(listing);
  }
}

export async function updateSourceLastSync(sourceId: number, timestamp: string): Promise<void> {
  const db = getDb();
  await db.update(schema.sources).set({ lastSuccessfulSync: timestamp }).where(eq(schema.sources.id, sourceId));
}

export async function insertSource(data: Omit<SourceRow, "id">): Promise<SourceRow> {
  const db = getDb();
  const rows = await db.insert(schema.sources).values(data).returning();
  return rows[0] as unknown as SourceRow;
}

export async function listAllScamReports(): Promise<ScamReportRow[]> {
  const db = getDb();
  const rows = await db.select().from(schema.scamReports).orderBy(desc(schema.scamReports.id));
  return rows as unknown as ScamReportRow[];
}

export async function updateScamReportStatus(id: number, status: string): Promise<void> {
  const db = getDb();
  await db.update(schema.scamReports).set({ status }).where(eq(schema.scamReports.id, id));
}

export async function deletePlaceholderListings(): Promise<number> {
  const db = getDb();
  const placeholders = await db.select().from(schema.listings).where(eq(schema.listings.isPlaceholder, true));
  await db.delete(schema.listings).where(eq(schema.listings.isPlaceholder, true));
  return placeholders.length;
}

export async function deleteDemoScamReports(): Promise<number> {
  const db = getDb();
  const demos = await db
    .select()
    .from(schema.scamReports)
    .where(eq(schema.scamReports.reportedReferenceNumber, "TND-9999-FAKE"));
  await db.delete(schema.scamReports).where(eq(schema.scamReports.reportedReferenceNumber, "TND-9999-FAKE"));
  return demos.length;
}
