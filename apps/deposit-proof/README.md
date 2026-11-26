# RentProof

A local move-in and move-out record for Oceanink Ltd. Photos and the PDF stay on the phone. There is no account and no China store listing in this version.

Lifetime is a non-consumable purchase, product id `lifetime`, shown in the app as $3.99 until the App Store price loads. It is not a subscription.

## Free and Lifetime

- Free: 1 home, the six standard rooms, 3 photos per room on move-in and 3 again on move-out, PDF with a preview mark.
- Lifetime: more homes, extra rooms, unlimited photos, PDF without the mark, move-in beside move-out.

## Run

```bash
cd apps/deposit-proof
npm install
npm test
npm run typecheck
npx expo start
```

Purchases need a development or App Store build (`npx expo run:ios` on a Mac, or EAS). Expo Go can photograph rooms and make a PDF, and a dev-only button can preview Lifetime. That button is absent from release builds.

## App Store, Oceanink Ltd

Use the company Apple Developer account, not a personal one. Bundle id: `com.oceanink.depositproof`.

The App Store name is RentProof. `eas.json` submits with the account holder `recipeconnects@oceanink.co` on team OceanInk ltd (`83K95JM2U2`). The App Store Connect admin `hannahzhang131@gmail.com` can also open the listing. Production builds are store builds: `npx eas-cli build -p ios --profile production`.

In App Store Connect create a Non-Consumable named Lifetime with product id `lifetime`. Leave China mainland off. Host `legal/privacy.html` and paste that URL into the listing. The in-app privacy screen uses the same text.

Strip Meta is the next app. It is not in this project yet.
