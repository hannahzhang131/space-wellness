import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { serif, theme } from '@/theme';

export function Screen({
  children,
  header = true,
}: {
  children: ReactNode;
  header?: boolean;
}) {
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

export function Body({ children, muted = false }: { children: string; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.inkSoft}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMulti]}
      />
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
  tone?: 'ink' | 'seal' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
}) {
  const background = tone === 'ink' ? theme.ink : tone === 'seal' ? theme.seal : 'transparent';
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
          borderColor: tone === 'ghost' ? theme.ink : background,
          opacity: disabled ? 0.4 : pressed ? 0.84 : 1,
        },
      ]}>
      {busy ? <ActivityIndicator color={color} /> : <Text style={[styles.buttonLabel, { color }]}>{label}</Text>}
    </Pressable>
  );
}

export function Stamp({ label }: { label: string }) {
  return (
    <View style={styles.stamp} accessibilityLabel={label}>
      <Text style={styles.stampText}>{label}</Text>
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
      <Text style={styles.confirmTitle}>{title}</Text>
      <Body>{body}</Body>
      <Button label={confirmLabel} tone="seal" onPress={onConfirm} />
      <Button label="Cancel" tone="ghost" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: theme.paper,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
  },
  scroll: { flex: 1 },
  display: {
    fontFamily: serif,
    fontSize: 36,
    lineHeight: 40,
    color: theme.ink,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    color: theme.ink,
  },
  muted: { color: theme.inkSoft },
  field: { gap: 6 },
  label: {
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: theme.inkSoft,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    color: theme.ink,
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  stamp: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: theme.seal,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  stampText: {
    color: theme.seal,
    fontFamily: serif,
    fontSize: 13,
    letterSpacing: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    borderLeftWidth: 4,
    borderLeftColor: theme.seal,
    padding: 16,
    gap: 6,
  },
  banner: {
    backgroundColor: theme.sealSoft,
    padding: 12,
  },
  bannerText: { color: theme.seal, fontSize: 14, lineHeight: 20 },
  confirm: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
    gap: 12,
  },
  confirmTitle: {
    fontFamily: serif,
    fontSize: 24,
    color: theme.ink,
  },
});
