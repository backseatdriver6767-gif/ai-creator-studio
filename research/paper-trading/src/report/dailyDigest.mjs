// Daily digest: ties together headlines, EDGAR filings, event calendar, and
// any screener hits for a watchlist into one markdown file. No trading signals.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dedupeHeadlines, fetchYahooHeadlines } from "../intel/news.mjs";
import { nextEvent } from "../intel/econCalendar.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIGEST_DIR = path.resolve(__dirname, "../../journal/digests");

export async function buildDailyDigest({ watchlist, date = new Date().toISOString().slice(0, 10) }) {
  const sections = [];
  sections.push(`# Daily digest — ${date}\n`);

  const ev = nextEvent(date);
  if (ev) sections.push(`**Next scheduled event:** ${ev.kind} on ${ev.date}\n`);

  for (const sym of watchlist) {
    sections.push(`\n## ${sym}`);
    try {
      const items = dedupeHeadlines(await fetchYahooHeadlines(sym, { limit: 10 }));
      if (!items.length) {
        sections.push("_no headlines_");
      } else {
        for (const it of items) {
          sections.push(`- **[${it.sentiment}]** ${it.title}  \n  <${it.link}>`);
        }
      }
    } catch (e) {
      sections.push(`_headline fetch failed: ${e.message}_`);
    }
  }

  sections.push(
    "\n---\n*Informational only. Not a trade signal. This digest never recommends positions.*",
  );

  await mkdir(DIGEST_DIR, { recursive: true });
  const file = path.join(DIGEST_DIR, `${date}.md`);
  await writeFile(file, sections.join("\n"));
  return file;
}
