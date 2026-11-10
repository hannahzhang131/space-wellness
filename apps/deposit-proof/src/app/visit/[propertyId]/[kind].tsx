import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Body, Button, Card, Field, Screen } from '@/components/ui';
import { oneParam } from '@/lib/format';
import { canAddRoom, photosFor, visitLabel, type VisitKind } from '@/lib/model';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary, useProperty } from '@/state/library';
import { serif, theme } from '@/theme';

export default function VisitScreen() {
  const params = useLocalSearchParams<{ propertyId: string; kind: string }>();
  const propertyId = oneParam(params.propertyId);
  const kind = oneParam(params.kind);
  const visit: VisitKind | null = kind === 'move-in' || kind === 'move-out' ? kind : null;
  const property = useProperty(propertyId);
  const { library, addRoom } = useLibrary();
  const { isPro } = useEntitlement();
  const [roomName, setRoomName] = useState('');
  const [adding, setAdding] = useState(false);

  if (!property || !propertyId || !visit) {
    return (
      <Screen>
        <Body>This visit is not on this phone.</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${property.name} · ${visitLabel(visit)}` }} />
      <Body muted>Three photos per room are included. The time and address are written under each one in the PDF.</Body>
      {property.rooms.map((room) => {
        const count = photosFor(library.photos, property.id, room.id, visit).length;
        return (
          <Card
            key={room.id}
            onPress={() => router.push(`/room/${property.id}/${visit}/${room.id}`)}>
            <Text style={styles.room}>{room.name}</Text>
            <Text style={styles.meta}>{count === 0 ? 'No photos' : `${count} photo${count === 1 ? '' : 's'}`}</Text>
          </Card>
        );
      })}
      {adding ? (
        <>
          <Field label="Room name" value={roomName} onChangeText={setRoomName} placeholder="Second bedroom" />
          <Button
            label="Add room"
            onPress={() => {
              if (!canAddRoom(isPro)) {
                router.push('/paywall');
                return;
              }
              if (addRoom(property.id, roomName)) {
                setRoomName('');
                setAdding(false);
              }
            }}
          />
        </>
      ) : (
        <Button
          label={isPro ? 'Add a room' : 'Add a room with Lifetime'}
          tone="ghost"
          onPress={() => {
            if (!canAddRoom(isPro)) {
              router.push('/paywall');
              return;
            }
            setAdding(true);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  room: { fontFamily: serif, fontSize: 24, color: theme.ink },
  meta: { color: theme.inkSoft, fontSize: 14 },
});
