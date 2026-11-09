import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Display, Screen, Stamp } from '@/components/ui';
import { formatWhen } from '@/lib/format';
import { visitLabel, type Photo, type Property, type VisitKind } from '@/lib/model';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary } from '@/state/library';
import { serif, theme } from '@/theme';

export default function HomeScreen() {
  const { library, persistError } = useLibrary();
  const { isPro } = useEntitlement();

  return (
    <Screen header={false}>
      <View style={styles.mast}>
        <View style={styles.mastCopy}>
          <Text style={styles.brand}>OCEANINK LTD</Text>
          <Display>Deposit Proof</Display>
          <Body muted>Photograph each room when you move in, and again when you leave. The PDF stays on this phone.</Body>
        </View>
        <Stamp label="DP" />
      </View>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings')}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
        {isPro ? <Text style={styles.pro}>Lifetime</Text> : null}
      </View>
      {persistError ? <Body muted>{persistError}</Body> : null}
      {library.properties.length === 0 ? (
        <Card>
          <Text style={styles.cardTitle}>No home yet</Text>
          <Body muted>One home is included. Add the address you want on the report.</Body>
        </Card>
      ) : (
        library.properties.map((property) => <HomeCard key={property.id} property={property} photos={library.photos} />)
      )}
      <Pressable
        accessibilityRole="button"
        style={styles.add}
        onPress={() => {
          if (!isPro && library.properties.length >= 1) {
            router.push('/paywall');
            return;
          }
          router.push('/property/new');
        }}>
        <Text style={styles.addLabel}>{library.properties.length === 0 ? 'Add a home' : 'Add another home'}</Text>
      </Pressable>
      {!isPro && library.properties.length > 0 ? (
        <Body muted>Another home, extra rooms, and a PDF without the preview mark are a one-time purchase.</Body>
      ) : null}
    </Screen>
  );
}

function HomeCard({ property, photos }: { property: Property; photos: Photo[] }) {
  const owned = photos.filter((photo) => photo.propertyId === property.id);
  return (
    <Card onPress={() => router.push(`/property/${property.id}`)}>
      <Text style={styles.cardTitle}>{property.name}</Text>
      <Text style={styles.address}>{property.address}</Text>
      <Text style={styles.meta}>{lineFor(owned, 'move-in')}</Text>
      <Text style={styles.meta}>{lineFor(owned, 'move-out')}</Text>
    </Card>
  );
}

function lineFor(photos: Photo[], visit: VisitKind): string {
  const matched = photos.filter((photo) => photo.visit === visit);
  if (matched.length === 0) return `${visitLabel(visit)} · no photos`;
  const latest = matched.map((photo) => photo.takenAt).sort().at(-1);
  return `${visitLabel(visit)} · ${matched.length} photo${matched.length === 1 ? '' : 's'} · ${latest ? formatWhen(latest) : ''}`;
}

const styles = StyleSheet.create({
  mast: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mastCopy: { flex: 1, gap: 8 },
  brand: { letterSpacing: 2, fontSize: 12, color: theme.inkSoft },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: theme.ink, fontSize: 16, textDecorationLine: 'underline' },
  pro: { color: theme.pine, letterSpacing: 1, fontSize: 12, textTransform: 'uppercase' },
  cardTitle: { fontFamily: serif, fontSize: 26, color: theme.ink },
  address: { color: theme.inkSoft, fontSize: 15 },
  meta: { color: theme.ink, fontSize: 14 },
  add: { backgroundColor: theme.ink, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  addLabel: { color: theme.card, fontSize: 16 },
});
