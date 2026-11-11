# Progress Pics

Weekly front, side and back progress photos for Oceanink Ltd. The last photo of each pose shows faintly over the camera so the next one lines up. Photos, weight and notes stay inside the app on the phone. There is no account and no server.

Lifetime is a non-consumable purchase, product id `progresspics.lifetime`, shown as $3.99 until the App Store price loads. It is not a subscription.

## Free and Lifetime

- Free: 6 check-ins, side-by-side compare, a weekly reminder, Face ID lock, share images with a small Progress Pics mark.
- Lifetime: unlimited check-ins, fade between before and after, share images without the mark.

## Run

```bash
cd apps/progress-photos
npm install
npm test
npm run typecheck
npx expo lint
npx expo start
```

The camera, Face ID and reminders need a development or App Store build. The web preview adds photos from files instead of the camera.

## App Store, Oceanink Ltd

iPhone only (`supportsTablet: false`), so App Store Connect does not ask for iPad screenshots. Bundle id `com.oceanink.progresspics`. Production builds use the `production` profile in `eas.json` with the `progress-pics` EAS environment.

In App Store Connect create a Non-Consumable named Lifetime with product id `progresspics.lifetime` and attach it to the first version. Leave China mainland off. Host `legal/privacy.html` and use that URL for the privacy policy and support URL.
