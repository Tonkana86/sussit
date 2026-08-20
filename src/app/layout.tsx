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
              Tender data comes from National Treasury&apos;s public eTenders system. Job vacancy
              checking (including DPSA public service posts) is still being connected.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
