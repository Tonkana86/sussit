import { NextRequest, NextResponse } from "next/server";
import { listAllScamReports, updateScamReportStatus } from "@/db/repo";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }
  const reports = await listAllScamReports();
  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }

  const body = await request.json();
  const id = Number(body.id);
  const status = String(body.status ?? "");

  if (!id || !["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid id or status." }, { status: 400 });
  }

  await updateScamReportStatus(id, status);
  return NextResponse.json({ ok: true });
}
