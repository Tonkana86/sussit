import { NextRequest, NextResponse } from "next/server";
import { deletePlaceholderListings, deleteDemoScamReports, deleteSourceByName } from "@/db/repo";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";

/**
 * One-time cleanup: removes fabricated demo data from the live database —
 * the placeholder job listing, the demo scam report (which was seeded as
 * "approved" and was therefore showing on the live site as if it were a
 * real flagged scam), and the now-empty "Demo/Placeholder Source" row so it
 * stops appearing in the "sources checked" list. Safe to call more than
 * once — returns 0 removed once they're gone.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }

  const removedListings = await deletePlaceholderListings();
  const removedScamReports = await deleteDemoScamReports();
  const removedSources = await deleteSourceByName("Demo/Placeholder Source");
  return NextResponse.json({ ok: true, removedListings, removedScamReports, removedSources });
}
