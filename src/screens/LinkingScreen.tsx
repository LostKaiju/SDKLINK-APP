import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  APIDataSource,
  RookSdk,
  SDKDataSource,
  useRookAPISources,
  useRookConfiguration,
  useRookHealthConnect,
  useRookPermissions,
  useRookSamsungHealth,
  useRookSync,
  type AuthorizedSource,
} from 'react-native-rook-sdk';
import { Button, Field, Row, Section, colors } from '../components/ui';
import { loadUserID, saveUserID } from '../storage';

type LogEntry = { id: number; time: string; text: string; isError?: boolean };

const ANDROID_SOURCES = [
  SDKDataSource.HEALTH_CONNECT,
  SDKDataSource.SAMSUNG_HEALTH,
];

export function LinkingScreen({
  onResetCredentials,
}: {
  onResetCredentials: () => void;
}) {
  const configuration = useRookConfiguration();
  const permissions = useRookPermissions();
  const healthConnect = useRookHealthConnect();
  const samsung = useRookSamsungHealth();
  const { sync } = useRookSync();
  const apiSources = useRookAPISources();

  const [userID, setUserID] = React.useState('');
  const [linkedUserID, setLinkedUserID] = React.useState('');
  const [authorizedSources, setAuthorizedSources] = React.useState<
    AuthorizedSource[]
  >([]);
  const [log, setLog] = React.useState<LogEntry[]>([]);

  const ready = configuration.ready;

  const addLog = React.useCallback((text: string, isError = false) => {
    setLog(prev =>
      [
        {
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString(),
          text,
          isError,
        },
        ...prev,
      ].slice(0, 100),
    );
  }, []);

  // Wraps an SDK call so every result or error lands in the on-screen log.
  const run = React.useCallback(
    async <T,>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
      try {
        const result = await fn();
        addLog(`${label} → ${JSON.stringify(result) ?? 'done'}`);
        return result;
      } catch (error) {
        addLog(`${label} ✗ ${String(error)}`, true);
        return undefined;
      }
    },
    [addLog],
  );

  // Permission prompts resolve when the dialog is shown, not when the user
  // answers; the real outcome arrives through onRookMessage.
  React.useEffect(() => {
    const subscription = RookSdk.onRookMessage(({ type, value, message }) => {
      addLog(`event ${type} = ${value}${message ? ` (${message})` : ''}`);
    });
    return () => subscription.remove();
  }, [addLog]);

  React.useEffect(() => {
    loadUserID().then(stored => {
      setUserID(stored);
      setLinkedUserID(stored);
    });
  }, []);

  const linkUser = async () => {
    const id = userID.trim();
    const ok = await run(`updateUserID("${id}")`, () =>
      configuration.updateUserID(id),
    );
    if (ok) {
      await saveUserID(id);
      setLinkedUserID(id);
    }
  };

  const refreshAPISources = async () => {
    const sources = await run('getAuthorizedDataSourcesV2', () =>
      apiSources.getAuthorizedDataSourcesV2(linkedUserID),
    );
    if (sources) {
      setAuthorizedSources(sources);
    }
  };

  const connectAPISource = async (dataSource: APIDataSource) => {
    const authorizer = await run(`getDataSourceAuthorizer(${dataSource})`, () =>
      apiSources.getDataSourceAuthorizer({ userID: linkedUserID, dataSource }),
    );
    if (authorizer?.authorizationUrl) {
      // Providers block OAuth inside WebViews, so open the system browser.
      await Linking.openURL(authorizer.authorizationUrl);
    } else if (authorizer?.authorized) {
      addLog(`${dataSource} is already authorized`);
    }
  };

  const hasUser = ready && linkedUserID.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ROOK SDK Link Tester</Text>
        <Text style={[styles.status, ready ? styles.ok : styles.pending]}>
          {ready ? 'SDK ready (sandbox)' : 'Initializing SDK…'}
        </Text>
      </View>

      <Section
        step={1}
        title="Link a user"
        description="Set the user_id (1–50 chars) ROOK will deliver data under. Changing it resets the sync state."
      >
        <Field
          label="user_id"
          value={userID}
          onChangeText={setUserID}
          placeholder="test-user-001"
          maxLength={50}
        />
        <Row>
          <Button
            title="updateUserID"
            disabled={!ready || userID.trim().length === 0}
            onPress={linkUser}
          />
          <Button
            title="getUserID"
            variant="secondary"
            disabled={!ready}
            onPress={() => run('getUserID', configuration.getUserID)}
          />
          <Button
            title="syncUserTimeZone"
            variant="secondary"
            disabled={!hasUser}
            onPress={() =>
              run('syncUserTimeZone', configuration.syncUserTimeZone)
            }
          />
        </Row>
      </Section>

      <Section
        step={2}
        title="Health Connect"
        description="Requires the Health Connect app on the device (built in on Android 14+)."
      >
        <Row>
          <Button
            title="Check availability"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run(
                'checkHealthConnectAvailability',
                permissions.checkHealthConnectAvailability,
              )
            }
          />
          <Button
            title="Request permissions"
            disabled={!hasUser}
            onPress={() =>
              run(
                'requestHealthConnectPermissions',
                permissions.requestHealthConnectPermissions,
              )
            }
          />
          <Button
            title="Has permissions?"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run(
                'healthConnectHasPermissions',
                permissions.healthConnectHasPermissions,
              )
            }
          />
          <Button
            title="Background read status"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run(
                'checkHealthConnectBackgroundReadStatus',
                permissions.checkHealthConnectBackgroundReadStatus,
              )
            }
          />
          <Button
            title="History read status"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run('checkHistoryReadStatus', permissions.checkHistoryReadStatus)
            }
          />
          <Button
            title="Open settings"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run(
                'openHealthConnectSettings',
                permissions.openHealthConnectSettings,
              )
            }
          />
        </Row>
        <Row>
          <Button
            title="Schedule background sync"
            disabled={!hasUser}
            onPress={() =>
              run(
                'scheduleBackgroundSync',
                healthConnect.scheduleBackgroundSync,
              )
            }
          />
          <Button
            title="Cancel"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run('cancelBackgroundSync', healthConnect.cancelBackgroundSync)
            }
          />
          <Button
            title="Enabled?"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run(
                'isBackgroundSyncEnabled',
                healthConnect.isBackgroundSyncEnabled,
              )
            }
          />
        </Row>
      </Section>

      <Section
        step={3}
        title="Samsung Health"
        description="Needs the Samsung Health Data SDK .aar in android/libs and Samsung Health developer mode on the phone."
      >
        <Row>
          <Button
            title="Check availability"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run(
                'checkSamsungAvailability',
                permissions.checkSamsungAvailability,
              )
            }
          />
          <Button
            title="Request permissions"
            disabled={!hasUser}
            onPress={() =>
              run(
                'requestSamsungHealthPermissions',
                permissions.requestSamsungHealthPermissions,
              )
            }
          />
          <Button
            title="Has permissions?"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run(
                'samsungHealthHasPermissions',
                permissions.samsungHealthHasPermissions,
              )
            }
          />
        </Row>
        <Row>
          <Button
            title="Enable sync"
            disabled={!hasUser}
            onPress={() => run('enableSamsungSync', samsung.enableSamsungSync)}
          />
          <Button
            title="Disable"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run('disableSamsungSync', samsung.disableSamsungSync)
            }
          />
          <Button
            title="Enabled?"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run('isSamsungSyncEnabled', samsung.isSamsungSyncEnabled)
            }
          />
        </Row>
      </Section>

      <Section
        step={4}
        title="Sync and diagnose"
        description="Manual sync uploads the last 29 days. Health Connect has a daily read quota, so avoid repeating it many times."
      >
        <Row>
          <Button
            title="Sync now"
            disabled={!hasUser}
            onPress={() =>
              new Promise<void>(resolve => {
                addLog('sync() started');
                sync(result => {
                  addLog(`sync() → ${JSON.stringify(result)}`);
                  resolve();
                });
              })
            }
          />
          <Button
            title="Diagnose Health Connect"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run('getDiagnosticState(HEALTH_CONNECT)', () =>
                configuration.getDiagnosticState(SDKDataSource.HEALTH_CONNECT),
              )
            }
          />
          <Button
            title="Diagnose Samsung"
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              run('getDiagnosticState(SAMSUNG_HEALTH)', () =>
                configuration.getDiagnosticState(SDKDataSource.SAMSUNG_HEALTH),
              )
            }
          />
        </Row>
      </Section>

      <Section
        step={5}
        title="API data sources"
        description="Opens the provider's login in the browser. Return to the app and refresh to see the new status."
      >
        <Button
          title="Refresh authorized sources"
          variant="secondary"
          disabled={!hasUser}
          onPress={refreshAPISources}
        />
        {Object.values(APIDataSource).map(dataSource => {
          const status = authorizedSources.find(
            source => source.name.toLowerCase() === dataSource.toLowerCase(),
          );
          return (
            <View key={dataSource} style={styles.sourceRow}>
              <Text style={styles.sourceName}>
                {dataSource}
                {status
                  ? status.authorized
                    ? '  ✓ linked'
                    : '  not linked'
                  : ''}
              </Text>
              <Row>
                <Button
                  title="Connect"
                  disabled={!hasUser}
                  onPress={() => connectAPISource(dataSource)}
                />
                <Button
                  title="Revoke"
                  variant="secondary"
                  disabled={!hasUser}
                  onPress={() =>
                    run(`revokeDataSource(${dataSource})`, () =>
                      apiSources.revokeDataSource(linkedUserID, dataSource),
                    )
                  }
                />
              </Row>
            </View>
          );
        })}
      </Section>

      <Section step={6} title="Unlink">
        <Row>
          <Button
            title="removeUserFromRook"
            variant="danger"
            disabled={!hasUser}
            onPress={() =>
              run('removeUserFromRook', () =>
                configuration.removeUserFromRook(ANDROID_SOURCES),
              )
            }
          />
          <Button
            title="Change credentials"
            variant="secondary"
            onPress={onResetCredentials}
          />
        </Row>
      </Section>

      <Section title="Log">
        <Button title="Clear" variant="secondary" onPress={() => setLog([])} />
        {log.length === 0 ? (
          <Text style={styles.logEmpty}>
            SDK results and events appear here.
          </Text>
        ) : (
          log.map(entry => (
            <Text
              key={entry.id}
              style={[styles.logLine, entry.isError && styles.logError]}
            >
              {entry.time} {entry.text}
            </Text>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  status: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  ok: { color: '#2E7D32' },
  pending: { color: colors.muted },
  sourceRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
    gap: 6,
  },
  sourceName: { fontSize: 15, color: colors.text, fontWeight: '500' },
  logEmpty: { color: colors.muted, fontSize: 13 },
  logLine: { fontFamily: 'monospace', fontSize: 11, color: colors.text },
  logError: { color: colors.danger },
});
