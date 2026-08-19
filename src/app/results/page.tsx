import Link from "next/link";
import { verifyQuery, logSearch } from "@/lib/verify";
import { VerifyResultCard } from "@/components/VerifyResultCard";
import { SearchBox } from "@/components/SearchBox";

export default async function ResultsPage({
  searchParams,
}: PageProps<"/results">) {
  const params = await searchParams;
  const rawQ = params.q;
  const q = Array.isArray(rawQ) ? rawQ[0] ?? "" : rawQ ?? "";

  const result = await verifyQuery(q);
  if (q.trim()) {
    await logSearch(q.trim(), result.tier);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-teal-700 hover:underline">
        ← New search
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">
        Result for &ldquo;{result.query}&rdquo;
      </h1>

      <div className="mt-6">
        <VerifyResultCard result={result} />
      </div>

      {result.tier !== "confirmed" && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p>
            Suspect this is a scam?{" "}
            <Link href="/report" className="text-teal-700 underline font-medium">
              Report it
            </Link>{" "}
            so we can warn others.
          </p>
        </div>
      )}

      <div className="mt-10">
        <p className="mb-2 text-sm font-medium text-slate-700">Try another search:</p>
        <SearchBox />
      </div>
    </div>
  );
}
