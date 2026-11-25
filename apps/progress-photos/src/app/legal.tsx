import { StyleSheet, View } from 'react-native';

import { Body, Heading, Screen } from '@/components/ui';
import { privacySections } from '@/content/privacy';

export default function LegalScreen() {
  return (
    <Screen>
      {privacySections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Heading>{section.title}</Heading>
          <Body>{section.body}</Body>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
});
