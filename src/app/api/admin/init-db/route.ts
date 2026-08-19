import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, countSources, insertSource, insertScamReport, upsertListingByReference } from "@/db/pg-repo";
import { SEED_SOURCES, SEED_LISTINGS, SEED_SCAM_REPORTS } from "@/db/seedData";

/**
 * One-time, browser-triggerable Postgres setup — designed so a non-technical
 * person can bootstrap the production database with no CLI/terminal usage:
 * just visit this URL once (with the correct key) after connecting a
 * Postgres database in Vercel.
 *
 * Creates all tables if missing, and seeds them with the real eTenders
 * snapshot + demo records if the database is currently empty. Safe to visit
 * more than once — it will not duplicate the seed data on repeat visits.
 *
 * Protected by a shared-secret query param (?key=...) checked against the
 * ADMIN_SETUP_KEY environment variable, so this can't be triggered by
 * random visitors/bots even though it's a GET request for easy browser use.
 *
 * NOT exercised against a real Postgres instance in the build sandbox (no
 * outbound network to any Postgres host from here) — the SQL/logic is
 * straightforward, but this is the first thing to verify after a real
 * deploy.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const expectedKey = process.env.ADMIN_SETUP_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { error: "ADMIN_SETUP_KEY is not configured on the server. Set it as an environment variable in Vercel first." },
      { status: 500 }
    );
  }

  if (!key || key !== expectedKey) {
    return NextResponse.json({ error: "Missing or incorrect key." }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set — connect a Postgres database in Vercel first." },
      { status: 500 }
    );
  }

  try {
    await ensureSchema();

    const existingSourceCount = await countSources();
    let seeded = false;

    if (existingSourceCount === 0) {
      const now = new Date().toISOString();
      const nameToId: Record<string, number> = {};

      for (const s of SEED_SOURCES) {
        const inserted = await insertSource({
          name: s.name,
          baseUrl: s.baseUrl,
          ingestionMethod: s.ingestionMethod,
          trustTier: s.trustTier,
          lastSuccessfulSync: s.lastSuccessfulSync,
          notes: s.notes,
        });
        nameToId[s.name] = inserted.id;
      }

      for (const l of SEED_LISTINGS) {
        const sourceId = nameToId[l.sourceName];
        if (!sourceId) continue;
        await upsertListingByReference({
          type: l.type,
          referenceNumber: l.referenceNumber,
          title: l.title,
          issuingBody: l.issuingBody,
          sourceId,
          sourceUrl: l.sourceUrl,
          status: l.status,
          closingDate: l.closingDate,
          province: l.province,
          ingestedAt: l.ingestedAt || now,
          isPlaceholder: l.isPlaceholder,
        });
      }

      for (const r of SEED_SCAM_REPORTS) {
        await insertScamReport({
          reportedReferenceNumber: r.reportedReferenceNumber,
          reportedCompanyName: r.reportedCompanyName,
          description: r.description,
          contactDetailsUsedByScammer: r.contactDetailsUsedByScammer,
          evidenceUrls: r.evidenceUrls,
          reporterEmail: r.reporterEmail,
          status: r.status,
          moderatorNotes: r.moderatorNotes,
          createdAt: r.createdAt || now,
        });
      }

      seeded = true;
    }

    return NextResponse.json({
      ok: true,
      tablesReady: true,
      seeded,
      message: seeded
        ? "Tables created and seed data inserted."
        : "Tables already existed with data — skipped re-seeding to avoid duplicates.",
    });
  } catch (err) {
    console.error("init-db failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
