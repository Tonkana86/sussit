import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// NOTE ON PORTABILITY: this schema uses drizzle-orm's sqlite-core dialect for
// zero-setup local development. The same table shapes map cleanly onto
// Postgres (drizzle-orm/pg-core) for production — see README "Moving to
// Postgres" section before deploying.

export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // e.g. "eTenders (National Treasury)"
  baseUrl: text("base_url").notNull(),
  ingestionMethod: text("ingestion_method").notNull(), // 'api' | 'scrape' | 'pdf-parse' | 'manual'
  trustTier: text("trust_tier").notNull(), // 'official' | 'semi-official' | 'community'
  lastSuccessfulSync: text("last_successful_sync"), // ISO timestamp, nullable
  notes: text("notes"),
});

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // 'tender' | 'job'
  referenceNumber: text("reference_number").notNull(),
  title: text("title").notNull(),
  issuingBody: text("issuing_body").notNull(),
  sourceId: integer("source_id").notNull().references(() => sources.id),
  sourceUrl: text("source_url"),
  status: text("status").notNull().default("open"), // 'open' | 'closed'
  closingDate: text("closing_date"), // ISO date, nullable
  province: text("province"), // nullable, for future filtering
  ingestedAt: text("ingested_at").notNull(),
  isPlaceholder: integer("is_placeholder", { mode: "boolean" }).notNull().default(false),
});

export const scamReports = sqliteTable("scam_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportedReferenceNumber: text("reported_reference_number"),
  reportedCompanyName: text("reported_company_name").notNull(),
  description: text("description").notNull(),
  contactDetailsUsedByScammer: text("contact_details_used_by_scammer"),
  evidenceUrls: text("evidence_urls"), // comma-separated for MVP simplicity
  reporterEmail: text("reporter_email"), // nullable — anonymous reporting allowed
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected' | 'merged'
  moderatorNotes: text("moderator_notes"),
  createdAt: text("created_at").notNull(),
});

export const searchLogs = sqliteTable("search_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  query: text("query").notNull(),
  resultTier: text("result_tier").notNull(), // 'confirmed' | 'not_found' | 'flagged'
  searchedAt: text("searched_at").notNull(),
});
