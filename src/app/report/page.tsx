import { ReportForm } from "@/components/ReportForm";

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Report a suspected scam</h1>
      <p className="mt-2 text-slate-600">
        Help protect others by reporting a fake tender or job. Every report is reviewed by a
        moderator before it&apos;s made public — we don&apos;t publish unverified accusations, to
        be fair to real organisations that could share a similar name.
      </p>
      <div className="mt-8">
        <ReportForm />
      </div>
    </div>
  );
}
