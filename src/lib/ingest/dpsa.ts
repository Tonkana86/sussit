/**
 * DPSA (Department of Public Service and Administration) Public Service
 * Vacancy Circular ingestion — the one real "job" data source this platform
 * currently has.
 *
 * IMPORTANT — set expectations correctly (see /how-it-works and README):
 * this only catches the minority of job scams that impersonate a real,
 * checkable government reference number. Research done on 2026-08-20 found
 * that most real South African job scams are distributed via WhatsApp/social
 * media, use free webmail, and cite no verifiable reference at all — those
 * are better caught by the red-flag checklist on /learn, not a lookup tool.
 * This is still worth having as one layer, just not oversold as "job
 * verification is now solved."
 *
 * DPSA publishes this weekly as a PDF ONLY — no API, RSS, or structured
 * feed exists (confirmed directly against dpsa.gov.za). This module:
 *   1. Scrapes the circular index page for the most recent PDF link.
 *   2. Downloads and parses that PDF's text.
 *   3. Extracts individual vacancy entries with a conservative, best-effort
 *      parser — designed to skip anything ambiguous rather than risk
 *      inserting a wrong reference number, since this is a scam-verification
 *      tool where a false "confirmed" match is worse than a missed one.
 *
 * CAVEAT: the exact HTML structure of the DPSA index page, and the precise
 * text layout pdf-parse produces from the real circular PDF, could not be
 * fully verified from this build environment (no direct outbound network to
 * dpsa.gov.za from the sandbox's shell — only a separate, LLM-mediated
 * fetch tool was available for research, which cannot guarantee byte-exact
 * text extraction). The parsing logic below is built from a real sample of
 * the circular's structure, but the FIRST live sync after deploy is the
 * real test — check its `totalUpserted` / `skipped` counts and spot-check a
 * couple of resulting listings against the actual circular before trusting
 * this source the way eTenders and Cape Town are trusted.
 */

import { PDFParse } from "pdf-parse";
import { getOrCreateSource, upsertListingByReference } from "@/db/repo";
import { updateSourceLastSync } from "@/db/repo";

const INDEX_URL = "https://www.dpsa.gov.za/newsroom/psvc/";
const SOURCE_NAME = "DPSA Public Service Vacancy Circular";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/pdf,application/xhtml+xml,*/*",
};

async function findLatestCircularPdfUrl(): Promise<string> {
  const res = await fetch(INDEX_URL, { headers: BROWSER_HEADERS });
  if (!res.ok) {
    throw new Error(`DPSA index page returned ${res.status}`);
  }
  const html = await res.text();

  // Tolerant match: any href containing "circular" and ending in .pdf,
  // rather than assuming one exact path pattern, since DPSA's own URL
  // structure could shift.
  const hrefRegex = /href="([^"]*circular[^"]*\.pdf)"/gi;
  const candidates: { url: string; year: number; num: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = hrefRegex.exec(html))) {
    const raw = m[1];
    const url = raw.startsWith("http") ? raw : new URL(raw, "https://www.dpsa.gov.za").toString();
    const numMatch = decodeURIComponent(raw).match(/circular\s*(\d+)\s*of\s*(\d{4})/i);
    candidates.push({
      url,
      num: numMatch ? Number(numMatch[1]) : 0,
      year: numMatch ? Number(numMatch[2]) : 0,
    });
  }

  if (candidates.length === 0) {
    throw new Error(
      "Could not find any circular PDF link on the DPSA index page — its HTML structure may have changed."
    );
  }

  // Pick the highest (year, circular number) — the most recent circular.
  candidates.sort((a, b) => (b.year - a.year) || (b.num - a.num));
  return candidates[0].url;
}

interface ParsedEntry {
  referenceNumber: string;
  title: string;
  department: string;
  closingDate: string | null;
}

const MONTH_NAMES =
  "January|February|March|April|May|June|July|August|September|October|November|December";
const DATE_REGEX = new RegExp(`\\d{1,2}\\s+(?:${MONTH_NAMES})\\s+\\d{4}`, "i");

function parseClosingDate(text: string): string | null {
  const match = text.match(DATE_REGEX);
  if (!match) return null;
  const parsed = new Date(match[0]);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

const LABEL_BOUNDARY = /(?:SALARY|CENTRE|CENTRES|REQUIREMENTS|DUTIES|ENQUIRIES|APPLICATIONS|NOTE)\s*:?/i;

function cleanField(raw: string, maxLen: number): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

/**
 * Extracts vacancy entries from the full text of one circular PDF.
 * Deliberately skips anything that doesn't clearly resolve to both a
 * reference number and a title — see module docstring on why.
 */
export function parseCircularText(fullText: string): { entries: ParsedEntry[]; skipped: number } {
  // Drop standalone page-number lines (a lone number on its own line) that
  // pdf-parse leaves behind from the paginated layout.
  const text = fullText.replace(/\n\s*\d{1,4}\s*\n/g, "\n");

  const entries: ParsedEntry[] = [];
  let skipped = 0;

  // Segment by department: "DEPARTMENT OF <NAME>" headers.
  const deptRegex = /DEPARTMENT OF ([A-Z][A-Z ,'&\-]{2,80})/g;
  const deptMatches = [...text.matchAll(deptRegex)];

  for (let d = 0; d < deptMatches.length; d++) {
    const deptMatch = deptMatches[d];
    const department = cleanField(deptMatch[1], 120);
    const blockStart = deptMatch.index ?? 0;
    const blockEnd = d + 1 < deptMatches.length ? (deptMatches[d + 1].index ?? text.length) : text.length;
    const block = text.slice(blockStart, blockEnd);

    // Department-level closing date applies to every post in the block
    // unless a post overrides it — we don't attempt the override case
    // (rare, and safer to under-specify than guess wrong).
    const closingDateSection = block.slice(0, Math.min(block.length, 2000));
    const departmentClosingDate = parseClosingDate(closingDateSection);

    const postRegex = /POST\s+\d+\/\d+\s*:/g;
    const postMatches = [...block.matchAll(postRegex)];

    for (let p = 0; p < postMatches.length; p++) {
      const postMatch = postMatches[p];
      const entryStart = postMatch.index ?? 0;
      const entryEnd = p + 1 < postMatches.length ? (postMatches[p + 1].index ?? block.length) : block.length;
      // Cap entry length defensively — a missing boundary shouldn't let one
      // "entry" swallow the rest of the document.
      const entry = block.slice(entryStart, Math.min(entryEnd, entryStart + 3000));

      // Capture the reference number from the same line as "REF NO:" first
      // — this is the common case and safest, since going further risks
      // sweeping up unrelated text (department entries commonly have free
      // text like "Branch: ..." / "Chief Directorate: ..." on the very next
      // lines, before SALARY/CENTRE ever appear).
      const refLineMatch = entry.match(/REF\s*NO:?[ \t]*([^\n]*)/i);
      if (!refLineMatch) {
        skipped++;
        continue;
      }
      let referenceNumber = refLineMatch[1].trim();

      // Narrow exception for a genuine line-wrap: the captured text is a
      // short run of letters only (e.g. "HR") with nothing else on that
      // line — a strong signal the number's numeric part wrapped onto the
      // next physical line (e.g. "REF NO: HR\n4/4/8/1"). Only in that
      // specific case do we look at the next line, and only take its first
      // token, to avoid pulling in unrelated content.
      if (referenceNumber.length > 0 && referenceNumber.length <= 4 && /^[A-Z]+$/i.test(referenceNumber)) {
        const afterLine = entry.slice((refLineMatch.index ?? 0) + refLineMatch[0].length);
        const continuation = afterLine.match(/^\s*\n\s*([A-Z0-9/.\-]{2,40})/i);
        if (continuation) referenceNumber += continuation[1];
      }

      referenceNumber = referenceNumber.replace(/\(.*?\)\s*$/, "").replace(/\s+/g, "");
      if (!referenceNumber || referenceNumber.length > 60 || !/[A-Z0-9]/i.test(referenceNumber)) {
        skipped++;
        continue;
      }

      const refNoIndex = entry.search(/REF\s*NO/i);
      const titleRaw = entry.slice(postMatch[0].length, refNoIndex);
      // If a label keyword (SALARY, CENTRE, etc.) appears between the POST
      // header and "REF NO", the reference number wasn't actually attached
      // to this post's title — it belongs to a per-location breakdown
      // further down (a real but rarer DPSA layout, e.g. board-member posts
      // listing several regional ref numbers under CENTRES). We can't
      // reliably tell which one is "the" reference for this post, so this
      // entry is skipped entirely rather than guessed at.
      if (LABEL_BOUNDARY.test(titleRaw)) {
        skipped++;
        continue;
      }
      const title = cleanField(titleRaw, 300);
      if (!title || title.length < 3) {
        skipped++;
        continue;
      }

      const closingDate = parseClosingDate(entry) ?? departmentClosingDate;

      entries.push({ referenceNumber, title, department, closingDate });
    }
  }

  return { entries, skipped };
}

export async function syncDpsaVacancies() {
  const pdfUrl = await findLatestCircularPdfUrl();

  const pdfRes = await fetch(pdfUrl, { headers: BROWSER_HEADERS });
  if (!pdfRes.ok) {
    throw new Error(`Failed to download DPSA circular PDF: ${pdfRes.status} for ${pdfUrl}`);
  }
  const arrayBuffer = await pdfRes.arrayBuffer();

  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
  const result = await parser.getText();
  await parser.destroy();

  const { entries, skipped } = parseCircularText(result.text);

  const source = await getOrCreateSource({
    name: SOURCE_NAME,
    baseUrl: INDEX_URL,
    ingestionMethod: "pdf-scrape",
    trustTier: "official",
    notes:
      "Parsed from DPSA's weekly Public Service Vacancy Circular PDF — no official API exists. Best-effort extraction; entries with an ambiguous reference number or title are skipped rather than guessed.",
  });

  let totalUpserted = 0;
  const now = new Date().toISOString();
  for (const entry of entries) {
    const isPast = entry.closingDate ? new Date(entry.closingDate) < new Date() : false;
    await upsertListingByReference({
      type: "job",
      referenceNumber: entry.referenceNumber,
      title: entry.title,
      issuingBody: `Department of ${entry.department}`,
      sourceId: source.id,
      sourceUrl: pdfUrl,
      status: isPast ? "closed" : "open",
      closingDate: entry.closingDate,
      province: null,
      ingestedAt: now,
      isPlaceholder: false,
    });
    totalUpserted += 1;
  }

  await updateSourceLastSync(source.id, now);

  return { totalUpserted, skipped, pdfUrl };
}
