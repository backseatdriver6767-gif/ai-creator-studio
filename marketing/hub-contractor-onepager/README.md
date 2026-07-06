# HUB International — Contractor Insurance One-Pager

A redesigned, print-ready one-page sell sheet for HUB International's Long Island
contractor insurance program.

## Files
- `HUB-Contractor-OnePager.pdf` — the final print-ready PDF (US Letter, 8.5" × 11").
- `onepager.html` — the source layout (self-contained, vector logo + inline SVG icons).
- `render.mjs` — regenerates the PDF from the HTML via headless Chromium.
- `assets/hub-logo.png` — reference of the original HUB logo.

## Regenerate the PDF
```bash
node render.mjs
```
Requires Playwright's Chromium. The script imports Playwright and writes
`HUB-Contractor-OnePager.pdf` at exact Letter dimensions with backgrounds printed.

## Editing
All content and styling live in `onepager.html`. Brand palette:
- Gold accent `#b8862b`
- Navy `#1a2530` / `#2a3845`
- Light panel `#f1f4f7`
