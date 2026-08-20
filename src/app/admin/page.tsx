"use client";

import { useEffect, useState, useCallback } from "react";

interface ScamReport {
  id: number;
  reportedReferenceNumber: string | null;
  reportedCompanyName: string;
  description: string;
  contactDetailsUsedByScammer: string | null;
  reporterEmail: string | null;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-teal-100 text-teal-800",
  rejected: "bg-slate-200 text-slate-600",
};

interface ActionState {
  running: boolean;
  result: string | null;
  isError: boolean;
}

const IDLE_ACTION: ActionState = { running: false, result: null, isError: false };

export default function AdminReportsPage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [reports, setReports] = useState<ScamReport[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<Record<string, ActionState>>({
    "sync-etenders": IDLE_ACTION,
    "sync-cape-town-awards": IDLE_ACTION,
    "sync-dpsa": IDLE_ACTION,
    "sync-all": IDLE_ACTION,
    "cleanup-demo": IDLE_ACTION,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("sussit_admin_key");
    if (stored) setKey(stored);
  }, []);

  const loadReports = useCallback(async (activeKey: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reports", { headers: { "X-Admin-Key": activeKey } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load reports.");
      }
      const body = await res.json();
      setReports(body.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setReports(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (key) loadReports(key);
  }, [key, loadReports]);

  async function runAction(endpoint: string) {
    setActions((prev) => ({ ...prev, [endpoint]: { running: true, result: null, isError: false } }));
    try {
      const res = await fetch(`/api/admin/${endpoint}`, { headers: { "X-Admin-Key": key } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) {
        throw new Error(body.error ? `${body.error}${body.cause ? ` (${body.cause})` : ""}` : "Failed.");
      }
      setActions((prev) => ({
        ...prev,
        [endpoint]: { running: false, result: JSON.stringify(body), isError: false },
      }));
    } catch (err) {
      setActions((prev) => ({
        ...prev,
        [endpoint]: {
          running: false,
          result: err instanceof Error ? err.message : "Something went wrong.",
          isError: true,
        },
      }));
    }
  }

  function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("sussit_admin_key", keyInput);
    setKey(keyInput);
  }

  async function setStatus(id: number, status: string) {
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": key },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update.");
      await loadReports(key);
    } catch {
      setError("Failed to update that report. Try again.");
    }
  }

  if (!key) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="text-xl font-bold text-slate-900">Admin sign-in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the admin key (the same value set as ADMIN_SETUP_KEY) to manage scam reports.
        </p>
        <form onSubmit={handleKeySubmit} className="mt-4 flex gap-2">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Admin key"
          />
          <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">
            Go
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Scam report moderation</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem("sussit_admin_key");
            setKey("");
            setReports(null);
          }}
          className="text-sm text-slate-500 underline"
        >
          Sign out
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Only <strong>approved</strong> reports are shown to the public as flagged scams. Review each
        submission before approving — publishing an unverified accusation carries real defamation
        risk if it turns out to be wrong.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="font-semibold text-slate-900">Data sync &amp; maintenance</p>
        <p className="mt-1 text-sm text-slate-600">
          These run automatically every day — use these buttons only to trigger one immediately
          (e.g. right after a deploy) instead of waiting for the next scheduled run.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(
            [
              { endpoint: "sync-all", label: "Sync everything now" },
              { endpoint: "sync-etenders", label: "Sync eTenders only" },
              { endpoint: "sync-cape-town-awards", label: "Sync Cape Town Awards only" },
              { endpoint: "sync-dpsa", label: "Sync DPSA vacancies only" },
              { endpoint: "cleanup-demo", label: "Run demo-data cleanup" },
            ] as const
          ).map(({ endpoint, label }) => (
            <div key={endpoint}>
              <button
                onClick={() => runAction(endpoint)}
                disabled={actions[endpoint].running}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {actions[endpoint].running ? "Running..." : label}
              </button>
              {actions[endpoint].result && (
                <p
                  className={`mt-1 max-w-xs break-words text-xs ${
                    actions[endpoint].isError ? "text-red-600" : "text-teal-700"
                  }`}
                >
                  {actions[endpoint].result}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {reports && reports.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No reports yet.</p>
      )}

      <div className="mt-6 space-y-4">
        {reports?.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${STATUS_STYLES[r.status] ?? ""}`}>
                {r.status}
              </span>
              <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-3 font-semibold text-slate-900">{r.reportedCompanyName}</p>
            {r.reportedReferenceNumber && (
              <p className="text-sm text-slate-500">Reference: {r.reportedReferenceNumber}</p>
            )}
            <p className="mt-2 text-sm text-slate-700">{r.description}</p>
            {r.contactDetailsUsedByScammer && (
              <p className="mt-2 text-sm text-slate-500">
                Scammer contact details: {r.contactDetailsUsedByScammer}
              </p>
            )}
            {r.reporterEmail && (
              <p className="mt-1 text-xs text-slate-400">Reporter email: {r.reporterEmail}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStatus(r.id, "approved")}
                disabled={r.status === "approved"}
                className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                Approve
              </button>
              <button
                onClick={() => setStatus(r.id, "rejected")}
                disabled={r.status === "rejected"}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                Reject
              </button>
              {r.status !== "pending" && (
                <button
                  onClick={() => setStatus(r.id, "pending")}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600"
                >
                  Reset to pending
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
