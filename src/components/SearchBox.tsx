"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/results?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. a reference number, company/department name, phone number, or email"
        className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        aria-label="Tender or job reference number, or company/department name"
      />
      <button
        type="submit"
        className="rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors"
      >
        Check now
      </button>
    </form>
  );
}
