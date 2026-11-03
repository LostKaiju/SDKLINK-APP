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

Any failed call also raises a floating red banner at the bottom of the screen, with a **View log**
button, so errors aren't missed while the log is scrolled out of view.

### user_id format

Use **letters and numbers only**, 1–50 characters (for example `sdklinktest001`). Measured on
2026-11-02 against sandbox: the SDK's `POST /api/v1/create-user` returned `422 "The user_id is
invalid"` for `sdklink_test_001` and `sdklink-test-001`, and `201` for `sdklinktest001`. The
public API reference allows hyphens (`^[a-zA-Z0-9\-]{1,50}$`), but this endpoint doesn't. In the
app, the failure surfaces as `HCUserNotInitializedException`.

## Credentials

On first launch the app asks for a **sandbox** client UUID and **Secret Word**.

Before that, set up the SDK in the ROOK Portal (sandbox): go to **Set up → SDK Authentication**,
click **Configure credentials**, and:

1. Set **Package Name (Android)** to `com.sdklinkapp`.
2. Create a **Secret Word** and keep a copy. The Portal shows it only once.

The Secret Word is **not** the API secret key from the Credentials page. If the package name is
missing or you enter the API secret key, the SDK fails to start with `HCNotAuthorizedException`
("Requested operation needs an authorization level that your clientUUID doesn't have").

Following ROOK's guidance, these values are not stored in source or `.env` files. The app keeps them
only on the device (AsyncStorage). Use sandbox credentials only.

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

## Samsung Health Data SDK (required)

The app needs `samsung-health-data-api-1.1.0.aar` even on phones without Samsung Health.
ROOK's SDK checks Samsung Health availability during startup. Without this file, startup fails
with `NoClassDefFoundError` (`com/samsung/android/sdk/health/data/permission/Permission`).

1. Download `samsung-health-data-api-1.1.0.aar` from the link on ROOK's
   [Getting Started](https://docs.tryrook.io/docs/rookconnect/sdk/reactnative/fundamentals/gettingstarted/)
   page.
2. Place it in `android/libs/`. The file is git-ignored, and the build stops with an error if
   it's missing.

To test Samsung Health on a Samsung phone, also turn on developer mode in the Samsung Health app.

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
