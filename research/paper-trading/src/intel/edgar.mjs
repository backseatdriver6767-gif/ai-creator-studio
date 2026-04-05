// SEC EDGAR filings watcher. EDGAR is free and stable. We fetch a company's
// recent filings JSON and optionally filter by form type.
//
// Docs: https://www.sec.gov/edgar/sec-api-documentation

const UA = "research-paper-trading/0.1 (educational use; contact@example.com)";

export async function fetchRecentFilings(cik, { forms = ["8-K", "10-Q", "10-K", "13D", "13G", "S-1"] } = {}) {
  const padded = String(cik).padStart(10, "0");
  const url = `https://data.sec.gov/submissions/CIK${padded}.json`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`EDGAR ${res.status}`);
  const json = await res.json();
  const rec = json.filings?.recent || {};
  const out = [];
  const n = rec.accessionNumber?.length || 0;
  for (let i = 0; i < n; i++) {
    const form = rec.form[i];
    if (forms.length && !forms.includes(form)) continue;
    out.push({
      form,
      filedAt: rec.filingDate[i],
      accession: rec.accessionNumber[i],
      primaryDoc: rec.primaryDocument[i],
      url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${rec.accessionNumber[i].replace(/-/g, "")}/${rec.primaryDocument[i]}`,
    });
  }
  return out.slice(0, 50);
}

/** Look up CIK from ticker via EDGAR's ticker map. */
let _tickerMap = null;
export async function tickerToCik(ticker) {
  if (!_tickerMap) {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) throw new Error(`EDGAR ticker map ${res.status}`);
    const json = await res.json();
    _tickerMap = {};
    for (const k of Object.keys(json)) {
      _tickerMap[json[k].ticker.toUpperCase()] = json[k].cik_str;
    }
  }
  return _tickerMap[ticker.toUpperCase()] || null;
}
