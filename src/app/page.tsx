import { SearchBox } from "@/components/SearchBox";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 mb-8 text-sm text-amber-900">
        <strong>Early access.</strong> Tenders are checked against National Treasury&apos;s live
        eTenders data. Job vacancy checking is still being connected — for now, only a demo job
        record exists so you can see how that will look.
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
        Not sure if that tender or job is real?
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        Type in the reference number, company, or department name. We check it against official
        sources and a community-reported scam database — free, always.
      </p>

      <div className="mt-8">
        <SearchBox />
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-teal-700">1. Search</p>
          <p className="mt-1 text-slate-600">
            Enter a tender/job number, or a company or department name.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-teal-700">2. Cross-check</p>
          <p className="mt-1 text-slate-600">
            We compare it against official listings and known scam reports.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-teal-700">3. Decide safely</p>
          <p className="mt-1 text-slate-600">
            Get a clear, honest answer — never asked to pay to find out.
          </p>
        </div>
      </div>

      <p className="mt-10 text-sm text-slate-500">
        Think you&apos;ve spotted a scam?{" "}
        <Link href="/report" className="text-teal-700 underline font-medium">
          Report it
        </Link>{" "}
        to help protect others. Or read{" "}
        <Link href="/learn" className="text-teal-700 underline font-medium">
          how to spot a scam
        </Link>{" "}
        yourself.
      </p>
    </div>
  );
}
