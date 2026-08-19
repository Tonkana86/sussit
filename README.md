# sussit — Phase 1 MVP

A platform to check whether a South African tender or job reference number is legitimate, cross-referenced against official sources and a community scam-report database.

**Status: early development build, now with one real data source connected.**

## What's real vs. placeholder (updated)

- The app itself (search, results, scam reporting, education page) is fully functional.
- **eTenders is real and connected.** National Treasury runs a public, no-authentication OCDS (Open Contracting Data Standard) REST API at `https://ocds-api.etenders.gov.za`, confirmed live on 2026-08-19 by direct API calls. `src/lib/ingest/etenders.ts` implements a sync pipeline against it, and the seed database (`src/db/seed.ts`) contains four real tender records captured verbatim from that API — real reference numbers, real municipalities/departments, real document links. These are marked `isPlaceholder: false`.
- **DPSA (job vacancies) is still not connected.** One fabricated demo job record remains (`isPlaceholder: true`, clearly badged in the UI) purely so the "job" listing type has UI test coverage. Confirming DPSA's actual data format/access is still open work.
- Provincial/municipal/SOE sources beyond what eTenders itself aggregates, and private-company verification, are still not connected — see the original project spec for that roadmap.

## IMPORTANT — sandbox network limitation (read before assuming the pipeline "works")

This build environment's own outbound network is restricted to an allowlist (npm/pip registries, etc.) and could **not** reach `ocds-api.etenders.gov.za` directly — confirmed with a direct `curl`, which got blocked at the proxy. The API's existence, live status, response shapes, and sample data were all confirmed through a separate tool with broader network access, not by running this project's own code against the internet.

Practical implications:
- `src/lib/ingest/etenders.ts` and `POST /api/admin/sync-etenders` are written to the *verified real* API contract, but have **not been executed end-to-end** in this environment.
- Before relying on this in production: run `syncEtenders()` once from an environment with normal internet access (a real deployment, or a dev machine with unrestricted network) and confirm it behaves as expected. The eTenders portal itself is explicitly in "public beta" and says its data "must not be used for any critical decision making or legal purposes" — worth keeping that framing in the app's own copy (it currently is, see `VerifyResultCard` tier messaging).
- The four seeded eTenders records are a **static snapshot from 2026-08-19** — they will look increasingly stale over time. Re-run the sync (or reseed) periodically once deployed somewhere with real network access.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **SQLite** via `better-sqlite3` + **Drizzle ORM** for local dev — chosen over Prisma because Prisma's engine binaries are fetched from `binaries.prisma.sh`, which was network-blocked in the build sandbox. Drizzle + better-sqlite3 has no such external fetch step.
- Schema lives in `src/db/schema.ts` and is written in Drizzle's `sqlite-core` dialect. Moving to Postgres for production means switching to `drizzle-orm/pg-core` table definitions (the shapes translate directly) and pointing `drizzle.config.ts` + `src/db/client.ts` at a Postgres connection instead of a local file.

## Project structure

```
src/
  app/
    page.tsx                       # Home / search
    results/page.tsx               # Verification result (server component)
    report/page.tsx                # Scam report form page
    learn/page.tsx                 # "How to spot a scam" education page
    api/verify/route.ts            # GET ?q=... verification endpoint
    api/reports/route.ts           # POST scam report submission (always queued as 'pending')
    api/admin/sync-etenders/route.ts  # POST — manually trigger a real eTenders sync (not yet auth-protected — TODO before production)
  components/
    SearchBox.tsx
    VerifyResultCard.tsx
    ReportForm.tsx
  db/
    schema.ts                       # Drizzle table definitions
    client.ts                       # DB connection
    seed.ts                         # Seeds sources + real eTenders snapshot + 1 demo job record
  lib/
    verify.ts                       # Core verification logic (confidence tiers)
    ingest/etenders.ts              # Real eTenders OCDS API sync pipeline
```

## Running locally

```bash
npm install
npm run db:push     # create tables in ./data/tenderverify.db
npm run db:seed     # populate real eTenders snapshot + demo job/scam-report data
npm run dev          # http://localhost:3000
```

To pull fresh live data instead of the static snapshot (only works from an environment with real internet access):

```bash
curl -X POST http://localhost:3000/api/admin/sync-etenders
```

## Verification logic (src/lib/verify.ts)

Three confidence tiers, deliberately conservative per the product spec:

- **confirmed** — exact or fuzzy match against a `listings` row. Real eTenders matches say so explicitly; the one remaining demo job record is clearly badged as fabricated.
- **flagged** — matches an *approved* row in `scam_reports`. Pending/rejected reports never surface publicly.
- **not_found** — no match anywhere. The UI explicitly says this doesn't mean "confirmed scam" — it may just mean the relevant source isn't integrated yet. This framing matters both for user trust and to limit defamation/liability exposure (see project spec, Section 5).

## Not yet built (next phases, per the original spec)

- Live-verified eTenders sync (see sandbox limitation above), plus DPSA and other source pipelines.
- Public scam-report database / moderation dashboard (reports currently land in the DB as `pending` with no admin UI to review them yet — that's the next thing to build).
- User accounts, alerts/subscriptions, browse-listings pages, public API.
- POPIA-compliant privacy policy, Information Officer registration, and legal review of the report-publishing model — needed before Phase 2 (public scam database) goes live with real user-submitted data.
- Auth on the `/api/admin/sync-etenders` route before any production deployment.

## About the interactive demo link

Alongside this codebase, a separate single-file HTML demo (`tenderverify_demo.html`) was delivered directly in conversation. It replicates the same search/report/learn UX entirely client-side, using the same real eTenders snapshot embedded as static JS data, so it can be opened and clicked through with no setup. It is a UI/UX preview only — it has no server, no database, and does not call the real API; the actual codebase in this folder is the real, functional deliverable.
