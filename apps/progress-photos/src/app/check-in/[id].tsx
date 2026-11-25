import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Photo, PoseTile } from '@/components/photos';
import { Banner, Body, Button, ConfirmBox, Field, Screen } from '@/components/ui';
import { persistPhoto } from '@/lib/files';
import { formatDay, oneParam } from '@/lib/format';
import { createId, parseWeight, POSES, poseLabel, weightText, type Pose } from '@/lib/model';
import { useCheckIn, useLibrary } from '@/state/library';

export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const checkInId = oneParam(id);
  const checkIn = useCheckIn(checkInId);
  const { library, setPhoto, removePhoto, setWeight, setNote, deleteCheckIn } = useLibrary();
  const { unit } = library.settings;
  const [selected, setSelected] = useState<Pose | null>(null);
  const [weight, setWeightInput] = useState(() => weightText(checkIn?.weightKg ?? null, unit));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!checkIn || !checkInId) {
    return (
      <Screen>
        <Body>This check-in is not on this phone.</Body>
      </Screen>
    );
  }

  const openCamera = (pose: Pose) => {
    if (Platform.OS === 'web') {
      void pickFromLibrary(pose);
      return;
    }
    router.push(`/camera/${checkIn.id}/${pose}`);
  };

  const pickFromLibrary = async (pose: Pose) => {
    setError(null);
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (result.canceled || !result.assets[0]) return;
      const stored = await persistPhoto(result.assets[0].uri, createId());
      setPhoto(checkIn.id, pose, stored);
      setSelected(pose);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add that photo.');
    } finally {
      setBusy(false);
    }
  };

  const selectedPhoto = selected ? checkIn.photos[selected] : undefined;

  return (
    <Screen>
      <Stack.Screen options={{ title: formatDay(checkIn.takenAt) }} />
      {error ? <Banner text={error} /> : null}
      <View style={styles.tiles}>
        {POSES.map((pose) => (
          <PoseTile
            key={pose}
            pose={pose}
            stored={checkIn.photos[pose]}
            selected={selected === pose && Boolean(checkIn.photos[pose])}
            onPress={() => (checkIn.photos[pose] ? setSelected(pose) : openCamera(pose))}
          />
        ))}
      </View>

      {selected && selectedPhoto ? (
        <View style={styles.detail}>
          <Photo stored={selectedPhoto} style={styles.hero} />
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button label="Retake" tone="ink" onPress={() => openCamera(selected)} busy={busy} />
            </View>
            <View style={styles.action}>
              <Button
                label="Remove"
                tone="ghost"
                onPress={() => {
                  removePhoto(checkIn.id, selected);
                  setSelected(null);
                }}
              />
            </View>
          </View>
        </View>
      ) : (
        <Body muted>Tap a pose to open the camera. Last week’s photo shows faintly so you can match it.</Body>
      )}

      <Button
        label={Platform.OS === 'web' ? 'Add a photo from files' : `Add ${selected ? poseLabel(selected).toLowerCase() : 'a'} photo from library`}
        tone="ghost"
        onPress={() => void pickFromLibrary(selected ?? POSES.find((pose) => !checkIn.photos[pose]) ?? 'front')}
        busy={busy}
      />

      <Field
        label="Weight (optional)"
        value={weight}
        keyboardType="decimal-pad"
        suffix={unit}
        placeholder={unit === 'kg' ? '72.4' : '160.0'}
        onChangeText={(text) => {
          setWeightInput(text);
          setWeight(checkIn.id, text.trim() ? parseWeight(text, unit) : null);
        }}
      />
      <Field
        label="Note (optional)"
        value={checkIn.note}
        multiline
        placeholder="Week 4. Sleeping better."
        onChangeText={(note) => setNote(checkIn.id, note.slice(0, 200))}
      />

      {confirming ? (
        <ConfirmBox
          title="Delete this check-in?"
          body="Its photos are removed from Progress Pics. Photos you already shared are not affected."
          confirmLabel="Delete check-in"
          onConfirm={() => {
            deleteCheckIn(checkIn.id);
            router.back();
          }}
          onCancel={() => setConfirming(false)}
        />
      ) : (
        <Button label="Delete check-in" tone="ghost" onPress={() => setConfirming(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 6 },
  detail: { gap: 10 },
  hero: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
