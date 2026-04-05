// Headline news fetcher via free RSS feeds (Yahoo Finance RSS). Parses the
// minimal subset of RSS we need without pulling a dependency. Classification
// into {positive/negative/neutral} is intentionally crude — an LLM agent can
// re-score later if you want.

const POS = ["beat", "beats", "surge", "surges", "up", "upgrade", "record", "strong", "growth", "profit", "win", "wins"];
const NEG = ["miss", "misses", "plunge", "falls", "fall", "down", "downgrade", "weak", "loss", "losses", "cut", "cuts", "probe", "sue", "sues", "fraud"];

export async function fetchYahooHeadlines(symbol, { limit = 20 } = {}) {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (research harness; educational use)" },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < limit) {
    const chunk = m[1];
    items.push({
      symbol,
      title: pick(chunk, "title"),
      link: pick(chunk, "link"),
      pubDate: pick(chunk, "pubDate"),
      description: stripHtml(pick(chunk, "description")),
    });
  }
  return items.map((it) => ({ ...it, sentiment: classifySentiment(it.title + " " + it.description) }));
}

function pick(xml, tag) {
  const re = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`);
  const m = re.exec(xml);
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}
function stripHtml(s) { return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
function classifySentiment(text) {
  const t = text.toLowerCase();
  let score = 0;
  for (const w of POS) if (t.includes(w)) score += 1;
  for (const w of NEG) if (t.includes(w)) score -= 1;
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export function dedupeHeadlines(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = (it.title || "").toLowerCase().replace(/\W+/g, "").slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}
