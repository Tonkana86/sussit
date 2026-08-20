import { NextRequest } from "next/server";

/**
 * Shared authorization check for admin-only endpoints. Three ways in:
 *
 * 1. `X-Admin-Key` header matching ADMIN_SETUP_KEY — used by the /admin
 *    dashboard's own buttons (see src/app/admin/page.tsx), so the key never
 *    appears in a URL, browser history, or Vercel's request-path logs.
 * 2. Manual browser/curl trigger: ?key=<value> matching ADMIN_SETUP_KEY.
 *    Kept for backward compatibility with directly visiting a sync URL, but
 *    prefer the dashboard buttons (option 1) where possible.
 * 3. Automatic Vercel Cron invocation: an `Authorization: Bearer <value>`
 *    header matching CRON_SECRET. Vercel automatically attaches this header
 *    when it invokes a route listed in vercel.json's "crons" config, IF a
 *    CRON_SECRET environment variable is set on the project — see
 *    https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
 */
export function isAuthorizedAdminRequest(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_SETUP_KEY;

  const headerKey = request.headers.get("x-admin-key");
  if (adminKey && headerKey === adminKey) return true;

  const queryKey = request.nextUrl.searchParams.get("key");
  if (adminKey && queryKey === adminKey) return true;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}
