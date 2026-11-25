import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configureNotifications } from '@/lib/reminders';
import { EntitlementProvider, useEntitlement } from '@/state/entitlements';
import { LibraryProvider, useLibrary } from '@/state/library';
import { LockGate } from '@/state/lock';
import { theme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
configureNotifications();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <EntitlementProvider>
          <ReadyGate />
        </EntitlementProvider>
      </LibraryProvider>
    </SafeAreaProvider>
  );
}

function ReadyGate() {
  const library = useLibrary();
  const entitlement = useEntitlement();
  const ready = library.ready && entitlement.ready;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <LockGate>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.paper },
          headerShadowVisible: false,
          headerTintColor: theme.ink,
          headerTitleStyle: { fontWeight: '700', color: theme.ink },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.paper },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="check-in/[id]" options={{ title: 'Check-in' }} />
        <Stack.Screen
          name="camera/[id]/[pose]"
          options={{ headerShown: false, presentation: 'fullScreenModal', contentStyle: { backgroundColor: theme.night } }}
        />
        <Stack.Screen name="compare" options={{ title: 'Compare' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'Lifetime' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="legal" options={{ title: 'Privacy' }} />
      </Stack>
    </LockGate>
  );
}
