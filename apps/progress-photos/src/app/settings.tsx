import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Banner, Body, Button, Label, Screen, Segmented } from '@/components/ui';
import { formatClock, WEEKDAYS } from '@/lib/format';
import type { Reminder, WeightUnit } from '@/lib/model';
import { applyReminder } from '@/lib/reminders';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary } from '@/state/library';
import { canUseDeviceLock, confirmOwner } from '@/state/lock';
import { theme } from '@/theme';

const HOURS = [6, 7, 8, 9, 12, 18, 20, 21];
const DEFAULT_REMINDER: Reminder = { weekday: 2, hour: 7, minute: 0 };

export default function SettingsScreen() {
  const { library, updateSettings } = useLibrary();
  const { settings } = library;
  const { isPro, restore, busy, error, previewLifetime, iapAvailable } = useEntitlement();
  const [notice, setNotice] = useState<string | null>(null);
  const [lockAvailable, setLockAvailable] = useState(false);

  useEffect(() => {
    canUseDeviceLock()
      .then(setLockAvailable)
      .catch(() => setLockAvailable(false));
  }, []);

  const setReminder = async (reminder: Reminder | null) => {
    setNotice(null);
    try {
      const allowed = await applyReminder(reminder);
      if (!allowed) {
        setNotice('Notifications are off for Progress Pics. Turn them on in iOS Settings to get the weekly reminder.');
        updateSettings({ reminder: null });
        return;
      }
      updateSettings({ reminder });
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Could not set the reminder.');
    }
  };

  const toggleLock = async (next: boolean) => {
    setNotice(null);
    const ok = await confirmOwner(next ? 'Turn on the lock' : 'Turn off the lock');
    if (ok) updateSettings({ lock: next });
  };

  const reminder = settings.reminder;

  return (
    <Screen>
      {notice ? <Banner text={notice} /> : null}

      <View style={styles.section}>
        <Label>Weight unit</Label>
        <Segmented<WeightUnit>
          options={[
            { value: 'kg', label: 'Kilograms' },
            { value: 'lb', label: 'Pounds' },
          ]}
          value={settings.unit}
          onChange={(unit) => updateSettings({ unit })}
        />
      </View>

      {Platform.OS !== 'web' ? (
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.rowTitle}>Weekly reminder</Text>
              <Text style={styles.rowMeta}>
                {reminder ? `${WEEKDAYS[reminder.weekday - 1]} at ${formatClock(reminder.hour, reminder.minute)}` : 'Off'}
              </Text>
            </View>
            <Switch
              value={reminder !== null}
              onValueChange={(on) => void setReminder(on ? DEFAULT_REMINDER : null)}
              trackColor={{ true: theme.accent, false: theme.paperDeep }}
            />
          </View>
          {reminder ? (
            <>
              <ChipRow
                items={WEEKDAYS.map((day, index) => ({ key: index + 1, label: day.slice(0, 3) }))}
                selected={reminder.weekday}
                onSelect={(weekday) => void setReminder({ ...reminder, weekday })}
              />
              <ChipRow
                items={HOURS.map((hour) => ({ key: hour, label: formatClock(hour, 0) }))}
                selected={reminder.hour}
                onSelect={(hour) => void setReminder({ ...reminder, hour, minute: 0 })}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {lockAvailable ? (
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.rowTitle}>Lock with Face ID</Text>
              <Text style={styles.rowMeta}>Ask for Face ID or your passcode when the app opens.</Text>
            </View>
            <Switch
              value={settings.lock}
              onValueChange={(next) => void toggleLock(next)}
              trackColor={{ true: theme.accent, false: theme.paperDeep }}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Label>Lifetime</Label>
        <Body>{isPro ? 'Lifetime is on.' : 'Free keeps six check-ins. Lifetime is a one-time purchase.'}</Body>
        {error ? <Banner text={error} /> : null}
        {!isPro ? <Button label="See Lifetime" tone="accent" onPress={() => router.push('/paywall')} /> : null}
        <Button label="Restore purchase" tone="ghost" onPress={() => void restore()} busy={busy} />
        {!iapAvailable && __DEV__ && !isPro ? (
          <Button label="Preview Lifetime on this dev build" tone="ghost" onPress={previewLifetime} />
        ) : null}
      </View>

      <Button label="Privacy" tone="ghost" onPress={() => router.push('/legal')} />
      <View style={styles.company}>
        <Text style={styles.block}>Oceanink Ltd</Text>
        <Text style={styles.meta}>124 City Road, London EC1V 2NX</Text>
        <Text style={styles.meta}>Company number 16684370</Text>
        <Text style={styles.meta}>Progress Pics 1.0.0 · No account. Photos stay on this phone.</Text>
      </View>
    </Screen>
  );
}

function ChipRow({
  items,
  selected,
  onSelect,
}: {
  items: { key: number; label: string }[];
  selected: number;
  onSelect: (key: number) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {items.map((item) => {
        const active = item.key === selected;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.key)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.line, padding: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: theme.ink },
  rowMeta: { fontSize: 14, color: theme.inkSoft, lineHeight: 19 },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 12, minHeight: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: theme.paperDeep },
  chipActive: { backgroundColor: theme.ink },
  chipText: { fontSize: 14, fontWeight: '600', color: theme.ink },
  chipTextActive: { color: theme.card },
  company: { gap: 2, marginTop: 4 },
  block: { fontSize: 17, fontWeight: '700', color: theme.ink },
  meta: { color: theme.inkSoft, fontSize: 14, lineHeight: 20 },
});
