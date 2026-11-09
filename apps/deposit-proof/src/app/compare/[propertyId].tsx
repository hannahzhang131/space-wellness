import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Screen } from '@/components/ui';
import { resolvePhotoUri } from '@/lib/files';
import { formatWhen, oneParam, photoPlaceLine } from '@/lib/format';
import { photosFor } from '@/lib/model';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary, useProperty } from '@/state/library';
import { serif, theme } from '@/theme';

export default function CompareScreen() {
  const { propertyId: rawId } = useLocalSearchParams<{ propertyId: string }>();
  const propertyId = oneParam(rawId);
  const property = useProperty(propertyId);
  const { library } = useLibrary();
  const { isPro } = useEntitlement();

  if (!property) {
    return (
      <Screen>
        <Body>This home is not on this phone.</Body>
      </Screen>
    );
  }

  if (!isPro) {
    return (
      <Screen>
        <Body>Side-by-side comparison is part of Lifetime. It is a one-time purchase, not a subscription.</Body>
        <Button label="See Lifetime" tone="seal" onPress={() => router.push('/paywall')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Move-in and move-out' }} />
      <Body muted>Left is move-in. Right is move-out. Empty sides stay blank until you photograph them.</Body>
      {property.rooms.map((room) => {
        const moveIn = photosFor(library.photos, property.id, room.id, 'move-in');
        const moveOut = photosFor(library.photos, property.id, room.id, 'move-out');
        if (moveIn.length === 0 && moveOut.length === 0) return null;
        const rows = Math.max(moveIn.length, moveOut.length);
        return (
          <View key={room.id} style={styles.room}>
            <Text style={styles.roomName}>{room.name}</Text>
            <View style={styles.labels}>
              <Text style={styles.label}>Move-in</Text>
              <Text style={styles.label}>Move-out</Text>
            </View>
            {Array.from({ length: rows }, (_, index) => {
              const left = moveIn[index];
              const right = moveOut[index];
              return (
                <View key={`${room.id}-${index}`} style={styles.pair}>
                  <Column
                    stored={left?.stored}
                    caption={left ? `${formatWhen(left.takenAt)}\n${photoPlaceLine(left.place, property.address)}` : 'No photo'}
                  />
                  <Column
                    stored={right?.stored}
                    caption={right ? `${formatWhen(right.takenAt)}\n${photoPlaceLine(right.place, property.address)}` : 'No photo'}
                  />
                </View>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}

function Column({ stored, caption }: { stored?: string; caption: string }) {
  return (
    <View style={styles.column}>
      {stored ? (
        <Image source={{ uri: resolvePhotoUri(stored) }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.empty]} />
      )}
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  room: { gap: 8 },
  roomName: { fontFamily: serif, fontSize: 24, color: theme.ink },
  labels: { flexDirection: 'row', gap: 8 },
  label: { flex: 1, color: theme.inkSoft, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  pair: { flexDirection: 'row', gap: 8 },
  column: { flex: 1, gap: 6 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: theme.paperDeep },
  empty: { borderWidth: 1, borderColor: theme.line },
  caption: { color: theme.inkSoft, fontSize: 12, lineHeight: 16 },
});
