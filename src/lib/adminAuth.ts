import { NextRequest } from "next/server";

/**
 * Shared authorization check for admin-only endpoints. Two ways in:
 *
 * 1. Manual browser/curl trigger: ?key=<value> matching ADMIN_SETUP_KEY.
 * 2. Automatic Vercel Cron invocation: an `Authorization: Bearer <value>`
 *    header matching CRON_SECRET. Vercel automatically attaches this header
 *    when it invokes a route listed in vercel.json's "crons" config, IF a
 *    CRON_SECRET environment variable is set on the project — see
 *    https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 *    (this exact mechanism could not be tested live from the build sandbox;
 *    verify the first scheduled run actually succeeds after deploy).
 */
export function isAuthorizedAdminRequest(request: NextRequest): boolean {
  const key = request.nextUrl.searchParams.get("key");
  const adminKey = process.env.ADMIN_SETUP_KEY;
  if (adminKey && key === adminKey) return true;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}
