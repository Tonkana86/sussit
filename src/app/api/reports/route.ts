import { NextRequest, NextResponse } from "next/server";
import { insertScamReport } from "@/db/repo";

/**
 * Best-effort spam mitigation for this public, unauthenticated form.
 *
 * Rate limiting is in-memory per serverless instance, not a shared/DB store
 * — on Vercel that means it resets whenever a fresh instance spins up and
 * isn't shared across concurrent instances, so a determined spammer can
 * still get around it. It's still worth having: it stops the common case
 * (a single bot hammering the endpoint from one connection) without needing
 * a schema change or a paid CAPTCHA service. If spam becomes a real problem
 * in practice, the next step up is a proper CAPTCHA (e.g. Cloudflare
 * Turnstile, free) on the form.
 */
const submissionsByIp = new Map<string, number[]>();
const MAX_SUBMISSIONS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) ?? []).filter((t) => now - t < HOUR_MS);
  recent.push(now);
  submissionsByIp.set(ip, recent);
  // Occasionally trim the map so it doesn't grow unbounded across the
  // lifetime of a long-lived serverless instance.
  if (submissionsByIp.size > 5000) {
    for (const [key, times] of submissionsByIp) {
      if (times.every((t) => now - t > HOUR_MS)) submissionsByIp.delete(key);
    }
  }
  return recent.length > MAX_SUBMISSIONS_PER_HOUR;
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Honeypot: a field named "website" that's hidden via CSS on the real form
  // — real users never fill it in, but simple bots that auto-fill every
  // input often do. Silently accept (don't reveal the check to the bot) but
  // never actually store it.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  // Minimum time-on-page: the form records when it rendered and sends that
  // timestamp back. A submission arriving less than 2 seconds after the page
  // loaded almost certainly wasn't a human reading and filling in the form.
  const formRenderedAt = Number(body.formRenderedAt);
  if (Number.isFinite(formRenderedAt) && Date.now() - formRenderedAt < 2000) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many reports submitted recently. Please try again later." },
      { status: 429 }
    );
  }

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
