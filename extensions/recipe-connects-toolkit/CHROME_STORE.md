# Chrome Web Store — Recipe Connects Toolkit (E2 / v0.1)

Account: **hannahzhang131@gmail.com** (one-time $5 developer fee — already paid).

## What “store images” means

Chrome asks for graphics in the **Developer Dashboard → your item → Store listing** tab.

| Asset | Size | Required? | What to upload |
|-------|------|-----------|----------------|
| **Store icon** | **128×128** PNG | **Yes** | Same as extension `icons/icon-128.png` (no alpha issues; solid background is fine). |
| **Screenshots** | **1280×800** and/or **640×400** | **At least 1** | Real UI: browser on a recipe site + extension popup open. JPEG or PNG, **no transparency**. |
| **Small promo tile** | 440×280 | Optional | Logo + one-line tagline. |
| **Marquee promo** | 1400×560 | Optional | Only if you pitch for featuring. |

**Extension package icons** (inside the zip): **16, 48, 128** — already under `icons/`.

### How to make screenshots (fast)

1. Chrome → **Manage extensions** → **Load unpacked** → select this folder.
2. Open any recipe article (e.g. a blog post with a recipe).
3. Click the extension icon → show **Copy clean link** / **Print-friendly**.
4. macOS: **Cmd+Shift+5** capture window, or full screen and crop to **1280×800**.
5. If the popup is small, crop a **1280×800** canvas: page on the left, popup on the right.

Send Hannah (or the agent) **PNG/JPEG files** or put them in `extensions/recipe-connects-toolkit/store-assets/` in the repo.

Privacy URL for the listing: use your existing Google Sites policy or a short page linking `PRIVACY.md` hosted on GitHub Pages.

---

## End-to-end flow

### A. Local scaffold (done in this folder)

```
extensions/recipe-connects-toolkit/
  manifest.json      # MV3
  popup.html/js/css  # UI
  lib/clean-url.js   # strip utm_*, fbclid, etc.
  icons/             # 16, 48, 128
  PRIVACY.md
```

### B. Load unpacked (test on your Mac)

1. `chrome://extensions`
2. Enable **Developer mode** (top right).
3. **Load unpacked** → choose `recipe-connects-toolkit` folder.
4. Test on a URL with `?utm_source=test` → **Copy clean link** → paste elsewhere; tracking params should be gone.
5. **Print-friendly** → system print dialog; use **Save as PDF** to preview.

### C. Zip for upload

From repo root:

```bash
cd extensions/recipe-connects-toolkit
zip -r ../recipe-connects-toolkit-v0.1.0.zip . -x "*.DS_Store" -x "store-assets/*" -x "CHROME_STORE.md"
```

Do **not** zip the parent folder name only — zip **contents** (manifest.json at root of zip).

### D. Developer Dashboard

1. https://chrome.google.com/webstore/devconsole  
2. Sign in as **hannahzhang131@gmail.com**.
3. **New item** → upload the zip.
4. **Store listing** (English):
   - **Title:** Recipe Connects Toolkit
   - **Summary:** Clean recipe links and print-friendly pages. No account, no data collection.
   - **Description:** explain E2 features + link https://oceanink.co/
   - **Category:** Productivity
   - **Language:** English
5. **Privacy practices:** Single purpose, no user data collected (match PRIVACY.md).
6. **Privacy policy URL:** your Google Sites privacy page.
7. Upload **icon 128** + **≥1 screenshot**.
8. **Submit for review** (often 1–3 days).

### E. After approval

Link from oceanink.co to the public Chrome Web Store URL.

---

## v0.2 (E1) later

Recipe → Markdown shopping list (per-site parsers). Do **not** add until v0.1 is live.