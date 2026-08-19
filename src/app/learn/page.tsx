const TIPS = [
  {
    title: "Genuine employers and tender bodies never ask you to pay",
    body: "No legitimate department, SOE, or company charges an application, registration, 'processing', or 'training' fee to apply for a job or bid on a tender. Any request for upfront payment is a scam.",
  },
  {
    title: "Check the reference number against an official source",
    body: "Real tenders and public-service jobs have reference numbers you can look up on the issuing organisation's own website — not just in the email or Facebook post you received.",
  },
  {
    title: "Be wary of urgency and pressure",
    body: "Scammers create false urgency ('respond within 2 hours or lose the opportunity') to stop you thinking it through or checking elsewhere.",
  },
  {
    title: "Look closely at the email address and domain",
    body: "Scammers use addresses that look almost right (e.g. @gov-sa.co.za instead of a real .gov.za domain, or a free Gmail/Yahoo address claiming to be a government department).",
  },
  {
    title: "Never send your ID, banking details, or OTPs to confirm an application",
    body: "Legitimate recruitment and tender processes don't need your one-time PIN, internet banking password, or card details at any stage.",
  },
  {
    title: "Cross-check through a second, independent channel",
    body: "Call the organisation using a phone number from their official website (not one given in the message) to confirm the vacancy or tender actually exists.",
  },
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">How to spot a tender or job scam</h1>
      <p className="mt-2 text-slate-600">
        A quick reference while we keep building out full source verification.
      </p>

      <div className="mt-8 space-y-5">
        {TIPS.map((tip) => (
          <div key={tip.title} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-semibold text-teal-700">{tip.title}</p>
            <p className="mt-1 text-sm text-slate-600">{tip.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        If you&apos;ve already lost money or shared personal/banking details, report it to your
        bank immediately, and consider reporting to the South African Police Service.
      </div>
    </div>
  );
}
