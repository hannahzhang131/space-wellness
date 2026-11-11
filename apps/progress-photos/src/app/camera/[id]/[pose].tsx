import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { persistPhoto, resolvePhotoUri } from '@/lib/files';
import { oneParam } from '@/lib/format';
import { createId, ghostFor, POSES, poseLabel, type Pose } from '@/lib/model';
import { useLibrary } from '@/state/library';
import { theme } from '@/theme';

const TIMERS = [0, 3, 10] as const;
type Timer = (typeof TIMERS)[number];

export default function CameraScreen() {
  const params = useLocalSearchParams<{ id: string; pose: string }>();
  const checkInId = oneParam(params.id);
  const rawPose = oneParam(params.pose);
  const pose = POSES.find((item) => item === rawPose) as Pose | undefined;
  const { library, setPhoto } = useLibrary();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [timer, setTimer] = useState<Timer>(0);
  const [showGhost, setShowGhost] = useState(true);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ticks = useRef<ReturnType<typeof setTimeout>[]>([]);

  const ghost = checkInId && pose ? ghostFor(library.checkIns, checkInId, pose) : null;

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);

  const capture = async () => {
    if (!camera.current || !checkInId || !pose) return;
    setSaving(true);
    setError(null);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.9 });
      const stored = await persistPhoto(picture.uri, createId());
      setPhoto(checkInId, pose, stored);
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The photo was not saved. Try again.');
      setSaving(false);
    }
  };

  const shoot = () => {
    if (!ready || saving || countdown !== null) return;
    if (timer === 0) {
      void capture();
      return;
    }
    setCountdown(timer);
    for (let second = 1; second <= timer; second += 1) {
      ticks.current.push(
        setTimeout(() => {
          if (second < timer) {
            setCountdown(timer - second);
            return;
          }
          setCountdown(null);
          void capture();
        }, second * 1000),
      );
    }
  };

  useEffect(() => () => ticks.current.forEach(clearTimeout), []);

  if (!checkInId || !pose) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.message}>This photo slot is not available.</Text>
        <Button label="Close" tone="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.card} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>Camera is off</Text>
        <Text style={styles.message}>Progress Pics needs the camera to take your {poseLabel(pose).toLowerCase()} photo. Photos stay on this phone.</Text>
        <View style={styles.permissionActions}>
          {permission.canAskAgain ? (
            <Button label="Allow camera" tone="accent" onPress={() => void requestPermission()} />
          ) : (
            <Button label="Open Settings" tone="accent" onPress={() => void Linking.openSettings()} />
          )}
          <Button label="Not now" tone="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.topText}>Cancel</Text>
        </Pressable>
        <Text style={styles.poseName}>{poseLabel(pose)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Switch camera"
          onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
          hitSlop={12}>
          <Text style={styles.topText}>{facing === 'back' ? 'Selfie' : 'Back'}</Text>
        </Pressable>
      </View>

      <View style={styles.viewport}>
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mirror={facing === 'front'}
          onCameraReady={() => setReady(true)}
          onMountError={(event) => setError(event.message)}
        />
        {ghost && showGhost ? (
          <Image source={{ uri: resolvePhotoUri(ghost) }} style={[StyleSheet.absoluteFill, styles.ghost]} contentFit="cover" />
        ) : null}
        <View pointerEvents="none" style={styles.guides}>
          <View style={[styles.guideLine, { left: '33.3%' }]} />
          <View style={[styles.guideLine, { left: '66.6%' }]} />
        </View>
        {countdown !== null ? (
          <View pointerEvents="none" style={styles.countdown}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.hint}>
        {error ?? (ghost ? 'Line yourself up with last time’s outline.' : 'Stand in the middle, phone at chest height. Use this spot every week.')}
      </Text>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Self-timer"
          onPress={() => setTimer((current) => TIMERS[(TIMERS.indexOf(current) + 1) % TIMERS.length])}
          style={styles.sideControl}>
          <Text style={styles.sideValue}>{timer === 0 ? 'Off' : `${timer}s`}</Text>
          <Text style={styles.sideLabel}>Timer</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          onPress={shoot}
          disabled={!ready || saving}
          style={({ pressed }) => [styles.shutter, (pressed || saving) && { opacity: 0.7 }]}>
          {saving ? <ActivityIndicator color={theme.ink} /> : <View style={styles.shutterInner} />}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show last photo outline"
          disabled={!ghost}
          onPress={() => setShowGhost((current) => !current)}
          style={[styles.sideControl, !ghost && { opacity: 0.35 }]}>
          <Text style={styles.sideValue}>{ghost && showGhost ? 'On' : 'Off'}</Text>
          <Text style={styles.sideLabel}>Ghost</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.night, gap: 14 },
  center: { flex: 1, backgroundColor: theme.night, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  title: { color: theme.card, fontSize: 24, fontWeight: '700' },
  message: { color: '#B5B1A8', fontSize: 16, lineHeight: 23, textAlign: 'center' },
  permissionActions: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, minHeight: 44 },
  topText: { color: theme.card, fontSize: 16 },
  poseName: { color: theme.card, fontSize: 17, fontWeight: '700' },
  viewport: { width: '100%', aspectRatio: 3 / 4, overflow: 'hidden', backgroundColor: '#1C1C1C' },
  ghost: { opacity: 0.35 },
  guides: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  guideLine: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.35)' },
  countdown: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  countdownText: { color: theme.card, fontSize: 120, fontWeight: '800' },
  hint: { color: '#B5B1A8', fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 28, minHeight: 40 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 'auto' },
  sideControl: { width: 72, alignItems: 'center', gap: 2 },
  sideValue: { color: theme.card, fontSize: 17, fontWeight: '700' },
  sideLabel: { color: '#8F8B83', fontSize: 12 },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: theme.card },
});
