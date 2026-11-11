import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

export function Screen({ children, header = true }: { children: ReactNode; header?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.frame}>
      <View style={styles.column}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingTop: header ? 12 : insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 32,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

export function Display({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[styles.display, style]}>{children}</Text>;
}

export function Heading({ children }: { children: string }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Body({ children, muted = false }: { children: string; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad';
  suffix?: string;
}) {
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.inkSoft}
          multiline={multiline}
          keyboardType={keyboardType}
          style={[styles.input, multiline && styles.inputMulti]}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = 'ink',
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  tone?: 'ink' | 'accent' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
}) {
  const background = tone === 'ink' ? theme.ink : tone === 'accent' ? theme.accent : 'transparent';
  const color = tone === 'ghost' ? theme.ink : theme.card;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: tone === 'ghost' ? theme.line : background,
          opacity: disabled ? 0.4 : pressed ? 0.84 : 1,
        },
      ]}>
      {busy ? <ActivityIndicator color={color} /> : <Text style={[styles.buttonLabel, { color }]}>{label}</Text>}
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: ViewStyle }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.88 }]}>
      {children}
    </Pressable>
  );
}

export function Banner({ text }: { text: string }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

export function ConfirmBox({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.confirm}>
      <Heading>{title}</Heading>
      <Body>{body}</Body>
      <Button label={confirmLabel} tone="accent" onPress={onConfirm} />
      <Button label="Cancel" tone="ghost" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: theme.paper, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 560 },
  scroll: { flex: 1 },
  display: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8, color: theme.ink },
  heading: { fontSize: 20, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3, color: theme.ink },
  body: { fontSize: 16, lineHeight: 23, color: theme.ink },
  muted: { color: theme.inkSoft },
  label: { fontSize: 12, letterSpacing: 1.1, fontWeight: '600', textTransform: 'uppercase', color: theme.inkSoft },
  field: { gap: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    backgroundColor: theme.card,
    color: theme.ink,
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },
  suffix: { fontSize: 16, color: theme.inkSoft, minWidth: 24 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  buttonLabel: { fontSize: 16, fontWeight: '600', letterSpacing: 0.1 },
  segmented: { flexDirection: 'row', backgroundColor: theme.paperDeep, borderRadius: 12, padding: 3, gap: 3 },
  segment: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: theme.card },
  segmentLabel: { fontSize: 14, fontWeight: '600', color: theme.inkSoft },
  segmentLabelActive: { color: theme.ink },
  card: {
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 14,
    gap: 8,
  },
  banner: { backgroundColor: theme.accentSoft, borderRadius: 12, padding: 12 },
  bannerText: { color: theme.accent, fontSize: 14, lineHeight: 20 },
  confirm: { backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.line, padding: 16, gap: 12 },
});
