import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { theme } from '@/theme';

export async function canUseDeviceLock(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return level !== LocalAuthentication.SecurityLevel.NONE;
}

export async function confirmOwner(prompt: string): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: prompt });
  return result.success;
}

export function LockGate({ children }: { children: ReactNode }) {
  const { library } = useLibrary();
  const enabled = library.settings.lock && Platform.OS !== 'web';
  const [unlocked, setUnlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const asking = useRef(false);

  const unlock = useCallback(async () => {
    if (asking.current) return;
    asking.current = true;
    try {
      const ok = await confirmOwner('Unlock Progress Pics');
      setUnlocked(ok);
      setFailed(!ok);
    } finally {
      asking.current = false;
    }
  }, []);

  useEffect(() => {
    if (enabled && !unlocked) void unlock();
  }, [enabled, unlocked, unlock]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') setUnlocked(false);
    });
    return () => subscription.remove();
  }, [enabled]);

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <View style={styles.locked}>
      <Text style={styles.title}>Progress Pics is locked</Text>
      <Text style={styles.body}>{failed ? 'Not unlocked. Try again.' : 'Your photos stay hidden until you unlock.'}</Text>
      <View style={styles.action}>
        <Button label="Unlock" tone="accent" onPress={() => void unlock()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  locked: { flex: 1, backgroundColor: theme.night, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { color: theme.card, fontSize: 24, fontWeight: '700' },
  body: { color: '#A9A59D', fontSize: 16, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: 12 },
});
