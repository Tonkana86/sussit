export const metadata = {
  title: "Terms of Use — sussit",
  description: "Terms governing use of sussit's tender and job verification service.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Use</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: 20 August 2026</p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">What sussit is</h2>
          <p className="mt-2">
            sussit (sussit.co.za), operated by Tonkana Holdings (Pty) Ltd, is a free
            public-interest tool that cross-references tender and job reference numbers, company
            and department names, and reported contact details against official public sources
            and a community-reported scam database. It is provided to help you make a more
            informed decision — it is not a legal, financial, or professional verification
            service, and using it does not create any advisory relationship.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">No guarantee of accuracy</h2>
          <p className="mt-2">
            Results are only as good as the sources we can connect to, and several real gaps
            exist — see{" "}
            <a href="/how-it-works" className="text-teal-700 underline">
              how sussit works
            </a>{" "}
            for what is and isn't currently covered. A "not found" result does NOT mean
            something is a scam — it may simply mean the relevant source isn't connected yet. A
            "confirmed" result means we found a matching official record — it does not
            guarantee every detail of your specific interaction (e.g. a person claiming to
            represent that tender or job) is legitimate. Always verify independently using
            contact details from the issuing organisation's own official website before making
            any payment or sharing personal or banking information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">User-submitted scam reports</h2>
          <p className="mt-2">
            Reports are submitted by members of the public and reviewed by a moderator before
            anything is published. We do not independently investigate every claim in a report
            beyond that review, and an approved report reflects what was reported to us, not a
            legal finding that a scam occurred. If you believe a report about your organisation
            is inaccurate, contact us using the details on our{" "}
            <a href="/privacy" className="text-teal-700 underline">
              Privacy Policy
            </a>{" "}
            page and we will review it promptly.
          </p>
          <p className="mt-2">
            You must not submit a report you know to be false, or that is intended to harass or
            defame a real person or organisation. We reserve the right to reject, remove, or
            amend any report at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Acceptable use</h2>
          <p className="mt-2">
            Don&apos;t use automated tools to scrape or bulk-query this site, attempt to
            circumvent its rate limits or security measures, or use it for any unlawful purpose.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">No liability</h2>
          <p className="mt-2">
            sussit and Tonkana Holdings (Pty) Ltd are not liable for any loss arising from your
            use of, or reliance on, this service, to the fullest extent permitted by law. This
            includes losses from inaccurate third-party source data, an incorrectly approved or
            rejected scam report, or a scam that wasn&apos;t caught by this tool.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Changes</h2>
          <p className="mt-2">
            We may update these terms as the service changes. Continued use after an update
            means you accept the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Questions about these terms:{" "}
            <a href="mailto:privacy@sussit.co.za" className="text-teal-700 underline">
              privacy@sussit.co.za
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
