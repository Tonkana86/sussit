/**
 * Seed script — populates the DB with SOURCE definitions and listing data.
 *
 * The eTenders records below are a REAL, VERBATIM SNAPSHOT captured live
 * from the National Treasury OCDS API (https://ocds-api.etenders.gov.za) on
 * 2026-08-19, via a tool with outbound internet access (this project's build
 * sandbox itself could not reach that host directly — see
 * src/lib/ingest/etenders.ts for details). They are real tenders, not
 * fabricated data — isPlaceholder: false.
 *
 * This snapshot is static and will go stale. It exists so the app has real
 * demonstration data without needing to run the live sync pipeline (which
 * needs an environment with normal outbound internet access). Run
 * `syncEtenders()` from such an environment to refresh/replace this data.
 *
 * The DPSA job-circular source is still not connected — no real job listings
 * exist yet, only the one clearly-flagged demo job record kept for UI
 * testing of the "job" listing type.
 */
import { db, sqlite } from "./client";
import { sources, listings, scamReports } from "./schema";

function run() {
  console.log("Seeding database...");

  db.delete(listings).run();
  db.delete(sources).run();
  db.delete(scamReports).run();

  const now = new Date().toISOString();

  const insertedSources = db
    .insert(sources)
    .values([
      {
        name: "eTenders (National Treasury)",
        baseUrl: "https://www.etenders.gov.za",
        ingestionMethod: "api",
        trustTier: "official",
        lastSuccessfulSync: "2026-08-19T10:21:34Z",
        notes:
          "CONFIRMED LIVE: public, no-auth OCDS REST API at ocds-api.etenders.gov.za. " +
          "Listings below are a real static snapshot fetched 2026-08-19 — run syncEtenders() " +
          "from an environment with normal internet access to refresh.",
      },
      {
        name: "DPSA Public Service Vacancy Circulars",
        baseUrl: "https://www.dpsa.gov.za",
        ingestionMethod: "pdf-parse",
        trustTier: "official",
        lastSuccessfulSync: null,
        notes: "Not yet connected — still [VERIFY]. See project spec Section 4/9.",
      },
      {
        name: "Demo/Placeholder Source",
        baseUrl: "https://example.invalid",
        ingestionMethod: "manual",
        trustTier: "community",
        lastSuccessfulSync: now,
        notes: "Used only to seed the one remaining fabricated demo job listing.",
      },
    ])
    .returning()
    .all();

  const etendersSourceId = insertedSources.find((s) => s.name === "eTenders (National Treasury)")!
    .id;
  const demoSourceId = insertedSources.find((s) => s.name === "Demo/Placeholder Source")!.id;

  // Real tenders, verbatim from the live OCDS API (2026-08-19). Reference
  // numbers, buyers, dates and document URLs are all real.
  db.insert(listings)
    .values([
      {
        type: "tender",
        referenceNumber: "SCD3701/2026",
        title:
          "Annual Licenced Web-Based Power Quality Monitoring System and Maintenance of related Instruments",
        issuingBody: "Overstrand Municipality",
        sourceId: etendersSourceId,
        sourceUrl:
          "https://www.etenders.gov.za/home/Download?blobName=ce03b51b-d45e-4a6a-8755-5a30f5fcff02.docx&downloadedFileName=Blank%20Deviation.docx",
        status: "open",
        closingDate: "2026-08-20",
        province: "Western Cape",
        ingestedAt: "2026-08-19T10:21:34Z",
        isPlaceholder: false,
      },
      {
        type: "tender",
        referenceNumber: "RFQ2026-008-020",
        title:
          "REQUEST FOR PRICE QUOTATION FOR THE APPOINTMENT OF A CATERING SERVICE PROVIDER FOR THE NATIONAL LOTTERIES COMMISSION EDUCATION AND AWARENESS WORKSHOP",
        issuingBody: "National Lotteries Commission",
        sourceId: etendersSourceId,
        sourceUrl:
          "https://www.etenders.gov.za/home/Download?blobName=bc4d5f4b-e74b-4640-bdb8-7344d08c98b3.pdf",
        status: "open",
        closingDate: "2026-08-21",
        province: "Eastern Cape",
        ingestedAt: "2026-08-19T10:21:34Z",
        isPlaceholder: false,
      },
      {
        type: "tender",
        referenceNumber: "SCM2027-001",
        title: "Renovation of Tosca Rental House-A building, repairs and maintenance",
        issuingBody: "Kagisano-Molopo Local Municipality",
        sourceId: etendersSourceId,
        sourceUrl:
          "https://www.etenders.gov.za/home/Download?blobName=3c0ec74b-818b-4abc-a114-d1b4613cd229.pdf",
        status: "open",
        closingDate: "2026-08-25",
        province: "North West",
        ingestedAt: "2026-08-19T10:21:34Z",
        isPlaceholder: false,
      },
      {
        type: "tender",
        referenceNumber: "SCM2027-002",
        title: "Renovation of Tosca constituency office building - Repairs and Maintenance",
        issuingBody: "Kagisano-Molopo Local Municipality",
        sourceId: etendersSourceId,
        sourceUrl:
          "https://www.etenders.gov.za/home/Download?blobName=e6b1d076-377f-4bdd-993f-ddaa5c145464.pdf",
        status: "open",
        closingDate: "2026-08-25",
        province: "North West",
        ingestedAt: "2026-08-19T10:21:34Z",
        isPlaceholder: false,
      },
    ])
    .run();

  // The one remaining fabricated record — kept only so the "job" listing
  // type has UI test coverage until DPSA integration exists.
  db.insert(listings)
    .values([
      {
        type: "job",
        referenceNumber: "DPSA-2026-DEMO-014",
        title: "Administrative Officer: Demo Department (DEMO — DPSA not yet connected)",
        issuingBody: "Demo National Department",
        sourceId: demoSourceId,
        sourceUrl: "https://example.invalid/jobs/DPSA-2026-DEMO-014",
        status: "open",
        closingDate: "2026-09-01",
        province: "National",
        ingestedAt: now,
        isPlaceholder: true,
      },
    ])
    .run();

  db.insert(scamReports)
    .values([
      {
        reportedReferenceNumber: "TND-9999-FAKE",
        reportedCompanyName: "\"Ministry of Opportunities\" (fabricated demo name)",
        description:
          "DEMO scam report: asked applicants to pay a 'registration fee' via instant EFT to confirm a tender award. No such reference number exists on any known official source.",
        contactDetailsUsedByScammer: "demo-scammer@example.invalid",
        evidenceUrls: null,
        reporterEmail: null,
        status: "approved",
        moderatorNotes: "Seeded demo record for local development only.",
        createdAt: now,
      },
    ])
    .run();

  console.log("Seed complete.");
}

run();
sqlite.close();
