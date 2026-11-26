# Privacy — AI Pattern & Slop Checker (Local & Private)

**Publisher:** Oceanink Ltd  
**Contact:** recipeconnects@oceanink.co

## Summary

AI Pattern & Slop Checker does not collect, store, or sell personal data. There is no account and no analytics SDK.

## What happens when you click Analyze

- The extension reads **text from the page you already have open** (article body or your text selection) **in your browser only**.
- Pattern scoring runs **locally** in the popup. **No text is sent to Oceanink or any third-party AI API.**

## Permissions

- **activeTab** + **scripting:** Used only when you open the popup and click Analyze, to read text from the active tab. We do not request access to all sites in the background.

## Data storage

- **Pro license** and **custom phrase list** stay in `chrome.storage.local` on this device.
- On **Google Docs** only, we keep your **last selected text** in `chrome.storage.session` for up to a few minutes so analysis still works after the popup opens (Docs clears selection). Session data is cleared when the browser session ends. It is not sent to us.

## Children

Not directed at children under 13.

## Changes

We will update this file and the web policy URL when behavior changes.

Last updated: 26 November 2026.