"use client";

import { useState } from "react";

export function ReportForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      reportedCompanyName: data.get("reportedCompanyName"),
      reportedReferenceNumber: data.get("reportedReferenceNumber"),
      description: data.get("description"),
      contactDetailsUsedByScammer: data.get("contactDetailsUsedByScammer"),
      reporterEmail: data.get("reporterEmail"),
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      setStatus("done");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-lg border border-teal-300 bg-teal-50 p-5 text-teal-900">
        <p className="font-semibold">Thank you — your report has been submitted.</p>
        <p className="mt-1 text-sm">
          It will be reviewed by a moderator before appearing publicly. We don&apos;t publish
          unverified reports automatically, to be fair to legitimate organisations that might
          share a similar name.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="reportedCompanyName">
          Company / department name involved <span className="text-red-600">*</span>
        </label>
        <input
          id="reportedCompanyName"
          name="reportedCompanyName"
          required
          maxLength={300}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="reportedReferenceNumber"
        >
          Tender/job reference number (if any)
        </label>
        <input
          id="reportedReferenceNumber"
          name="reportedReferenceNumber"
          maxLength={200}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="description">
          What happened? <span className="text-red-600">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={5000}
          rows={5}
          placeholder="e.g. Asked me to pay a 'registration fee' via EFT before an interview..."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="contactDetailsUsedByScammer"
        >
          Phone number, email, or bank details the scammer used (if known)
        </label>
        <input
          id="contactDetailsUsedByScammer"
          name="contactDetailsUsedByScammer"
          maxLength={500}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="reporterEmail">
          Your email (optional — only if you want updates on this report)
        </label>
        <input
          id="reporterEmail"
          name="reporterEmail"
          type="email"
          maxLength={320}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
}
