import { NextRequest, NextResponse } from "next/server";
import { verifyQuery, logSearch } from "@/lib/verify";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const result = await verifyQuery(query);

  if (query.trim()) {
    // Fire-and-forget logging; don't block the response on it.
    logSearch(query.trim(), result.tier).catch((err) =>
      console.error("Failed to log search:", err)
    );
  }

  return NextResponse.json(result);
}
