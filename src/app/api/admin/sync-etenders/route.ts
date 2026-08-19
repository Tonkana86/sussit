import { NextResponse } from "next/server";
import { syncEtenders } from "@/lib/ingest/etenders";

/**
 * Manually-triggered sync endpoint for the real eTenders OCDS pipeline.
 *
 * NOT exercised end-to-end during the build (see src/lib/ingest/etenders.ts
 * docstring) — this sandbox's network couldn't reach ocds-api.etenders.gov.za.
 * Confirm this route works from a real deployment before wiring it to a cron
 * schedule.
 *
 * TODO before production: protect this route (shared secret header or
 * platform-level cron auth) so it isn't publicly triggerable.
 */
export async function POST() {
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
