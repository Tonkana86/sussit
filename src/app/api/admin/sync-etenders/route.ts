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
    // No daysBack override here — let syncEtenders use its own default
    // (currently 90 days; see src/lib/ingest/etenders.ts). This route used to
    // hardcode 14, which silently re-introduced the narrow-window bug even
    // after the default was widened.
    const result = await syncEtenders({});
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("eTenders sync failed:", err);
    // err.cause carries the underlying network error (e.g. ECONNRESET, a TLS
    // failure, a WAF block) when the top-level message is just Node's generic
    // "fetch failed" — surface it so this is diagnosable from the browser
    // without needing server log access.
    const cause = err instanceof Error && err.cause ? String(err.cause) : undefined;
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        cause,
      },
      { status: 500 }
    );
  }
}

// Kept for backward compatibility with the earlier POST-based manual trigger.
export async function POST(request: NextRequest) {
  return GET(request);
}
