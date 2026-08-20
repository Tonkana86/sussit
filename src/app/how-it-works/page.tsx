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
            Tender data currently comes from two official, free, public sources:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>National Treasury eTenders</strong> — the Open Contracting Data Standard API
              National Treasury publishes for the central eTenders portal. Covers tenders from
              government departments and entities that publish through eTenders.
            </li>
            <li>
              <strong>City of Cape Town&apos;s open data portal</strong> — a public, no-login feed of
              City of Cape Town supply chain tender award decisions. This covers award
              decisions specifically (who won, and the outcome), not tenders currently open for
              bidding, so a match here confirms the reference number is real, not that it&apos;s
              still open.
            </li>
          </ul>
          <p className="mt-2">
            Every day, sussit automatically pulls the latest data from both feeds. When you search
            a tender reference number, company, or department name, we check it against everything
            pulled from these sources. If it matches, we tell you which source confirmed it and
            link back to the original record where possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Jobs — partially connected, and an honest limitation</h2>
          <p className="mt-2">
            sussit now pulls government job postings from DPSA&apos;s (Department of Public
            Service and Administration) weekly Public Service Vacancy Circular, so a real,
            current government job reference number has a good chance of being confirmed. This is
            a newer, best-effort source — DPSA only publishes it as a PDF document rather than a
            proper data feed, so we extract listings from that document automatically and skip
            anything ambiguous rather than risk showing you a wrong result.
          </p>
          <p className="mt-2">
            More importantly: research into how South African job scams actually work found that
            <strong> most job scams don&apos;t reference a real, checkable number at all</strong> —
            they usually arrive over WhatsApp or social media, often from a free email address,
            asking for money upfront. A reference-number search genuinely can&apos;t catch those,
            no matter how complete our data gets. For that far more common case, use the{" "}
            <Link href="/learn" className="text-teal-700 underline font-medium">
              red-flag checklist
            </Link>{" "}
            instead — and you can also search a phone number, email address, or bank detail from
            a suspicious message directly in the box on the home page, which checks it against
            what other people have reported.
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
            scams reported by other users — matching against the reported company/department name,
            reference number, and any phone number, email, or bank detail included in the report.
            Every report is reviewed by a moderator before it&apos;s marked as confirmed — nothing
            submitted through the{" "}
            <Link href="/report" className="text-teal-700 underline font-medium">
              report a scam
            </Link>{" "}
            form goes live automatically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Sources we plan to add</h2>
          <p className="mt-2">
            Other provincial and municipal tender portals, and state-owned enterprise procurement
            listings (Eskom, Transnet, SANRAL, and others) are on the roadmap. Most of these don&apos;t
            offer a public data feed the way eTenders, Cape Town, and DPSA do, so adding them takes
            more work — this page will be updated honestly as each one actually goes live, not
            before.
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
