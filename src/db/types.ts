export interface SourceRow {
  id: number;
  name: string;
  baseUrl: string;
  ingestionMethod: string;
  trustTier: string;
  lastSuccessfulSync: string | null;
  notes: string | null;
}

export interface ListingRow {
  id: number;
  type: string;
  referenceNumber: string;
  title: string;
  issuingBody: string;
  sourceId: number;
  sourceUrl: string | null;
  status: string;
  closingDate: string | null;
  province: string | null;
  ingestedAt: string;
  isPlaceholder: boolean;
}

export type NewListing = Omit<ListingRow, "id">;

export interface ScamReportRow {
  id: number;
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

export type NewScamReport = Omit<ScamReportRow, "id">;
