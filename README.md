# SDKLINK-APP

A small React Native (Android) app for testing the **ROOK SDK linking flow** described in the
[ROOK React Native docs](https://docs.tryrook.io/docs/category/react-native/). Each linking step has
its own button, and every SDK result and event is shown in an on-screen log.

| | |
|---|---|
| React Native | 0.83.10 (New Architecture) |
| ROOK SDK | `react-native-rook-sdk@5.2.0` (5.x TurboModule track) |
| Platform | Android only (minSdk 29, target 36) |
| ROOK environment | `sandbox` |

## What the app tests

1. **Link a user**: `updateUserID`, `getUserID`, `syncUserTimeZone`
2. **Health Connect**: availability, permission request and status, background sync on/off
3. **Samsung Health**: availability, permissions, sync on/off
4. **Sync and diagnose**: manual `sync()` and `getDiagnosticState`
5. **API data sources** (Garmin, Oura, Polar, Fitbit, Withings, Whoop): `getDataSourceAuthorizer`
   opens the provider login in the browser; `getAuthorizedDataSourcesV2`; `revokeDataSource`
6. **Unlink**: `removeUserFromRook`

Permission requests resolve once the dialog is **shown**, not when the user answers. The actual
outcome shows up as an `event …` line in the log (from `RookSdk.onRookMessage`).

## Credentials

On first launch the app asks for a **sandbox** client UUID and secret key from the ROOK Portal.
Following ROOK's guidance, they are not stored in source or `.env` files. The app keeps them only on
the device (AsyncStorage). Use sandbox credentials only.

## One-time machine setup (Windows)

Node.js 22, Microsoft OpenJDK 17 and Android Studio are already installed. To finish setup:

1. Open **Android Studio** once and complete the setup wizard. It installs the Android SDK, which
   needs Android SDK Platform 36 and Build-Tools 36.0.0.
2. Set the environment variables (PowerShell). Afterwards, open a new terminal:

   ```powershell
   setx JAVA_HOME "C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot"
   setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
   ```

   Then add `%ANDROID_HOME%\platform-tools` to your user `Path`.
3. On your Android phone, turn on **Developer options → USB debugging** and connect it over USB.
   Running `adb devices` should list the phone.

Use a **real phone**. Health Connect and Samsung Health don't work properly on emulators.

## Run it

```bash
npm install
```

```bash
npm run android
```

Metro (the JS bundler) starts automatically. You can also start it yourself with `npm start`.

## Samsung Health (optional)

1. Download `samsung-health-data-api-1.1.0.aar` from Samsung (linked on ROOK's
   [Getting Started](https://docs.tryrook.io/docs/rookconnect/sdk/reactnative/fundamentals/gettingstarted/)
   page) and place it in `android/libs/`. The build picks it up automatically, and the file is
   git-ignored.
2. In the Samsung Health app on the phone, turn on developer mode.

## Checks

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

```bash
npm test
```

## Project layout

- `App.tsx`: loads the credentials and wraps the app in `RookSyncGate`
- `src/screens/CredentialsScreen.tsx`: screen for entering sandbox credentials
- `src/screens/LinkingScreen.tsx`: the step-by-step linking test screen
- `src/components/ui.tsx`: small UI building blocks
- `src/storage.ts`: on-device storage for the credentials and user_id
- `android/`: native project, with the Health Connect manifest entries, minSdk 29 and R8 full mode off
