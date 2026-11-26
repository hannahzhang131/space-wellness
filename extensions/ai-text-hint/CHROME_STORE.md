# Chrome Web Store — AI Pattern & Slop Checker (Local & Private)

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
zip -r ../ai-pattern-slop-checker-v0.2.0.zip . \
  -x "*.DS_Store" -x "CHROME_STORE.md" -x "MONETIZATION.md" -x "PRO.md" -x "scripts/*"
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

**Title:** AI Pattern & Slop Checker (Local & Private)

**Short description (132 chars):**  
Spot AI slop clichés & robotic rhythm on any page—100% on-device. EN + 中文 patterns. Your drafts never upload.

**Detailed description:**

```
Before you publish — check slop patterns without opening ZeroGPT.

• Analyze page article or selection (forums: highlight one comment first)
• Slop pattern score + rhythm (σ) tips — English & Chinese template phrases
• Free: score, stats, top matched phrases, rhythm coaching
• Pro (optional lifetime license via support email): full hit lists, highlight on page, copy report, custom blocklist

100% on-device. No account. Text is not sent to Oceanink or third-party AI APIs.

For writers, SEO posts, cover letters, and 自媒体/文书 self-checks before submit.

Pattern hints only — not proof of AI or human authorship.

Permissions: activeTab, scripting, storage (license + your custom word list stay on this device only).

Publisher: Oceanink Ltd
Support: recipeconnects@oceanink.co
```

**Category:** Productivity (or Utilities)

**Language:** English (primary listing); mention 中文 pattern support in description

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
2. **New item** → upload `ai-pattern-slop-checker-v0.2.0.zip`  
3. Fill store listing, privacy URL, icon, screenshot  
4. **Submit for review** (often 1–7 days for new items; v0.1.3 uses activeTab only, no broad host access)

After approval, save the public store URL for Gumroad / site links.

---

## 7. Side hustle (see MONETIZATION.md)

Store ships **free tier**; Pro keys sold manually (see `PRO.md`). No ads. Monetize lightly outside the store (tips or a small Pro pack)—details in `MONETIZATION.md`.