import { NextRequest, NextResponse } from "next/server";
import { syncDpsaVacancies } from "@/lib/ingest/dpsa";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";

export const maxDuration = 60; // PDF download + parse of a large multi-hundred-page document can be slow

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }

  try {
    const result = await syncDpsaVacancies();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("DPSA sync failed:", err);
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
