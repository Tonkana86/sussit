import { NextRequest, NextResponse } from "next/server";
import { syncEtenders } from "@/lib/ingest/etenders";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";

/**
 * eTenders sync endpoint — GET so Vercel Cron (which invokes via GET) can
 * call it directly, and so it's still easy to trigger manually from a
 * browser with ?key=... if needed between scheduled runs.
 *
 * Protected by isAuthorizedAdminRequest — either the admin key (manual) or
 * the Vercel Cron bearer secret (automatic, see vercel.json + adminAuth.ts).
 *
 * NOT exercised end-to-end against the live eTenders API during the build
 * (see src/lib/ingest/etenders.ts docstring) — the first scheduled run after
 * deploy is the real test.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }

  try {
    const result = await syncEtenders({ daysBack: 14 });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("eTenders sync failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Kept for backward compatibility with the earlier POST-based manual trigger.
export async function POST(request: NextRequest) {
  return GET(request);
}
