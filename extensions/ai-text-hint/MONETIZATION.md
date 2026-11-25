# AI Pattern & Slop Checker — light side hustle

Positioning: **faster than ZeroGPT for “is this paragraph template-y?”** while you browse—not a lab-grade detector. That’s honest and enough for a small product.

## What not to do early

- Paid Chrome listing / complex in-store billing (low return, high friction).
- Server-side “real” AI detection API (cost + privacy + support burden).
- Subscription for a hint tool (churn and refund noise).

## Path A — Free extension + tip jar (simplest)

**Now:** Store listing is 100% free, unlimited Analyze.

**v0.2 popup footer:** “Support development” → Ko-fi or Gumroad **$3+ name your price** (no feature gate).

- Revenue expectation: **$20–150/mo** if a few hundred active users and ~1–2% tip.
- Work: one link, no license system.

## Path B — One-time “Pro” on Gumroad (best balance)

**Free (store):** Page + selection analyze, breakdown, local only.

**Pro ~$4.99–$9.99 lifetime (Gumroad):**

- Copy report to clipboard (formatted for notes/email)
- Custom phrase list (JSON in `chrome.storage.local`)
- Optional badge “Pro” in popup

**License:** User pastes Gumroad license key once; verify with Gumroad’s ping API or a simple offline key (start honor-system + manual key in email for first 20 buyers).

- Revenue expectation: **5–20 sales/mo** at $6 ≈ **$30–120/mo** with modest traffic from store SEO + Reddit “tool I use” posts.
- Work: ~1–2 evenings for v0.2 Pro features.

## Path C — Niche audience (no extra code)

Write **one** short post: “I check Reddit comments without leaving the tab” → link store URL.  
Keywords: reddit ai text, template writing, on-device, privacy.  
Don’t promise ZeroGPT accuracy.

## Path D — Later, only if users ask

- Team / classroom bulk license (manual invoice)—ignore until someone emails.

## Recommended sequence

1. **Ship free v0.1.2** on Chrome Web Store (this week).
2. Use 2 weeks; note what you wish you had (**copy report** is the usual winner).
3. **Gumroad Pro $5.99 lifetime** + Ko-fi link in free version.
4. Optional: mention on oceanink.co footer once store URL exists.

## Messaging (avoid rejections & chargebacks)

- Say **“pattern hints”**, not “detect AI”.
- Free tier must stay useful (you already have that).
- Pro sells **convenience** (export, custom lists), not “truth”.