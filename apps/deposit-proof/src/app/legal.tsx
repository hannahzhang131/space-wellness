import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { privacySections } from '@/content/privacy';
import { serif, theme } from '@/theme';

export default function LegalScreen() {
  return (
    <Screen>
      {privacySections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.title}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  title: { fontFamily: serif, fontSize: 24, color: theme.ink },
  body: { fontSize: 16, lineHeight: 23, color: theme.ink },
});
