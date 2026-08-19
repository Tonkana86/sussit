# sussit — Phase 1 MVP

A platform to check whether a South African tender or job reference number is legitimate, cross-referenced against official sources and a community scam-report database.

**Status: early development build, with one real data source connected and Postgres support for production deployment.**

## Deploying this to Vercel (no CLI/terminal needed)

1. **Push this code to GitHub** if you haven't already (it should already be at your `sussit` repo).
2. **Sign up at vercel.com**, ideally via "Continue with GitHub" so it can see your repos.
3. **Import the project**: from the Vercel dashboard, click "Add New" → "Project", and select the `sussit` repo.
4. **Add a Postgres database**: in the project's Vercel dashboard, go to the "Storage" tab and add a Postgres database (Vercel's own integration, backed by Neon, works well and has a free tier). This automatically sets a `DATABASE_URL` (or similarly named) environment variable for you — check the exact variable name it creates and make sure it's called `DATABASE_URL` in your project's Environment Variables settings, renaming/aliasing it if Vercel named it something else.
5. **Set one more environment variable**: `ADMIN_SETUP_KEY` — make up any long random password-like string. This protects the one-time database setup step below from randoms on the internet.
6. **Deploy** (Vercel does this automatically on import, and on every future push to the repo).
7. **Run the one-time database setup** by visiting, in your browser:
   `https://<your-deployed-url>/api/admin/init-db?key=<the ADMIN_SETUP_KEY you set>`
   This creates all the database tables and loads the starting data (the real eTenders snapshot + demo records). You only need to do this once — visiting it again is safe and won't duplicate data.
8. **Connect your domain**: in the project's "Domains" settings, add `sussit.co.za`, then add the DNS records Vercel shows you into your GoDaddy account's DNS settings for that domain.

That's the whole deploy — no terminal commands required at any point.

## What's real vs. placeholder

- The app itself (search, results, scam reporting, education page) is fully functional.
- **eTenders is real and connected.** National Treasury runs a public, no-authentication OCDS (Open Contracting Data Standard) REST API at `https://ocds-api.etenders.gov.za`, confirmed live on 2026-08-19 by direct API calls. `src/lib/ingest/etenders.ts` implements a sync pipeline against it, and the seed data (`src/db/seedData.ts`) contains four real tender records captured verbatim from that API — real reference numbers, real municipalities/departments, real document links. These are marked `isPlaceholder: false`.
- **DPSA (job vacancies) is still not connected.** One fabricated demo job record remains (`isPlaceholder: true`, clearly badged in the UI) purely so the "job" listing type has UI test coverage. Confirming DPSA's actual data format/access is still open work.
- Provincial/municipal/SOE sources beyond what eTenders itself aggregates, and private-company verification, are still not connected — see the original project spec for that roadmap.

## IMPORTANT — sandbox network limitation (read before assuming the pipeline "works")

This project was built in a sandboxed environment whose own outbound network is restricted to an allowlist (npm registries, GitHub, a couple of others) and could **not** reach `ocds-api.etenders.gov.za` or any Postgres hosting provider (Vercel, Neon, Supabase, Render, Netlify) directly — confirmed with direct connection attempts, all blocked at the network proxy. The eTenders API's existence, live status, response shapes, and sample data were all confirmed through a separate tool with broader (but read-only, fetch-style) network access — not by running this project's own code against the internet.

Practical implications:
- `src/lib/ingest/etenders.ts`, `src/db/pg-repo.ts`, and the `/api/admin/*` routes are written to verified real contracts (the OCDS API shape; standard Postgres/SQL), but have **not been executed end-to-end against a live Postgres database or the live eTenders API** from this build environment.
- The **first real test of the Postgres path is the actual deployment** — running `/api/admin/init-db` after connecting a database in Vercel is simultaneously "setting up the database" and "the first live test that this code works." If it errors, the error message returned should say what went wrong; it's the first thing to debug.
- The four seeded eTenders records are a **static snapshot from 2026-08-19** — they will look increasingly stale over time. Re-run `/api/admin/sync-etenders` (see below) periodically once deployed.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Dual database backend**, selected automatically via the `DATABASE_URL` environment variable (see `src/db/repo.ts`):
  - **Local dev (no `DATABASE_URL` set)**: SQLite via `better-sqlite3` + Drizzle ORM. Chosen over Prisma because Prisma's engine binaries are fetched from `binaries.prisma.sh`, which was network-blocked in the build sandbox.
  - **Production (`DATABASE_URL` set)**: Postgres via `pg` + Drizzle ORM (`drizzle-orm/node-postgres`). This is what Vercel's database integrations provide.
- Both backends implement the same functions (`src/db/sqlite-repo.ts` and `src/db/pg-repo.ts`), so the rest of the app (`src/lib/verify.ts`, `src/lib/ingest/etenders.ts`, the API routes) doesn't need to know or care which one is active — it always imports from `src/db/repo.ts`.

## Project structure

```
src/
  app/
    page.tsx                          # Home / search
    results/page.tsx                  # Verification result (server component)
    report/page.tsx                   # Scam report form page
    learn/page.tsx                    # "How to spot a scam" education page
    api/verify/route.ts               # GET ?q=... verification endpoint
    api/reports/route.ts              # POST scam report submission (always queued as 'pending')
    api/admin/init-db/route.ts        # GET (key-protected) — one-time Postgres table creation + seeding
    api/admin/sync-etenders/route.ts  # POST — manually trigger a real eTenders sync (not yet auth-protected — TODO before production)
  components/
    SearchBox.tsx
    VerifyResultCard.tsx
    ReportForm.tsx
  db/
    schema.ts                         # Drizzle table definitions (SQLite dialect)
    pg-schema.ts                      # Drizzle table definitions (Postgres dialect)
    types.ts                          # Shared row types both backends return
    seedData.ts                       # Shared seed content (real eTenders snapshot + demo records)
    sqlite-repo.ts                    # SQLite implementation of the repo functions
    pg-repo.ts                        # Postgres implementation of the repo functions + ensureSchema()
    repo.ts                           # Picks sqlite-repo or pg-repo based on DATABASE_URL — import from here
    client.ts                         # Raw SQLite connection (used by sqlite-repo.ts and seed.ts)
    seed.ts                           # Local SQLite dev seed script (not used in production — see init-db route)
  lib/
    verify.ts                         # Core verification logic (confidence tiers)
    ingest/etenders.ts                # Real eTenders OCDS API sync pipeline
```

## Running locally

```bash
npm install
npm run db:push     # create tables in ./data/tenderverify.db (SQLite)
npm run db:seed     # populate real eTenders snapshot + demo job/scam-report data
npm run dev          # http://localhost:3000
```

No `DATABASE_URL` needs to be set for local dev — its absence is exactly what tells the app to use SQLite.

To pull fresh live eTenders data instead of the static snapshot (works from any environment with real internet access, local or deployed):

```bash
curl -X POST http://localhost:3000/api/admin/sync-etenders
```

## Verification logic (src/lib/verify.ts)

Three confidence tiers, deliberately conservative per the product spec:

- **confirmed** — exact or fuzzy match against a `listings` row. Real eTenders matches say so explicitly; the one remaining demo job record is clearly badged as fabricated.
- **flagged** — matches an *approved* row in `scam_reports`. Pending/rejected reports never surface publicly.
- **not_found** — no match anywhere. The UI explicitly says this doesn't mean "confirmed scam" — it may just mean the relevant source isn't integrated yet. This framing matters both for user trust and to limit defamation/liability exposure (see project spec, Section 5).

## Not yet built (next phases, per the original spec)

- Live-verified eTenders sync in an actual production run (see sandbox limitation above), plus DPSA and other source pipelines.
- Public scam-report database / moderation dashboard (reports currently land in the DB as `pending` with no admin UI to review them yet — that's the next thing to build).
- User accounts, alerts/subscriptions, browse-listings pages, public API.
- POPIA-compliant privacy policy, Information Officer registration, and legal review of the report-publishing model — needed before Phase 2 (public scam database) goes live with real user-submitted data.
- Auth on the `/api/admin/sync-etenders` route before any production deployment (currently unprotected — anyone who finds the URL could trigger a sync; low risk since it's idempotent and read-mostly, but still worth locking down the same way `/api/admin/init-db` is).
- Visual/brand redesign, SEO content build-out, and monetization work — all discussed but not yet started.

## About the interactive demo link

Alongside this codebase, a separate single-file HTML demo (`sussit_demo.html`) was delivered directly in conversation. It replicates the same search/report/learn UX entirely client-side, using the same real eTenders snapshot embedded as static JS data, so it can be opened and clicked through with no setup. It is a UI/UX preview only — it has no server, no database, and does not call the real API; the actual codebase in this folder is the real, functional deliverable.
