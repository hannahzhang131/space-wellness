import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Photo, PoseStrip } from '@/components/photos';
import { Banner, Body, Button, Card, Display, Label, Screen } from '@/components/ui';
import { formatDay, formatShortDay } from '@/lib/format';
import {
  canAddCheckIn,
  defaultPair,
  FREE_CHECK_IN_LIMIT,
  formatWeight,
  formatWeightChange,
  newestFirst,
  sharedPoses,
  spanLabel,
  type CheckIn,
  type WeightUnit,
} from '@/lib/model';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary } from '@/state/library';
import { theme } from '@/theme';

export default function HomeScreen() {
  const { library, persistError, addCheckIn } = useLibrary();
  const { isPro } = useEntitlement();
  const { unit } = library.settings;
  const checkIns = newestFirst(library.checkIns);
  const pair = defaultPair(library.checkIns);

  const startCheckIn = () => {
    if (!canAddCheckIn(library.checkIns.length, isPro)) {
      router.push('/paywall');
      return;
    }
    const checkIn = addCheckIn();
    router.push(`/check-in/${checkIn.id}`);
  };

  return (
    <Screen header={false}>
      <View style={styles.top}>
        <Text style={styles.brand}>PROGRESS PICS</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} hitSlop={12}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
      </View>
      <Display>{checkIns.length === 0 ? 'See the change you can’t see in the mirror.' : 'Your progress'}</Display>
      {persistError ? <Banner text={persistError} /> : null}

      {pair ? <ProgressHero before={pair.before} after={pair.after} unit={unit} /> : null}

      <Button label="New check-in" tone="accent" onPress={startCheckIn} />
      {!isPro ? (
        <Body muted>{`${Math.min(library.checkIns.length, FREE_CHECK_IN_LIMIT)} of ${FREE_CHECK_IN_LIMIT} free check-ins used. Lifetime keeps every week.`}</Body>
      ) : null}

      {checkIns.length === 0 ? (
        <Card>
          <Label>How it works</Label>
          <Body>Once a week, take a front, side and back photo. Same spot, same light.</Body>
          <Body muted>Last week’s photo shows faintly on the camera, so you can line up the same pose. Photos stay on this phone.</Body>
        </Card>
      ) : (
        <View style={styles.list}>
          <Label>Check-ins</Label>
          {checkIns.map((checkIn) => (
            <Card key={checkIn.id} onPress={() => router.push(`/check-in/${checkIn.id}`)}>
              <View style={styles.row}>
                <Text style={styles.date}>{formatDay(checkIn.takenAt)}</Text>
                <Text style={styles.weight}>{formatWeight(checkIn.weightKg, unit)}</Text>
              </View>
              <PoseStrip checkIn={checkIn} />
              {checkIn.note ? <Text style={styles.note} numberOfLines={1}>{checkIn.note}</Text> : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function ProgressHero({ before, after, unit }: { before: CheckIn; after: CheckIn; unit: WeightUnit }) {
  const pose = sharedPoses(before, after)[0] ?? 'front';
  const change = formatWeightChange(before.weightKg, after.weightKg, unit);
  return (
    <Card onPress={() => router.push('/compare')} style={styles.hero}>
      <View style={styles.heroPhotos}>
        <View style={styles.heroSide}>
          <Photo stored={before.photos[pose]} style={styles.heroPhoto} />
          <Text style={styles.heroCaption}>{formatShortDay(before.takenAt)}</Text>
        </View>
        <View style={styles.heroSide}>
          <Photo stored={after.photos[pose]} style={styles.heroPhoto} />
          <Text style={styles.heroCaption}>{formatShortDay(after.takenAt)}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.heroStat}>{spanLabel(before.takenAt, after.takenAt)}</Text>
        {change ? <Text style={styles.heroStat}>{change}</Text> : null}
      </View>
      <Text style={styles.heroLink}>Compare →</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { letterSpacing: 2, fontSize: 12, fontWeight: '700', color: theme.inkSoft },
  link: { color: theme.ink, fontSize: 16, fontWeight: '500' },
  list: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  date: { fontSize: 17, fontWeight: '700', color: theme.ink },
  weight: { fontSize: 15, color: theme.inkSoft },
  note: { fontSize: 14, color: theme.inkSoft },
  hero: { padding: 12, gap: 10 },
  heroPhotos: { flexDirection: 'row', gap: 8 },
  heroSide: { flex: 1, gap: 6 },
  heroPhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12 },
  heroCaption: { fontSize: 13, fontWeight: '600', color: theme.inkSoft, textAlign: 'center' },
  heroStat: { fontSize: 18, fontWeight: '800', color: theme.ink, letterSpacing: -0.3 },
  heroLink: { fontSize: 15, fontWeight: '600', color: theme.accent },
});
