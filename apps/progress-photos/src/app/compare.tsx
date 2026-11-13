import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { FadeCompare } from '@/components/fade';
import { Photo } from '@/components/photos';
import { Banner, Body, Button, Label, Screen, Segmented } from '@/components/ui';
import { formatShortDay } from '@/lib/format';
import {
  defaultPair,
  formatWeight,
  formatWeightChange,
  oldestFirst,
  photoCount,
  POSES,
  poseLabel,
  spanLabel,
  type CheckIn,
  type Pose,
} from '@/lib/model';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary } from '@/state/library';
import { theme } from '@/theme';

type Mode = 'side' | 'fade';

export default function CompareScreen() {
  const { library } = useLibrary();
  const { isPro } = useEntitlement();
  const { unit } = library.settings;
  const candidates = oldestFirst(library.checkIns).filter((item) => photoCount(item) > 0);
  const initial = defaultPair(library.checkIns);
  const [beforeId, setBeforeId] = useState(initial?.before.id);
  const [afterId, setAfterId] = useState(initial?.after.id);
  const [pose, setPose] = useState<Pose>('front');
  const [mode, setMode] = useState<Mode>('side');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const collage = useRef<ComponentRef<typeof View>>(null);

  const before = candidates.find((item) => item.id === beforeId) ?? initial?.before;
  const after = candidates.find((item) => item.id === afterId) ?? initial?.after;

  if (!before || !after) {
    return (
      <Screen>
        <Body>Take photos on two different days to compare them.</Body>
        <Body muted>Weekly works best: same spot, same light, same time of day.</Body>
      </Screen>
    );
  }

  const change = formatWeightChange(before.weightKg, after.weightKg, unit);

  const share = async () => {
    if (!collage.current) return;
    setError(null);
    setSharing(true);
    try {
      const uri = await captureRef(collage.current, { format: 'jpg', quality: 0.92, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg', dialogTitle: 'Share progress' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not make the image.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen>
      <View style={styles.stats}>
        <Stat label="Time" value={spanLabel(before.takenAt, after.takenAt)} />
        <Stat label="Weight" value={change ?? '—'} />
      </View>

      <DatePicker label="Before" items={candidates} selected={before.id} onSelect={setBeforeId} />
      <DatePicker label="After" items={candidates} selected={after.id} onSelect={setAfterId} />

      <Segmented
        options={POSES.map((item) => ({ value: item, label: poseLabel(item) }))}
        value={pose}
        onChange={setPose}
      />
      <Segmented
        options={[
          { value: 'side', label: 'Side by side' },
          { value: 'fade', label: isPro ? 'Fade' : 'Fade · Lifetime' },
        ]}
        value={mode}
        onChange={(next) => {
          if (next === 'fade' && !isPro) {
            router.push('/paywall');
            return;
          }
          setMode(next);
        }}
      />

      {error ? <Banner text={error} /> : null}

      {mode === 'fade' ? (
        <FadeCompare before={before.photos[pose]} after={after.photos[pose]} />
      ) : (
        <View ref={collage} collapsable={false} style={styles.collage}>
          <View style={styles.pair}>
            <CollageSide checkIn={before} pose={pose} unit={unit} label="Before" />
            <CollageSide checkIn={after} pose={pose} unit={unit} label="After" />
          </View>
          <View style={styles.collageFooter}>
            <Text style={styles.collageStat}>
              {[spanLabel(before.takenAt, after.takenAt), change].filter(Boolean).join(' · ')}
            </Text>
            {!isPro ? <Text style={styles.watermark}>Progress Pics</Text> : null}
          </View>
        </View>
      )}

      {mode === 'side' && Platform.OS !== 'web' ? (
        <Button label="Share image" tone="ink" onPress={() => void share()} busy={sharing} />
      ) : null}
      {mode === 'side' && !isPro ? (
        <Body muted>Free images carry a small Progress Pics mark. Lifetime removes it.</Body>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Label>{label}</Label>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function CollageSide({ checkIn, pose, unit, label }: { checkIn: CheckIn; pose: Pose; unit: 'kg' | 'lb'; label: string }) {
  const stored = checkIn.photos[pose];
  return (
    <View style={styles.side}>
      <View style={styles.photoFrame}>
        <Photo stored={stored} style={StyleSheet.absoluteFill} />
        {!stored ? <Text style={styles.missing}>No {poseLabel(pose).toLowerCase()} photo</Text> : null}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      </View>
      <Text style={styles.sideDate}>{formatShortDay(checkIn.takenAt)}</Text>
      {checkIn.weightKg !== null ? <Text style={styles.sideWeight}>{formatWeight(checkIn.weightKg, unit)}</Text> : null}
    </View>
  );
}

function DatePicker({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: CheckIn[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.picker}>
      <Label>{label}</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {items.map((item) => {
          const active = item.id === selected;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(item.id)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatShortDay(item.takenAt)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.line, padding: 14, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: theme.ink },
  picker: { gap: 8 },
  chips: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 14, minHeight: 36, borderRadius: 18, justifyContent: 'center', backgroundColor: theme.paperDeep },
  chipActive: { backgroundColor: theme.ink },
  chipText: { fontSize: 14, fontWeight: '600', color: theme.ink },
  chipTextActive: { color: theme.card },
  collage: { backgroundColor: theme.card, borderRadius: 18, padding: 10, gap: 10 },
  pair: { flexDirection: 'row', gap: 8 },
  side: { flex: 1, gap: 4 },
  photoFrame: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.paperDeep, justifyContent: 'center' },
  missing: { textAlign: 'center', color: theme.inkSoft, fontSize: 13, paddingHorizontal: 8 },
  badge: { position: 'absolute', left: 8, top: 8, backgroundColor: 'rgba(20,20,20,0.72)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: theme.card, fontSize: 12, fontWeight: '700' },
  sideDate: { fontSize: 15, fontWeight: '700', color: theme.ink, textAlign: 'center', marginTop: 2 },
  sideWeight: { fontSize: 13, color: theme.inkSoft, textAlign: 'center' },
  collageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  collageStat: { fontSize: 15, fontWeight: '800', color: theme.ink },
  watermark: { fontSize: 12, fontWeight: '700', color: theme.inkSoft, letterSpacing: 0.5 },
});
