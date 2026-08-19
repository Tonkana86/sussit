import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";

// Postgres mirror of schema.ts (sqlite-core). Column shapes match exactly;
// see schema.ts for field-by-field notes. Kept as a separate file because
// drizzle's sqlite-core and pg-core builders are not interchangeable.

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  ingestionMethod: text("ingestion_method").notNull(),
  trustTier: text("trust_tier").notNull(),
  lastSuccessfulSync: text("last_successful_sync"),
  notes: text("notes"),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  referenceNumber: text("reference_number").notNull(),
  title: text("title").notNull(),
  issuingBody: text("issuing_body").notNull(),
  sourceId: integer("source_id").notNull(),
  sourceUrl: text("source_url"),
  status: text("status").notNull().default("open"),
  closingDate: text("closing_date"),
  province: text("province"),
  ingestedAt: text("ingested_at").notNull(),
  isPlaceholder: boolean("is_placeholder").notNull().default(false),
});

export const scamReports = pgTable("scam_reports", {
  id: serial("id").primaryKey(),
  reportedReferenceNumber: text("reported_reference_number"),
  reportedCompanyName: text("reported_company_name").notNull(),
  description: text("description").notNull(),
  contactDetailsUsedByScammer: text("contact_details_used_by_scammer"),
  evidenceUrls: text("evidence_urls"),
  reporterEmail: text("reporter_email"),
  status: text("status").notNull().default("pending"),
  moderatorNotes: text("moderator_notes"),
  createdAt: text("created_at").notNull(),
});

export const searchLogs = pgTable("search_logs", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  resultTier: text("result_tier").notNull(),
  searchedAt: text("searched_at").notNull(),
});
