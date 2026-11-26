import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner, Body, Button, Screen } from '@/components/ui';
import { exportPdf } from '@/lib/export-pdf';
import { photoSourceForPdf, resolvePhotoUri } from '@/lib/files';
import { formatWhen, oneParam, photoPlaceLine } from '@/lib/format';
import { photosFor, visitLabel, type VisitKind } from '@/lib/model';
import { buildReportHtml, type ReportDocument, type ReportFigure } from '@/lib/report';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary, useProperty } from '@/state/library';
import { theme } from '@/theme';

type Mode = VisitKind | 'compare';

export default function ReportScreen() {
  const { propertyId: rawId } = useLocalSearchParams<{ propertyId: string }>();
  const propertyId = oneParam(rawId);
  const property = useProperty(propertyId);
  const { library } = useLibrary();
  const { isPro } = useEntitlement();
  const [mode, setMode] = useState<Mode>('move-in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!property) {
    return (
      <Screen>
        <Body>This home is not on this phone.</Body>
      </Screen>
    );
  }

  const previewPhotos =
    mode === 'compare'
      ? library.photos.filter((photo) => photo.propertyId === property.id)
      : library.photos.filter((photo) => photo.propertyId === property.id && photo.visit === mode);

  const exportReport = async () => {
    if (mode === 'compare' && !isPro) {
      router.push('/paywall');
      return;
    }
    if (previewPhotos.length === 0) {
      setError('Add a photo before making the PDF.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const html = buildReportHtml(await documentFor(property, library.photos, mode, isPro), mode === 'compare');
      await exportPdf(html);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Report' }} />
      <Body muted>
        {isPro
          ? 'The PDF has the time and address under each photo.'
          : 'The free PDF has a preview mark. Lifetime removes it.'}
      </Body>
      <View style={styles.modes}>
        <ModeButton label="Move-in" active={mode === 'move-in'} onPress={() => setMode('move-in')} />
        <ModeButton label="Move-out" active={mode === 'move-out'} onPress={() => setMode('move-out')} />
        <ModeButton
          label={isPro ? 'Both' : 'Both · Lifetime'}
          active={mode === 'compare'}
          onPress={() => {
            if (!isPro) {
              router.push('/paywall');
              return;
            }
            setMode('compare');
          }}
        />
      </View>
      {error ? <Banner text={error} /> : null}
      {previewPhotos.length === 0 ? <Body muted>No photos for this report yet.</Body> : null}
      {mode === 'compare' ? (
        <Body muted>The PDF places each room’s move-in and move-out side by side.</Body>
      ) : null}
      {mode !== 'compare'
        ? property.rooms.map((room) => {
            const photos = photosFor(library.photos, property.id, room.id, mode);
            if (photos.length === 0) return null;
            return (
              <View key={room.id} style={styles.block}>
                <Text style={styles.room}>{room.name}</Text>
                {photos.map((photo) => (
                  <View key={photo.id} style={styles.figure}>
                    <Image source={{ uri: resolvePhotoUri(photo.stored) }} style={styles.image} contentFit="cover" />
                    <Text style={styles.caption}>
                      {formatWhen(photo.takenAt)} · {photoPlaceLine(photo.place, property.address)}
                    </Text>
                    {photo.note.trim() ? <Text style={styles.note}>{photo.note.trim()}</Text> : null}
                  </View>
                ))}
              </View>
            );
          })
        : null}
      <Button
        label={isPro ? 'Share PDF' : 'Share preview PDF'}
        onPress={exportReport}
        busy={busy}
        disabled={previewPhotos.length === 0}
      />
    </Screen>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.mode, active && styles.modeOn]}>
      <Text style={[styles.modeLabel, active && styles.modeLabelOn]}>{label}</Text>
    </Pressable>
  );
}

async function documentFor(
  property: NonNullable<ReturnType<typeof useProperty>>,
  photos: ReturnType<typeof useLibrary>['library']['photos'],
  mode: Mode,
  isPro: boolean,
): Promise<ReportDocument> {
  const figure = async (photo: (typeof photos)[number]): Promise<ReportFigure> => ({
    src: await photoSourceForPdf(photo.stored),
    when: formatWhen(photo.takenAt),
    place: photoPlaceLine(photo.place, property.address),
    note: photo.note,
  });

  const rooms = [];
  for (const room of property.rooms) {
    if (mode === 'compare') {
      const moveIn = photosFor(photos, property.id, room.id, 'move-in');
      const moveOut = photosFor(photos, property.id, room.id, 'move-out');
      if (moveIn.length === 0 && moveOut.length === 0) continue;
      rooms.push({
        name: room.name,
        figures: await Promise.all(moveIn.map(figure)),
        companion: await Promise.all(moveOut.map(figure)),
      });
    } else {
      const visitPhotos = photosFor(photos, property.id, room.id, mode);
      if (visitPhotos.length === 0) continue;
      rooms.push({ name: room.name, figures: await Promise.all(visitPhotos.map(figure)) });
    }
  }

  return {
    propertyName: property.name,
    propertyAddress: property.address,
    title: mode === 'compare' ? 'Move-in and move-out' : visitLabel(mode),
    generatedLabel: formatWhen(new Date().toISOString()),
    watermark: !isPro,
    rooms,
  };
}

const styles = StyleSheet.create({
  modes: { flexDirection: 'row', gap: 8 },
  mode: { flex: 1, borderWidth: 1, borderColor: theme.line, paddingVertical: 10, alignItems: 'center', backgroundColor: theme.card },
  modeOn: { backgroundColor: theme.ink, borderColor: theme.ink },
  modeLabel: { color: theme.ink, fontSize: 13 },
  modeLabelOn: { color: theme.card },
  block: { gap: 8 },
  room: { fontSize: 22, color: theme.ink },
  figure: { gap: 6 },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: theme.paperDeep },
  caption: { color: theme.inkSoft, fontSize: 13, lineHeight: 18 },
  note: { color: theme.ink, fontSize: 15, fontStyle: 'italic' },
});
