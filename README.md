# sussit — live at sussit.co.za

A platform to check whether a South African tender or job reference number is legitimate, cross-referenced against official sources and a community scam-report database.

**Status: live in production**, with real eTenders data, automatic daily refresh, and a moderation dashboard for scam reports. Job vacancy checking (DPSA) is still not connected — see below.

## Deploying/updating this on Vercel (no CLI/terminal needed)

This project auto-deploys whenever new code is uploaded to the `main` branch on GitHub (Tonkana86/sussit). To update it:

1. Upload changed files via GitHub's **Add file → Upload files** (drag the whole updated folder contents in, commit to `main`).
2. Vercel picks up the push automatically and redeploys within a minute or two.
3. If you added/changed environment variables, trigger a manual **Redeploy** from the Deployments tab afterward — env var changes don't apply to already-built deployments.

Environment variables currently in use (Settings → Environment Variables in Vercel):
- `DATABASE_URL` / `POSTGRES_URL` / `DATABASE_URL_UNPOOLED` — whichever the Postgres integration created; the app checks all three names automatically (see `src/db/pg-connection.ts`).
- `ADMIN_SETUP_KEY` — shared secret protecting all `/api/admin/*` endpoints and the `/admin` moderation dashboard. Keep this private; it's effectively the site's admin password.
- `CRON_SECRET` — optional but recommended. If set, Vercel automatically sends it as a Bearer token when it triggers the scheduled eTenders sync (see `vercel.json`), which lets that scheduled job authenticate without needing `ADMIN_SETUP_KEY` embedded anywhere. Add it as a random string, same as `ADMIN_SETUP_KEY`.

## What's real vs. placeholder

- The app itself (search, results, scam reporting, education page, admin moderation dashboard) is fully functional and live.
- **eTenders is real, connected, and auto-refreshing.** National Treasury runs a public, no-authentication OCDS (Open Contracting Data Standard) REST API at `https://ocds-api.etenders.gov.za`. `src/lib/ingest/etenders.ts` syncs against it, and `vercel.json` schedules this to run automatically once a day (03:00 UTC / 05:00 SAST) via Vercel Cron — no one needs to manually trigger it. It can still be triggered manually too: `https://sussit.co.za/api/admin/sync-etenders?key=<ADMIN_SETUP_KEY>`.
- **All fabricated demo data has been removed** from both the live database (via a one-time `/api/admin/cleanup-demo` call) and the seed data itself (`src/db/seedData.ts`), so fresh deploys won't recreate it. Earlier versions had a demo job listing and a demo scam report seeded as "approved" (meaning it displayed publicly as if it were a real flagged scam) — both are gone now.
- **DPSA (job vacancies) is still not connected.** There are currently zero job listings in the system — searching a real job reference number will honestly return "not found" rather than showing anything fabricated. Confirming DPSA's actual data format/access is the next real data-source project.
- Provincial/municipal/SOE sources beyond what eTenders itself aggregates, and private-company verification, are still not connected — see the original project spec for that roadmap.

## Admin moderation dashboard

Visit `https://sussit.co.za/admin` and sign in with the `ADMIN_SETUP_KEY` value. From there:
- See every scam report ever submitted (pending, approved, rejected), newest first.
- Approve a report to make it publicly visible as a flagged scam in search results.
- Reject a report that looks unfounded, or reset one back to pending if you want to revisit it.

This is intentionally a manual, human-in-the-loop process — reports are never auto-published, because a wrong public accusation carries real defamation risk (see project spec, Section 5). There's no user-facing sign-up here; the admin key is the only access control, so treat it like a password and don't share it publicly.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Dual database backend**, auto-selected in `src/db/repo.ts` based on whether a Postgres connection string is present (checked via `src/db/pg-connection.ts`, which looks for `DATABASE_URL`, `POSTGRES_URL`, or `DATABASE_URL_UNPOOLED` in that order):
  - **Local dev (none set)**: SQLite via `better-sqlite3` + Drizzle ORM.
  - **Production (any set)**: Postgres via `pg` + Drizzle ORM (`drizzle-orm/node-postgres`) — this is what's actually running at sussit.co.za, backed by Neon via Vercel's Postgres integration.
- Both backends implement the same functions (`src/db/sqlite-repo.ts` and `src/db/pg-repo.ts`), so the rest of the app never needs to know which one is active.
- **Vercel Cron** (`vercel.json`) triggers the eTenders sync daily.

## Project structure

```
src/
  app/
    page.tsx                          # Home / search
    results/page.tsx                  # Verification result (server component)
    report/page.tsx                   # Scam report form page
    learn/page.tsx                    # "How to spot a scam" education page
    admin/page.tsx                    # Key-gated scam report moderation dashboard
    api/verify/route.ts               # GET ?q=... verification endpoint
    api/reports/route.ts              # POST scam report submission (always queued as 'pending')
    api/admin/init-db/route.ts        # GET (key-protected) — one-time Postgres table creation + seeding
    api/admin/sync-etenders/route.ts  # GET (key or cron-protected) — real eTenders sync, runs daily via Vercel Cron
    api/admin/reports/route.ts        # GET/POST (key-protected) — list reports / change their status
    api/admin/cleanup-demo/route.ts   # GET (key-protected) — one-time removal of fabricated demo data
  components/
    SearchBox.tsx
    VerifyResultCard.tsx
    ReportForm.tsx
  db/
    schema.ts                         # Drizzle table definitions (SQLite dialect)
    pg-schema.ts                      # Drizzle table definitions (Postgres dialect)
    pg-connection.ts                  # Resolves whichever Postgres env var name is actually set
    types.ts                          # Shared row types both backends return
    seedData.ts                       # Shared seed content — real eTenders snapshot only, no fabricated data
    sqlite-repo.ts                    # SQLite implementation of the repo functions
    pg-repo.ts                        # Postgres implementation of the repo functions + ensureSchema()
    repo.ts                           # Picks sqlite-repo or pg-repo — import from here, not the individual files
    client.ts                         # Raw SQLite connection (used by sqlite-repo.ts and seed.ts)
    seed.ts                           # Local SQLite dev seed script (not used in production — see init-db route)
  lib/
    verify.ts                         # Core verification logic (confidence tiers)
    adminAuth.ts                      # Shared admin-key / cron-secret check for all /api/admin/* routes
    ingest/etenders.ts                # Real eTenders OCDS API sync pipeline
```

## Running locally

```bash
npm install
npm run db:push     # create tables in ./data/tenderverify.db (SQLite)
npm run db:seed     # populate real eTenders snapshot (no demo data)
npm run dev          # http://localhost:3000
```

No `DATABASE_URL` needs to be set for local dev — its absence is exactly what tells the app to use SQLite. To test the admin dashboard locally, set `ADMIN_SETUP_KEY=anything` in your shell before running `npm run dev`, then visit `/admin` and sign in with that value.

## Verification logic (src/lib/verify.ts)

Three confidence tiers, deliberately conservative per the product spec:

- **confirmed** — exact or fuzzy match against a `listings` row.
- **flagged** — matches an *approved* row in `scam_reports`. Pending/rejected reports never surface publicly — see the admin dashboard above.
- **not_found** — no match anywhere. The UI explicitly says this doesn't mean "confirmed scam" — it may just mean the relevant source isn't integrated yet (this is currently true for ALL job searches, since DPSA isn't connected). This framing matters both for user trust and to limit defamation/liability exposure (see project spec, Section 5).

## Not yet built (next phases, per the original spec)

- DPSA job vacancy integration (currently zero job listings exist).
- Provincial/municipal/SOE sources beyond eTenders' own aggregation, and private-company verification.
- User accounts, alerts/subscriptions, browse-listings pages, public API.
- POPIA-compliant privacy policy and Information Officer registration — worth doing now that real user data (scam reports, potentially containing reporters' emails and third parties' contact details) is being collected in production.
- Visual/brand redesign, SEO content build-out, and monetization work — discussed but not yet started.
- Automated tests — everything so far has been verified by manual curl/browser checks; a real test suite would catch regressions faster as the codebase grows.

## A note on how this was built

This project was built by an AI assistant (Claude) working in a sandboxed cloud environment with restricted outbound network access — it could reach npm/GitHub but not arbitrary sites like the eTenders API or Postgres hosting providers directly from its own shell. Live facts (API existence, response shapes, current DNS/hosting behavior) were verified through a separate read-only web-fetching capability, and code was written to match those verified contracts — but several pieces (the Postgres connection, the live eTenders sync, the Vercel Cron trigger) had their *first* real end-to-end test only once actually deployed, not before. That's now happened successfully for the Postgres connection and a manual eTenders sync trigger; the automatic daily Cron-triggered sync specifically has not yet been observed running on its own schedule — worth checking Vercel's Cron logs after the first scheduled 03:00 UTC run to confirm it fires and succeeds unattended.

### Fixed: real tenders not showing up in search (2026-08-20)

A user reported that searching for real, currently-advertised tenders on the live eTenders portal returned "not found" on sussit. Investigated directly against the live OCDS API and found two real bugs in `src/lib/ingest/etenders.ts`:

1. The release-level `date` field the API returns is the tender's original *publication* date and never changes — it is not a "last updated" timestamp. The sync job only pulled releases published in the last 14 days, so any tender published earlier than that but still open for bidding (very common — many tenders stay open 21-30+ days) was invisible to sussit even though it was still live on the real eTenders site.
2. The API silently caps `PageSize` at 50 regardless of what's requested — the sync was requesting 100 and getting only 50 back per page with no error, so results were being dropped unnoticed.

Fixed by widening the default sync window to 90 days and paginating on actual page-size (loop until a page returns fewer than 50 releases) instead of a `PageSize=100` request and an unreliable `links.next` field. Because syncing upserts rather than replaces, this is safe to re-run and each daily run only adds coverage. After deploying this fix, manually trigger `https://sussit.co.za/api/admin/sync-etenders?key=<ADMIN_SETUP_KEY>` once to immediately backfill the wider window rather than waiting for the next scheduled 03:00 UTC run.
