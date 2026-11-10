import { router } from 'expo-router';
import { useState } from 'react';

import { Banner, Body, Button, Field, Screen } from '@/components/ui';
import { canAddProperty } from '@/lib/model';
import { useEntitlement } from '@/state/entitlements';
import { useLibrary } from '@/state/library';

export default function NewHomeScreen() {
  const { library, addProperty } = useLibrary();
  const { isPro } = useEntitlement();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!canAddProperty(library.properties.length, isPro)) {
      router.replace('/paywall');
      return;
    }
    if (!name.trim() || !address.trim()) {
      setError('Add a name and the address that should appear on the report.');
      return;
    }
    const property = addProperty(name, address);
    router.replace(`/property/${property.id}`);
  };

  return (
    <Screen>
      <Body>This address is printed on every page. Photos can also carry the street address from your location.</Body>
      {error ? <Banner text={error} /> : null}
      <Field label="Name" value={name} onChangeText={setName} placeholder="Maple apartment" />
      <Field
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="14 King Street, London"
        multiline
      />
      <Button label="Create home" onPress={save} />
    </Screen>
  );
}
