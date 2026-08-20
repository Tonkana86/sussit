import { NextRequest, NextResponse } from "next/server";
import { syncEtenders } from "@/lib/ingest/etenders";
import { syncCapeTownAwards } from "@/lib/ingest/capeTownAwards";
import { syncDpsaVacancies } from "@/lib/ingest/dpsa";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";

export const maxDuration = 60;

/**
 * Runs every data sync in one request. This exists because Vercel's Hobby
 * plan caps how many separate scheduled Cron Jobs a project can have (2 at
 * last check) — rather than needing a paid plan just to add a third data
 * source, vercel.json points its single daily cron at this endpoint, which
 * runs all three syncs in sequence. Each sync's failure is caught
 * independently so one broken source (e.g. DPSA's page structure changing)
 * doesn't stop the other two from running. The individual /api/admin/sync-*
 * endpoints still exist and are what the /admin dashboard's individual
 * buttons call, for manually re-running just one source.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  for (const [name, fn] of [
    ["etenders", () => syncEtenders({})],
    ["capeTownAwards", () => syncCapeTownAwards({})],
    ["dpsa", () => syncDpsaVacancies()],
  ] as const) {
    try {
      results[name] = { ok: true, ...(await fn()) };
    } catch (err) {
      console.error(`${name} sync failed:`, err);
      results[name] = { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  return NextResponse.json({ ok: true, results });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
