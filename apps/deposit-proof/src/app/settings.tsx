import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Banner, Body, Button, Screen } from '@/components/ui';
import { useEntitlement } from '@/state/entitlements';
import { theme } from '@/theme';

export default function SettingsScreen() {
  const { isPro, restore, busy, error, previewLifetime, iapAvailable } = useEntitlement();

  return (
    <Screen>
      <Body>{isPro ? 'Lifetime is on.' : 'The free record includes one home, six rooms, and three photos per room on each visit.'}</Body>
      {error ? <Banner text={error} /> : null}
      <Button label="Restore purchase" tone="ghost" onPress={() => void restore()} busy={busy} />
      {!iapAvailable && __DEV__ && !isPro ? (
        <Button label="Preview Lifetime on this dev build" tone="ghost" onPress={previewLifetime} />
      ) : null}
      <Button label="Privacy" tone="ghost" onPress={() => router.push('/legal')} />
      <Text style={styles.block}>Oceanink Ltd</Text>
      <Text style={styles.meta}>124 City Road, London EC1V 2NX</Text>
      <Text style={styles.meta}>Company number 16684370</Text>
      <Text style={styles.meta}>RentProof 1.0.0</Text>
      <Text style={styles.meta}>One-time purchase. No subscription. No account.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 12, fontSize: 18, color: theme.ink },
  meta: { color: theme.inkSoft, fontSize: 14, lineHeight: 20 },
});
