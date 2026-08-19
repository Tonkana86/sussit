import { NextRequest, NextResponse } from "next/server";
import { insertScamReport } from "@/db/repo";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const reportedCompanyName = String(body.reportedCompanyName ?? "").trim();
  const description = String(body.description ?? "").trim();

  if (!reportedCompanyName || !description) {
    return NextResponse.json(
      { error: "Company/department name and description are required." },
      { status: 400 }
    );
  }

  if (description.length > 5000 || reportedCompanyName.length > 300) {
    return NextResponse.json({ error: "Input too long." }, { status: 400 });
  }

  const reportedReferenceNumber = body.reportedReferenceNumber
    ? String(body.reportedReferenceNumber).trim().slice(0, 200)
    : null;
  const contactDetailsUsedByScammer = body.contactDetailsUsedByScammer
    ? String(body.contactDetailsUsedByScammer).trim().slice(0, 500)
    : null;
  const reporterEmail = body.reporterEmail
    ? String(body.reporterEmail).trim().slice(0, 320)
    : null;

  await insertScamReport({
    reportedReferenceNumber,
    reportedCompanyName: reportedCompanyName.slice(0, 300),
    description: description.slice(0, 5000),
    contactDetailsUsedByScammer,
    evidenceUrls: null,
    reporterEmail,
    status: "pending", // always queued for moderation — never auto-published
    moderatorNotes: null,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
