/**
 * Single entry point the rest of the app imports from. Picks the Postgres
 * implementation when DATABASE_URL is set (production/Vercel), otherwise
 * falls back to the local SQLite file (local dev in this build sandbox,
 * where no outbound network to any hosted Postgres exists).
 *
 * Both implementations expose the same function signatures (see
 * src/db/types.ts for the shared row shapes), so callers never need to know
 * which one is active.
 */
import * as sqliteRepo from "./sqlite-repo";
import * as pgRepo from "./pg-repo";
import { getPgConnectionString } from "./pg-connection";

const usingPg = !!getPgConnectionString();

const impl = usingPg ? pgRepo : sqliteRepo;

export const listSources = impl.listSources;
export const getSourceByName = impl.getSourceByName;
export const findApprovedScamReportMatch = impl.findApprovedScamReportMatch;
export const findListingExact = impl.findListingExact;
export const findListingFuzzy = impl.findListingFuzzy;
export const insertSearchLog = impl.insertSearchLog;
export const insertScamReport = impl.insertScamReport;
export const upsertListingByReference = impl.upsertListingByReference;
export const updateSourceLastSync = impl.updateSourceLastSync;

export const isUsingPg = usingPg;
