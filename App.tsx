import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RookSyncGate } from 'react-native-rook-sdk';
import { colors } from './src/components/ui';
import { CredentialsScreen } from './src/screens/CredentialsScreen';
import { LinkingScreen } from './src/screens/LinkingScreen';
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
  type RookCredentials,
} from './src/storage';

function App() {
  const [loading, setLoading] = React.useState(true);
  const [credentials, setCredentials] = React.useState<RookCredentials | null>(
    null,
  );

  React.useEffect(() => {
    loadCredentials()
      .then(setCredentials)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (next: RookCredentials) => {
    await saveCredentials(next);
    setCredentials(next);
  };

  const handleReset = async () => {
    await clearCredentials();
    setCredentials(null);
  };

  let content: React.ReactNode;
  if (loading) {
    content = <ActivityIndicator style={styles.loader} />;
  } else if (!credentials) {
    content = <CredentialsScreen onSave={handleSave} />;
  } else {
    content = (
      // Background sync is off so each linking step is triggered by hand.
      <RookSyncGate
        key={credentials.clientUUID}
        environment="sandbox"
        clientUUID={credentials.clientUUID}
        secret={credentials.secret}
        enableLogs={__DEV__}
        enableBackgroundSync={false}
      >
        <LinkingScreen onResetCredentials={handleReset} />
      </RookSyncGate>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <SafeAreaView style={styles.root}>
        <View style={styles.root}>{content}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 48 },
});

export default App;
