import type { VerifyResult } from "@/lib/verify";

const TIER_STYLES: Record<VerifyResult["tier"], { label: string; classes: string }> = {
  confirmed: {
    label: "Matched",
    classes: "border-teal-300 bg-teal-50 text-teal-900",
  },
  flagged: {
    label: "⚠ Flagged as a likely scam",
    classes: "border-red-300 bg-red-50 text-red-900",
  },
  not_found: {
    label: "Not found in checked sources",
    classes: "border-amber-300 bg-amber-50 text-amber-900",
  },
};

export function VerifyResultCard({ result }: { result: VerifyResult }) {
  const style = TIER_STYLES[result.tier];

  return (
    <div className={`rounded-xl border p-5 ${style.classes}`}>
      <p className="text-sm font-semibold uppercase tracking-wide">{style.label}</p>
      <p className="mt-2 text-base">{result.message}</p>

      {result.listings && result.listings.length > 0 && (
        <div className="mt-4 space-y-3">
          {result.listings.length > 1 && (
            <p className="text-sm font-semibold text-slate-700">
              {result.listings.length} matches found:
            </p>
          )}
          {result.listings.map((listing, i) => (
            <div key={`${listing.referenceNumber}-${i}`} className="rounded-lg bg-white/70 p-4 text-sm text-slate-800 space-y-1">
              {listing.isPlaceholder && (
                <p className="mb-2 inline-block rounded bg-slate-800 px-2 py-0.5 text-xs font-bold uppercase text-white">
                  Demo data — not real
                </p>
              )}
              <p>
                <span className="font-semibold">Title:</span> {listing.title}
              </p>
              <p>
                <span className="font-semibold">Reference:</span> {listing.referenceNumber}
              </p>
              <p>
                <span className="font-semibold">Issuing body:</span> {listing.issuingBody}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {listing.status}
              </p>
              {listing.closingDate && (
                <p>
                  <span className="font-semibold">Closing date:</span> {listing.closingDate}
                </p>
              )}
              <p>
                <span className="font-semibold">Source:</span> {listing.sourceName}
              </p>
              {listing.sourceUrl && (
                <p>
                  <a
                    href={listing.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline"
                  >
                    View original listing →
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {result.matchedScamReport && (
        <div className="mt-4 rounded-lg bg-white/70 p-4 text-sm text-slate-800 space-y-1">
          <p>
            <span className="font-semibold">Reported as:</span>{" "}
            {result.matchedScamReport.reportedCompanyName}
          </p>
          <p>
            <span className="font-semibold">Details:</span> {result.matchedScamReport.description}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Sources checked: {result.sourcesChecked.join(", ") || "none configured"}
      </p>
    </div>
  );
}
