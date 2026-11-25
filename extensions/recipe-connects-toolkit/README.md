# Recipe Connects Toolkit (Chrome MV3, E2)

v0.1: **Copy clean link** + **print-friendly** (inject print CSS, then system print dialog).

See **[CHROME_STORE.md](./CHROME_STORE.md)** for store images, zip, and publish steps.

```bash
# test clean-url
node -e "import { cleanUrl } from './lib/clean-url.js'; console.log(cleanUrl('https://x.com/?utm_source=a&keep=1'));"
```

Load unpacked in Chrome: `chrome://extensions` → this folder.