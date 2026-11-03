import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Field, Section, colors } from '../components/ui';
import type { RookCredentials } from '../storage';

export function CredentialsScreen({
  onSave,
}: {
  onSave: (credentials: RookCredentials) => Promise<void>;
}) {
  const [clientUUID, setClientUUID] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [showSecret, setShowSecret] = React.useState(false);

  const canSave = clientUUID.trim().length > 0 && secret.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ROOK SDK Link Tester</Text>
      <Section
        title="Sandbox credentials"
        description="Use a SANDBOX client from the ROOK Portal. First, on Set up → SDK Authentication, set the Android package name to com.sdklinkapp and create a Secret Word. The Secret Word is not the API secret key from Credentials. Both values are stored only on this device, never in the repository."
      >
        <Field
          label="Client UUID"
          value={clientUUID}
          onChangeText={setClientUUID}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Field
          label="Secret Word (from SDK Authentication)"
          value={secret}
          onChangeText={setSecret}
          secureTextEntry={!showSecret}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowSecret(prev => !prev)}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>
            {showSecret ? 'Hide Secret Word' : 'Show Secret Word'}
          </Text>
        </Pressable>
        <Button
          title="Save and initialize SDK"
          disabled={!canSave}
          onPress={() =>
            onSave({ clientUUID: clientUUID.trim(), secret: secret.trim() })
          }
        />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  toggle: { alignSelf: 'flex-start', paddingVertical: 4 },
  toggleText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
