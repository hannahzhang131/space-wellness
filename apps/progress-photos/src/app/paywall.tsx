import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Banner, Body, Button, Display, Screen } from '@/components/ui';
import { FREE_CHECK_IN_LIMIT } from '@/lib/model';
import { useEntitlement } from '@/state/entitlements';
import { theme } from '@/theme';

const PERKS = [
  'Every weekly check-in, not just the first six',
  'Fade between before and after',
  'Share images without the Progress Pics mark',
];

export default function PaywallScreen() {
  const { isPro, priceLabel, busy, error, buy, restore, previewLifetime, iapAvailable } = useEntitlement();

  return (
    <Screen>
      <Display>{isPro ? 'Lifetime is on' : `${priceLabel}, once`}</Display>
      <Body muted>{`One payment. No subscription. The free version keeps ${FREE_CHECK_IN_LIMIT} check-ins.`}</Body>
      <View style={styles.perks}>
        {PERKS.map((perk) => (
          <View key={perk} style={styles.perk}>
            <Text style={styles.tick}>✓</Text>
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>
      {error ? <Banner text={error} /> : null}
      {isPro ? null : <Button label={`Unlock Lifetime · ${priceLabel}`} tone="accent" onPress={() => void buy()} busy={busy} />}
      <Button label="Restore purchase" tone="ghost" onPress={() => void restore()} busy={busy} />
      {!iapAvailable && __DEV__ && !isPro ? (
        <Button label="Preview Lifetime on this dev build" tone="ghost" onPress={previewLifetime} />
      ) : null}
      {!iapAvailable && !__DEV__ ? <Body muted>Lifetime is purchased from the App Store build.</Body> : null}
      <Body muted>Photos stay on this phone either way. Restore uses the Apple ID that bought Lifetime.</Body>
      <Button label="Close" tone="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  perks: { gap: 12, backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.line, padding: 16 },
  perk: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tick: { color: theme.accent, fontSize: 17, fontWeight: '800', lineHeight: 23 },
  perkText: { flex: 1, fontSize: 16, lineHeight: 23, color: theme.ink },
});
