# Pro (manual licenses — no Gumroad in extension)

## What Pro adds

- Full matched phrase + transition lists  
- **Highlight on page** for hits  
- **Copy report** to clipboard  
- **Custom blocklist** (options page)  

Free keeps: analyze page/selection, score, rhythm tips, first **2** matched phrases.

## Generate keys (when a buyer pays you)

On your Mac, from the extension folder:

```bash
node scripts/gen-license.mjs 5
```

Each line is `SLPC-XXXX-XXXX`. Email one key per buyer. They paste it in **Pro license & custom words** (extension options).

## Seller workflow

1. Invoice via PayPal / 微信 / whatever you prefer.  
2. Run `gen-license.mjs 1`, send key.  
3. Buyer: right-click extension → **Options** (or popup footer link) → paste → **Save license**.

No server, no Gumroad webhook. Keys are validated **offline** in `license.js`.

## Do not commit buyer keys to git.

Test with a key from `gen-license.mjs` on your own Chrome profile only.