import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner, Body, Button, Field, Screen } from '@/components/ui';
import { persistPhoto, resolvePhotoUri } from '@/lib/files';
import { formatWhen, oneParam, photoPlaceLine } from '@/lib/format';
import { canAddPhoto, createId, FREE_PHOTOS_PER_ROOM_VISIT, photosFor, visitLabel, type VisitKind } from '@/lib/model';
import { capturePlace } from '@/lib/place';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary, useProperty } from '@/state/library';
import { theme } from '@/theme';

export default function RoomScreen() {
  const params = useLocalSearchParams<{ propertyId: string; kind: string; roomId: string }>();
  const propertyId = oneParam(params.propertyId);
  const roomId = oneParam(params.roomId);
  const kind = oneParam(params.kind);
  const visit: VisitKind | null = kind === 'move-in' || kind === 'move-out' ? kind : null;
  const property = useProperty(propertyId);
  const room = property?.rooms.find((item) => item.id === roomId);
  const { library, addPhoto, updatePhotoNote, deletePhoto } = useLibrary();
  const { isPro } = useEntitlement();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!property || !room || !visit || !propertyId || !roomId) {
    return (
      <Screen>
        <Body>This room is not on this phone.</Body>
      </Screen>
    );
  }

  const photos = photosFor(library.photos, property.id, room.id, visit);
  const selected = photos.find((photo) => photo.id === selectedId) ?? null;

  const add = async (source: 'camera' | 'library') => {
    if (!canAddPhoto(photos.length, isPro)) {
      router.push('/paywall');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError('The camera is off for Deposit Proof. You can still add a photo from your library.');
          return;
        }
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      const place = await capturePlace();
      const id = createId();
      const stored = await persistPhoto(result.assets[0].uri, id);
      addPhoto({
        id,
        propertyId: property.id,
        roomId: room.id,
        visit,
        takenAt: new Date().toISOString(),
        place: place.place,
        note: '',
        stored,
      });
      setSelectedId(id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save that photo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: room.name }} />
      <Body muted>
        {isPro
          ? `${photos.length} photos · ${visitLabel(visit)}`
          : `${photos.length} of ${FREE_PHOTOS_PER_ROOM_VISIT} included · ${visitLabel(visit)}`}
      </Body>
      {error ? <Banner text={error} /> : null}
      <View style={styles.grid}>
        {photos.map((photo) => (
          <Pressable key={photo.id} onPress={() => setSelectedId(photo.id)} style={styles.tile}>
            <Image source={{ uri: resolvePhotoUri(photo.stored) }} style={styles.image} contentFit="cover" />
          </Pressable>
        ))}
      </View>
      {Platform.OS === 'web' ? (
        <Body muted>The iPhone app opens the camera here. This browser preview adds a photo from your files.</Body>
      ) : (
        <Button label="Take a photo" onPress={() => void add('camera')} busy={busy} />
      )}
      <Button label={Platform.OS === 'web' ? 'Add a photo' : 'Choose from library'} tone="ghost" onPress={() => void add('library')} busy={busy} />
      {selected ? (
        <View style={styles.detail}>
          <Image source={{ uri: resolvePhotoUri(selected.stored) }} style={styles.hero} contentFit="cover" />
          <Text style={styles.caption}>
            {formatWhen(selected.takenAt)} · {photoPlaceLine(selected.place, property.address)}
          </Text>
          <Field
            label="Note"
            value={selected.note}
            onChangeText={(note) => updatePhotoNote(selected.id, note.slice(0, 140))}
            placeholder="Scuff on the skirting"
          />
          <Button
            label="Remove photo"
            tone="ghost"
            onPress={() => {
              deletePhoto(selected.id);
              setSelectedId(null);
            }}
          />
        </View>
      ) : (
        <Body muted>Tap a photo to add a short note. The note is printed under it.</Body>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31%', aspectRatio: 1, backgroundColor: theme.paperDeep },
  image: { width: '100%', height: '100%' },
  detail: { gap: 10 },
  hero: { width: '100%', aspectRatio: 4 / 3, backgroundColor: theme.paperDeep },
  caption: { color: theme.inkSoft, fontSize: 14, lineHeight: 20 },
});
