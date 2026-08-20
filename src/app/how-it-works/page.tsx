import Link from "next/link";

export const metadata = {
  title: "How sussit works",
  description:
    "How sussit checks tender and job reference numbers against official South African sources, what it can and can't confirm yet, and where its data comes from.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
        How sussit works
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        An honest explanation of what happens when you search, what we can currently confirm, and
        what we can&apos;t yet.
      </p>

      <div className="mt-10 space-y-8 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Tenders — connected and live</h2>
          <p className="mt-2">
            Tender data comes directly from National Treasury&apos;s public eTenders system (the
            Open Contracting Data Standard API National Treasury publishes for the eTenders
            portal). Every day, sussit automatically pulls the latest tender releases from that
            API and adds them to what it checks against — so a tender that was published recently
            should be picked up within a day.
          </p>
          <p className="mt-2">
            When you search a tender reference number, company, or department name, we check it
            against everything we&apos;ve pulled from that feed. If it matches, we tell you which
            source confirmed it and link back to the original record where possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Jobs — not connected yet</h2>
          <p className="mt-2">
            Job vacancy checking, including DPSA (Department of Public Service and Administration)
            public service posts, is not connected yet. If you search a job reference number
            today, sussit will honestly tell you it couldn&apos;t find it — it will never invent or
            guess a result just to give you an answer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            3. What &ldquo;not found&rdquo; actually means
          </h2>
          <p className="mt-2">
            If sussit can&apos;t find your reference number, that does <strong>not</strong> mean
            it&apos;s a scam. It most often means one of these:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>The source that would confirm it isn&apos;t connected to sussit yet (like jobs, right now).</li>
            <li>The tender or job is real but hasn&apos;t made it into that day&apos;s data pull.</li>
            <li>The reference number was typed slightly differently than how it&apos;s listed officially.</li>
          </ul>
          <p className="mt-2">
            When we can&apos;t find something, always verify directly with the issuing organisation
            using contact details from their own official website — never from the listing or
            message you&apos;re trying to verify.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Scam reports</h2>
          <p className="mt-2">
            Separately from official sources, sussit also checks your search against a database of
            scams reported by other users. Every report is reviewed by a moderator before it&apos;s
            marked as confirmed — nothing submitted through the{" "}
            <Link href="/report" className="text-teal-700 underline font-medium">
              report a scam
            </Link>{" "}
            form goes live automatically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Sources we plan to add</h2>
          <p className="mt-2">
            DPSA job vacancies, provincial and municipal tender portals, and state-owned enterprise
            procurement listings are all on the roadmap. This page will be updated as each one goes
            live.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-slate-500">
        <Link href="/" className="text-teal-700 underline font-medium">
          ← Back to search
        </Link>
      </p>
    </div>
  );
}
