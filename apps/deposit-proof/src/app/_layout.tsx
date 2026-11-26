import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { serif, theme } from '@/theme';
import { EntitlementProvider, useEntitlement } from '@/state/entitlements';
import { LibraryProvider, useLibrary } from '@/state/library';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

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

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.paper },
          headerShadowVisible: false,
          headerTintColor: theme.ink,
          headerTitleStyle: { fontFamily: Platform.OS === 'ios' ? serif : 'serif', color: theme.ink },
          contentStyle: { backgroundColor: theme.paper },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'Lifetime' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="legal" options={{ title: 'Privacy' }} />
        <Stack.Screen name="property/new" options={{ title: 'New home' }} />
        <Stack.Screen name="property/[id]" options={{ title: 'Home' }} />
        <Stack.Screen name="visit/[propertyId]/[kind]" options={{ title: 'Rooms' }} />
        <Stack.Screen name="room/[propertyId]/[kind]/[roomId]" options={{ title: 'Room' }} />
        <Stack.Screen name="compare/[propertyId]" options={{ title: 'Compare' }} />
        <Stack.Screen name="report/[propertyId]" options={{ title: 'Report' }} />
      </Stack>
    </>
  );
}
