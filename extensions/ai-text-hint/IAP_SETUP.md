# In-extension purchase (after first store approval)

Google no longer has built-in Chrome extension billing. This extension uses **ExtensionPay** (Stripe checkout in a tab, paid status inside the extension). That is what “Contains in-app purchases” means on the store listing.

## You do once

1. Sign up: https://extensionpay.com  
2. Register extension id **`ai-pattern-slop-checker`** (or change `config.js` to match).  
3. Connect **Stripe**, set a **one-time** plan (e.g. lifetime Pro).  
4. Test in ExtensionPay **test mode** (Stripe test card).

## Store update (second submission)

1. Upload new zip **0.3.0+** on the **same** listing.  
2. **Distribution → Contains in-app purchases**.  
3. Privacy / Data usage: payment handled by Stripe via ExtensionPay; still no text upload to Oceanink.

## Free vs paid in the extension

**Free:** score, rhythm, stats, 2 matched phrases, paste, page/selection analyze.  
**Paid:** full lists, transitions, highlight, copy report, custom blocklist.

No email, no manual license keys.