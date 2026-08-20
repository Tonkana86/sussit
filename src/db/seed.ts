/**
 * Local SQLite seed script (dev only). Production/Postgres bootstrapping
 * happens via GET /api/admin/init-db instead — see that route and
 * src/db/seedData.ts (the shared source of truth for seed content) for
 * details on what's real eTenders data vs. fabricated demo data.
 */
import { db, sqlite } from "./client";
import { sources, listings, scamReports } from "./schema";
import { SEED_SOURCES, SEED_LISTINGS, SEED_SCAM_REPORTS } from "./seedData";

function run() {
  console.log("Seeding database...");

  db.delete(listings).run();
  db.delete(sources).run();
  db.delete(scamReports).run();

  const now = new Date().toISOString();

  const insertedSources = db
    .insert(sources)
    .values(
      SEED_SOURCES.map((s) => ({
        name: s.name,
        baseUrl: s.baseUrl,
        ingestionMethod: s.ingestionMethod,
        trustTier: s.trustTier,
        lastSuccessfulSync: s.lastSuccessfulSync,
        notes: s.notes,
      }))
    )
    .returning()
    .all();

  const nameToId = Object.fromEntries(insertedSources.map((s) => [s.name, s.id]));

  db.insert(listings)
    .values(
      SEED_LISTINGS.map((l) => ({
        type: l.type,
        referenceNumber: l.referenceNumber,
        title: l.title,
        issuingBody: l.issuingBody,
        sourceId: nameToId[l.sourceName],
        sourceUrl: l.sourceUrl,
        status: l.status,
        closingDate: l.closingDate,
        province: l.province,
        ingestedAt: l.ingestedAt || now,
        isPlaceholder: l.isPlaceholder,
      }))
    )
    .run();

  if (SEED_SCAM_REPORTS.length > 0) {
    db.insert(scamReports)
      .values(
        SEED_SCAM_REPORTS.map((r) => ({
          reportedReferenceNumber: r.reportedReferenceNumber,
          reportedCompanyName: r.reportedCompanyName,
          description: r.description,
          contactDetailsUsedByScammer: r.contactDetailsUsedByScammer,
          evidenceUrls: r.evidenceUrls,
          reporterEmail: r.reporterEmail,
          status: r.status,
          moderatorNotes: r.moderatorNotes,
          createdAt: r.createdAt || now,
        }))
      )
      .run();
  }

  console.log("Seed complete.");
}

run();
sqlite.close();
