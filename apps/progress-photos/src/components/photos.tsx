import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolvePhotoUri } from '@/lib/files';
import { POSES, poseLabel, type CheckIn, type Pose } from '@/lib/model';
import { theme } from '@/theme';

export function Photo({ stored, style }: { stored: string | undefined; style?: object }) {
  if (!stored) return <View style={[styles.empty, style]} />;
  return <Image source={{ uri: resolvePhotoUri(stored) }} style={[styles.photo, style]} contentFit="cover" transition={120} />;
}

export function PoseStrip({ checkIn }: { checkIn: CheckIn }) {
  return (
    <View style={styles.strip}>
      {POSES.map((pose) => (
        <View key={pose} style={styles.stripCell}>
          <Photo stored={checkIn.photos[pose]} style={styles.stripPhoto} />
        </View>
      ))}
    </View>
  );
}

export function PoseTile({
  pose,
  stored,
  selected,
  onPress,
}: {
  pose: Pose;
  stored: string | undefined;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={stored ? `${poseLabel(pose)} photo` : `Take ${poseLabel(pose)} photo`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, selected && styles.tileSelected, pressed && { opacity: 0.85 }]}>
      {stored ? (
        <Photo stored={stored} style={styles.tilePhoto} />
      ) : (
        <View style={styles.tileEmpty}>
          <Text style={styles.plus}>+</Text>
        </View>
      )}
      <Text style={styles.tileLabel}>{poseLabel(pose)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  photo: { backgroundColor: theme.paperDeep },
  empty: { backgroundColor: theme.paperDeep },
  strip: { flexDirection: 'row', gap: 6 },
  stripCell: { flex: 1 },
  stripPhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: 10 },
  tile: { flex: 1, gap: 6, borderRadius: 14, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  tileSelected: { borderColor: theme.accent },
  tilePhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: 11 },
  tileEmpty: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 11,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { fontSize: 30, color: theme.inkSoft, fontWeight: '300' },
  tileLabel: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: theme.ink },
});
