# Chrome Web Store — AI Text Hint

Account: **hannahzhang131@gmail.com** ($5 developer registration — same as Recipe toolkit).

Privacy policy (after `docs/ai-text-hint/` is on **main** and GitHub Pages is enabled):

`https://hannahzhang131.github.io/space-wellness/ai-text-hint/privacy.html`

Support URL:

`https://hannahzhang131.github.io/space-wellness/ai-text-hint/support.html`

---

## 1. Merge & privacy URL

1. Merge [PR #4](https://github.com/hannahzhang131/space-wellness/pull/4) (or ensure `docs/ai-text-hint/` is on **main**).
2. GitHub Pages already uses **/docs** on **main** (see repo `docs/README.md`).
3. Open the privacy URL in a browser — must load before you paste it into the dashboard.

**Single-purpose narrative:** “On-demand text pattern hints for the active page; no remote analysis.”

---

## 2. Build upload ZIP

```bash
cd /path/to/space-wellness/extensions/ai-text-hint
zip -r ../ai-text-hint-v0.1.2.zip . \
  -x "*.DS_Store" -x "CHROME_STORE.md" -x "MONETIZATION.md"
```

Zip root must contain `manifest.json` (not a parent folder only).

---

## 3. Screenshots (required ≥1)

| Asset | Size |
|-------|------|
| Store icon | **128×128** → `icons/icon-128.png` |
| Screenshot | **1280×800** or **640×400**, opaque JPEG/PNG |

**How:**

1. Open a news/blog article (or Reddit post with selection).
2. Click extension → show **Template-pattern score** + Breakdown.
3. macOS **Cmd+Shift+5** → window capture; crop to 1280×800 (page + popup visible).

Optional: put files in `extensions/ai-text-hint/store-assets/` (not in zip).

---

## 4. Dashboard copy (paste)

**Title:** AI Text Hint — Text Pattern Check

**Short description (132 chars):**  
Spot templated writing patterns on any page text—in one click. On-device, no account, no sending text to our servers.

**Detailed description:**

```
Read long posts, Reddit threads, or articles without opening another tab.

AI Text Hint scores text you’re already viewing:
• Analyze page article (blog / news body)
• Analyze selection (best for forums—highlight one comment first)

Everything runs on your device. We do not upload your text to Oceanink or third-party AI APIs.

IMPORTANT: This is a pattern hint tool, not proof of AI or human writing. Low scores are normal. High scores only mean more template-like patterns were found.

Permissions: activeTab + scripting—only when you click Analyze on the tab you opened.

Publisher: Oceanink Ltd
Support: recipeconnects@oceanink.co
```

**Category:** Productivity (or Utilities)

**Language:** English (+ add Chinese store text later if you want)

---

## 5. Privacy practices (questionnaire)

| Question | Answer |
|----------|--------|
| Single purpose | Yes — text pattern hints on user-initiated analyze |
| Collects data? | **No** |
| Remote server for user text? | **No** |
| Permissions justification | “Read visible page text or selection only when user opens popup and taps Analyze.” |

Do **not** claim “AI detection” or “% AI” in the listing.

---

## 6. Submit

1. https://chrome.google.com/webstore/devconsole  
2. **New item** → upload `ai-text-hint-v0.1.2.zip`  
3. Fill store listing, privacy URL, icon, screenshot  
4. **Submit for review** (often 1–7 days for new items; `<all_urls>` removed in v0.1.2 to ease review)

After approval, save the public store URL for Gumroad / site links.

---

## 7. Side hustle (see MONETIZATION.md)

Keep v0.1.2 **free** on the store for installs. Monetize lightly outside the store (tips or a small Pro pack)—details in `MONETIZATION.md`.