# Releasing

## Version numbers

The version lives in three places, and the test suite fails if they disagree:

- `package.json` → `version`
- `www/js/core.js` → `QT.VERSION`
- `www/sw.js` → `VERSION` (`qt-<version>`). Changing it also makes returning website visitors fetch fresh files.

## Website

Every push to `main` runs the tests and redeploys GitHub Pages ([`deploy.yml`](../.github/workflows/deploy.yml)).

## Android: debug APK (no setup)

Push a tag, and the [`android.yml`](../.github/workflows/android.yml) workflow attaches an installable APK to a GitHub release:

```bash
git tag -a v0.8.0 -m "v0.8.0" && git push origin v0.8.0
```

The Android `versionName` comes from `package.json`, and `versionCode` from the workflow run number, so it always increases.

## Android: Google Play (one-time setup)

Google Play needs a **signed release bundle** (`.aab`). The workflow builds one automatically once these four repository secrets exist (**Settings → Secrets and variables → Actions**):

| Secret | What it is |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | your upload keystore, base64-encoded |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias (e.g. `upload`) |
| `ANDROID_KEY_PASSWORD` | key password |

1. **Create an upload key** (needs a JDK; Android Studio ships one). **Keep the file and passwords safe and private.** If you lose them you need Google's help to reset the key.
   ```bash
   keytool -genkeypair -v -keystore upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Encode it:** on macOS/Linux `base64 -w0 upload.keystore`; on Windows PowerShell `[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload.keystore"))`. Paste the output into `ANDROID_KEYSTORE_BASE64`.
3. **Pick a permanent app ID.** Change `appId` in [`capacitor.config.json`](../capacitor.config.json) from `dev.quanttrainer.app` to a reverse domain you control. It can't be changed after the first Play release.
4. **Play Console** ([play.google.com/console](https://play.google.com/console), one-off $25 registration):
   - create the app;
   - use the privacy policy at `https://pingadom.github.io/quant-trainer/privacy.html`;
   - complete the content rating and data-safety forms (no data is collected or shared);
   - upload the `.aab` from the release to an internal testing track first.
5. **Store assets:** the 512×512 icon is `www/icons/icon-512.png`, and the 1024×500 feature graphic can be cropped from `www/icons/og-image.png`.

## iOS

Requires a Mac with Xcode and an Apple Developer account. Run `npx cap add ios`, then `npm run ios`.
