import { router } from 'expo-router';

import { Banner, Body, Button, Screen } from '@/components/ui';
import { useEntitlement } from '@/state/entitlements';

export default function PaywallScreen() {
  const { isPro, priceLabel, busy, error, buy, restore, previewLifetime, iapAvailable } = useEntitlement();

  return (
    <Screen>
      <Body>One payment. No subscription. Photos still stay on this phone.</Body>
      {isPro ? <Body>Lifetime is active here.</Body> : <Body>{`${priceLabel} once.`}</Body>}
      {error ? <Banner text={error} /> : null}
      <Body>Extra rooms, more than one home, unlimited photos, a PDF without the preview mark, and move-in next to move-out.</Body>
      {isPro ? null : <Button label={`Unlock Lifetime · ${priceLabel}`} tone="seal" onPress={() => void buy()} busy={busy} />}
      <Button label="Restore purchase" tone="ghost" onPress={() => void restore()} busy={busy} />
      {!iapAvailable && __DEV__ && !isPro ? (
        <Button label="Preview Lifetime on this dev build" tone="ghost" onPress={previewLifetime} />
      ) : null}
      {!iapAvailable && !__DEV__ ? (
        <Body muted>Lifetime is purchased from the App Store build, under the Oceanink Ltd developer name.</Body>
      ) : null}
      <Button label="Close" tone="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
