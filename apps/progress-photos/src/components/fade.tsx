import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Photo } from '@/components/photos';
import { theme } from '@/theme';

/** Before underneath, after on top; dragging the bar fades between them. */
export function FadeCompare({ before, after }: { before: string | undefined; after: string | undefined }) {
  const [amount, setAmount] = useState(0.5);
  const [width, setWidth] = useState(1);

  const move = (x: number) => setAmount(Math.min(1, Math.max(0, x / width)));

  return (
    <View style={styles.wrap}>
      <View style={styles.stack}>
        <Photo stored={before} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { opacity: amount }]}>
          <Photo stored={after} style={StyleSheet.absoluteFill} />
        </View>
      </View>
      <View
        style={styles.track}
        onLayout={(event: LayoutChangeEvent) => setWidth(Math.max(1, event.nativeEvent.layout.width))}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => move(event.nativeEvent.locationX)}
        onResponderMove={(event) => move(event.nativeEvent.locationX)}
        accessibilityRole="adjustable"
        accessibilityLabel="Fade between before and after"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(amount * 100) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          setAmount((current) => Math.min(1, Math.max(0, current + (event.nativeEvent.actionName === 'increment' ? 0.1 : -0.1))))
        }>
        <View style={styles.rail} />
        <View style={[styles.fill, { width: `${amount * 100}%` }]} />
        <View pointerEvents="none" style={[styles.knob, { left: `${amount * 100}%` }]} />
      </View>
      <View style={styles.ends}>
        <Text style={styles.end}>Before</Text>
        <Text style={styles.end}>After</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  stack: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.paperDeep },
  track: { height: 36, justifyContent: 'center' },
  rail: { height: 6, borderRadius: 3, backgroundColor: theme.paperDeep },
  fill: { position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: theme.accent },
  knob: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  end: { fontSize: 13, fontWeight: '600', color: theme.inkSoft },
});
