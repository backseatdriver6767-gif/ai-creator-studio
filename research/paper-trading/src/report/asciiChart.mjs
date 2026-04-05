// Zero-dependency ASCII equity-curve chart. Good enough for terminal review
// and for dropping into markdown journal entries inside a code fence.

export function asciiChart(series, { width = 60, height = 14, label = "" } = {}) {
  if (!series.length) return "(empty)";
  const values = series.map((p) => (typeof p === "number" ? p : p.equity ?? p.y ?? 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Downsample to width buckets
  const buckets = new Array(width).fill(null);
  const step = values.length / width;
  for (let i = 0; i < width; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const slice = values.slice(start, Math.max(end, start + 1));
    buckets[i] = slice.reduce((s, x) => s + x, 0) / slice.length;
  }

  const rows = [];
  for (let r = 0; r < height; r++) {
    let line = "";
    const rowVal = max - (r / (height - 1)) * range;
    for (let c = 0; c < width; c++) {
      const v = buckets[c];
      line += v >= rowVal - range / (height * 2) && v <= rowVal + range / (height * 2) ? "█" : " ";
    }
    const axis = (max - (r / (height - 1)) * range).toFixed(2).padStart(10);
    rows.push(`${axis} │${line}`);
  }
  const footer = "          └" + "─".repeat(width);
  const title = label ? `${label}  [min=${min.toFixed(2)}  max=${max.toFixed(2)}]` : "";
  return [title, ...rows, footer].filter(Boolean).join("\n");
}
