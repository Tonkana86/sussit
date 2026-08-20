import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "sussit — Suss out a tender or job before you trust it",
  description:
    "Type in a tender or job reference number to check it against official South African sources and community scam reports.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight text-teal-700 lowercase">
              sussit
            </Link>
            <nav className="flex gap-5 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-teal-700">
                Verify
              </Link>
              <Link href="/report" className="hover:text-teal-700">
                Report a scam
              </Link>
              <Link href="/learn" className="hover:text-teal-700">
                Spot a scam
              </Link>
              <Link href="/how-it-works" className="hover:text-teal-700">
                How it works
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500 space-y-1">
            <p>
              sussit is an independent public-interest project and is not affiliated with National
              Treasury, DPSA, or any government department.
            </p>
            <p>
              Tender data comes from National Treasury&apos;s eTenders system and the City of Cape
              Town&apos;s open data portal. Government job vacancies come from DPSA&apos;s weekly
              circular (best-effort, beta) — most job scams don&apos;t reference anything
              checkable at all, so also see our{" "}
              <Link href="/learn" className="underline hover:text-teal-700">
                scam red-flag checklist
              </Link>
              .
            </p>
            <p className="flex gap-3">
              <Link href="/privacy" className="hover:text-teal-700 underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-teal-700 underline">
                Terms of Use
              </Link>
            </p>
            <p>© 2026 Tonkana Holdings (Pty) Ltd</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
