import { NextRequest, NextResponse } from "next/server";
import { deletePlaceholderListings, deleteDemoScamReports } from "@/db/repo";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";

/**
 * One-time cleanup: removes fabricated demo data from the live database —
 * the placeholder job listing, and the demo scam report (which was seeded
 * as "approved" and was therefore showing on the live site as if it were a
 * real flagged scam). Safe to call more than once — returns 0 removed once
 * they're gone.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }

  const removedListings = await deletePlaceholderListings();
  const removedScamReports = await deleteDemoScamReports();
  return NextResponse.json({ ok: true, removedListings, removedScamReports });
}
