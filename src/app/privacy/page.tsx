export const metadata = {
  title: "Privacy Policy — sussit",
  description: "How sussit collects, uses, and protects personal information, in line with South Africa's POPIA.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: 20 August 2026</p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Who we are</h2>
          <p className="mt-2">
            sussit (sussit.co.za) is operated by Tonkana Holdings (Pty) Ltd, a South African
            company. This policy explains how we handle personal information in line with the
            Protection of Personal Information Act (POPIA).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">What we collect</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Search queries.</strong> When you check a reference number, company, or
              contact detail, we log the query text and the result tier (confirmed/flagged/not
              found) for the purpose of improving the service and understanding usage. We do not
              require you to identify yourself to search, and we do not link search logs to a
              person's identity.
            </li>
            <li>
              <strong>Scam reports.</strong> If you submit a report, we collect what you choose to
              tell us: the company/department name, description, any contact details you believe
              belong to the scammer, and optionally your own email address if you want updates.
              Your email is never published — only approved report content (company name,
              description, reference number if given) is shown publicly.
            </li>
            <li>
              <strong>Basic technical data.</strong> Standard web request information (e.g. IP
              address) is processed transiently to prevent abuse of the report-submission form
              (rate limiting) and is not stored in our database or linked to your identity.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Why we collect it</h2>
          <p className="mt-2">
            To operate the verification service, to review and moderate scam reports fairly
            before anything is published, to prevent abuse of the platform, and to understand
            how the service is used so we can improve it. We do not sell personal information,
            and we do not use it for marketing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Who can see report content</h2>
          <p className="mt-2">
            Every scam report is reviewed by a moderator before anything from it is made public.
            Only reports marked "approved" are shown publicly, and only the company/department
            name, description, and reference number (if given) are shown — never your email
            address or any other identifying detail about you as the reporter.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">How long we keep information</h2>
          <p className="mt-2">
            We keep scam reports and search logs for as long as they remain useful to the
            service's purpose of verifying tenders and jobs and warning others about scams.
            You can ask us to delete a report you submitted, or any personal information linked
            to it, at any time using the contact details below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Your rights</h2>
          <p className="mt-2">
            Under POPIA, you have the right to ask what personal information we hold about you,
            to request correction or deletion of it, and to object to how it's processed. To
            exercise any of these rights, contact us using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Third-party sources</h2>
          <p className="mt-2">
            Tender and job data shown as "confirmed" comes from official public sources (e.g.
            National Treasury's eTenders system, the City of Cape Town's open data portal) — see{" "}
            <a href="/how-it-works" className="text-teal-700 underline">
              how sussit works
            </a>{" "}
            for details. We are not responsible for the accuracy of data published by those
            third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact us</h2>
          <p className="mt-2">
            For any privacy question, access/correction/deletion request, or complaint, contact
            us at{" "}
            <a href="mailto:privacy@sussit.co.za" className="text-teal-700 underline">
              privacy@sussit.co.za
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
