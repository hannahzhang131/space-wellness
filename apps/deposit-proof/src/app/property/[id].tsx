import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Body, Button, Card, ConfirmBox, Field, Screen } from '@/components/ui';
import { oneParam } from '@/lib/format';
import { visitLabel, type VisitKind } from '@/lib/model';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary, useProperty } from '@/state/library';
import { serif, theme } from '@/theme';

export default function PropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = oneParam(id);
  const property = useProperty(propertyId);
  const { library, updateProperty, deleteProperty } = useLibrary();
  const { isPro } = useEntitlement();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(property?.name ?? '');
  const [address, setAddress] = useState(property?.address ?? '');
  const [confirming, setConfirming] = useState(false);

  if (!property || !propertyId) {
    return (
      <Screen>
        <Body>This home is not on this phone.</Body>
      </Screen>
    );
  }

  const count = (visit: VisitKind) =>
    library.photos.filter((photo) => photo.propertyId === property.id && photo.visit === visit).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: property.name }} />
      {editing ? (
        <>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="Address" value={address} onChangeText={setAddress} multiline />
          <Button
            label="Save"
            onPress={() => {
              if (!name.trim() || !address.trim()) return;
              updateProperty(property.id, name, address);
              setEditing(false);
            }}
          />
        </>
      ) : (
        <>
          <Text style={styles.address}>{property.address}</Text>
          <Button label="Edit name and address" tone="ghost" onPress={() => {
            setName(property.name);
            setAddress(property.address);
            setEditing(true);
          }} />
        </>
      )}
      <VisitCard
        visit="move-in"
        count={count('move-in')}
        onPress={() => router.push(`/visit/${property.id}/move-in`)}
      />
      <VisitCard
        visit="move-out"
        count={count('move-out')}
        onPress={() => router.push(`/visit/${property.id}/move-out`)}
      />
      <Card
        onPress={() => {
          if (!isPro) {
            router.push('/paywall');
            return;
          }
          router.push(`/compare/${property.id}`);
        }}>
        <Text style={styles.cardTitle}>Move-in next to move-out</Text>
        <Body muted>{isPro ? 'Open the comparison.' : 'Lifetime unlocks the side-by-side view.'}</Body>
      </Card>
      <Button label="Make a PDF" onPress={() => router.push(`/report/${property.id}`)} />
      {confirming ? (
        <ConfirmBox
          title="Delete this home?"
          body="Photos of this home are removed from the app. A PDF you already shared is not affected."
          confirmLabel="Delete home"
          onConfirm={() => {
            deleteProperty(property.id);
            router.back();
          }}
          onCancel={() => setConfirming(false)}
        />
      ) : (
        <Button label="Delete this home" tone="ghost" onPress={() => setConfirming(true)} />
      )}
    </Screen>
  );
}

function VisitCard({ visit, count, onPress }: { visit: VisitKind; count: number; onPress: () => void }) {
  return (
    <Card onPress={onPress}>
      <Text style={styles.cardTitle}>{visitLabel(visit)}</Text>
      <Body muted>{count === 0 ? 'No photos yet' : `${count} photo${count === 1 ? '' : 's'}`}</Body>
    </Card>
  );
}

const styles = StyleSheet.create({
  address: { fontFamily: serif, fontSize: 22, color: theme.ink, lineHeight: 28 },
  cardTitle: { fontFamily: serif, fontSize: 26, color: theme.ink },
});
