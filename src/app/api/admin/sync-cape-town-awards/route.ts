import { NextRequest, NextResponse } from "next/server";
import { syncCapeTownAwards } from "@/lib/ingest/capeTownAwards";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";

/**
 * Cape Town Tender Awards sync endpoint — same pattern as
 * /api/admin/sync-etenders: GET so Vercel Cron can call it directly, key- or
 * cron-secret protected, safe to re-run (upserts).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }

  try {
    const result = await syncCapeTownAwards({});
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Cape Town Tender Awards sync failed:", err);
    const cause = err instanceof Error && err.cause ? String(err.cause) : undefined;
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error", cause },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
