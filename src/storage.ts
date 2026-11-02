import AsyncStorage from '@react-native-async-storage/async-storage';

// ROOK asks not to ship client_uuid/secret in source or .env files (they end up
// in the JS bundle), so this test app asks for sandbox credentials at runtime
// and keeps them only on the device.
export type RookCredentials = {
  clientUUID: string;
  secret: string;
};

const CREDENTIALS_KEY = 'rook.credentials';
const USER_ID_KEY = 'rook.userID';

export async function loadCredentials(): Promise<RookCredentials | null> {
  const raw = await AsyncStorage.getItem(CREDENTIALS_KEY);
  return raw ? (JSON.parse(raw) as RookCredentials) : null;
}

export async function saveCredentials(credentials: RookCredentials) {
  await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export async function clearCredentials() {
  await AsyncStorage.removeMany([CREDENTIALS_KEY, USER_ID_KEY]);
}

export async function loadUserID(): Promise<string> {
  return (await AsyncStorage.getItem(USER_ID_KEY)) ?? '';
}

export async function saveUserID(userID: string) {
  await AsyncStorage.setItem(USER_ID_KEY, userID);
}
