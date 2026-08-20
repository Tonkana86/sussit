/**
 * Shared seed data — plain objects, no drizzle/dialect specifics, so both
 * the local SQLite seed script (src/db/seed.ts) and the production Postgres
 * bootstrap endpoint (src/app/api/admin/init-db/route.ts) insert exactly the
 * same starting data.
 *
 * The eTenders records here are a REAL, VERBATIM SNAPSHOT captured live from
 * the National Treasury OCDS API (https://ocds-api.etenders.gov.za) on
 * 2026-08-19 — see src/lib/ingest/etenders.ts for how to refresh this with
 * live data once deployed somewhere with normal internet access.
 */

export interface SeedSource {
  name: string;
  baseUrl: string;
  ingestionMethod: string;
  trustTier: string;
  lastSuccessfulSync: string | null;
  notes: string;
}

export const SEED_SOURCES: SeedSource[] = [
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
];

export interface SeedListing {
  type: string;
  referenceNumber: string;
  title: string;
  issuingBody: string;
  sourceName: string; // resolved to sourceId at seed time
  sourceUrl: string | null;
  status: string;
  closingDate: string | null;
  province: string | null;
  ingestedAt: string;
  isPlaceholder: boolean;
}

export const SEED_LISTINGS: SeedListing[] = [
  {
    type: "tender",
    referenceNumber: "SCD3701/2026",
    title:
      "Annual Licenced Web-Based Power Quality Monitoring System and Maintenance of related Instruments",
    issuingBody: "Overstrand Municipality",
    sourceName: "eTenders (National Treasury)",
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
    sourceName: "eTenders (National Treasury)",
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
    sourceName: "eTenders (National Treasury)",
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
    sourceName: "eTenders (National Treasury)",
    sourceUrl:
      "https://www.etenders.gov.za/home/Download?blobName=e6b1d076-377f-4bdd-993f-ddaa5c145464.pdf",
    status: "open",
    closingDate: "2026-08-25",
    province: "North West",
    ingestedAt: "2026-08-19T10:21:34Z",
    isPlaceholder: false,
  },
  // No job listings yet — DPSA integration isn't connected. Do not add a
  // fabricated placeholder here again: an earlier version of this file did,
  // and it was seeded straight into the production database looking like a
  // real listing until manually cleaned up (see /api/admin/cleanup-demo).
];

export interface SeedScamReport {
  reportedReferenceNumber: string | null;
  reportedCompanyName: string;
  description: string;
  contactDetailsUsedByScammer: string | null;
  evidenceUrls: string | null;
  reporterEmail: string | null;
  status: string;
  moderatorNotes: string | null;
  createdAt: string;
}

// No seeded scam reports — an earlier version of this file included one
// fabricated "approved" demo report, which meant it displayed on the live
// site as if it were a real flagged scam. Real reports now only ever enter
// the system through the public report form (always "pending" until a human
// moderator approves them via /admin), which is the correct flow.
export const SEED_SCAM_REPORTS: SeedScamReport[] = [];
