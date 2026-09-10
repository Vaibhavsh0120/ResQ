# CI build workflow — what it actually produces

`build-release.yml` builds and publishes two artifacts on demand
(`workflow_dispatch`): an Android APK and an iOS IPA. It works, and is
the right tool for getting a build onto a real device to test something
(e.g. this project's local-notifications or SOS features) — that's what
it's for today, and there's no reason to change it for that purpose.

**What it is:** both builds are genuinely unsigned.
- Android: `./gradlew assembleDebug` — a debug-signed APK (Android's
  default auto-generated debug keystore, not a real release key).
- iOS: `xcodebuild ... CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO
  archive` — no code signing at all.

**What that means in practice:**
- Neither artifact can be submitted to the Play Store or the App Store —
  both stores require a signed release build (Android: a real upload
  key; iOS: a distribution certificate + provisioning profile from an
  Apple Developer Program membership).
- The Android APK can still be sideloaded onto a real device for
  testing (with "install from unknown sources" allowed) — this is
  exactly the debug-APK-only limitation PROGRESS.md's Phase 0/2 notes
  flag, and sideloading is still genuinely useful for that.
- The iOS IPA **cannot** be installed on a real iPhone/iPad this way at
  all — iOS refuses to run any unsigned binary on real hardware,
  regardless of sideloading settings. This unsigned IPA is only useful
  for confirming the Xcode archive step itself succeeds (e.g. in CI, as
  a build-health check), or for installing on the iOS **Simulator**
  (which doesn't enforce code signing) — not for on-device testing.

**When to revisit this:** the day either of these is actually needed —
handing a real signed build to a tester's iPhone, or preparing an actual
store submission.

## `build-release-signed.yml` — the signed workflow, ready to activate

This second workflow (added 2026-09-10) builds real, store-submittable
binaries: a signed Android App Bundle (`.aab`, what Play Console
actually wants for upload) and a signed, installable iOS IPA. It's
**inert until real credentials are added** — chose native signing in
this same repo (GitHub Actions secrets) over EAS Build's managed
credentials, since this project has no other Expo/EAS account
dependency yet and native signing keeps everything inspectable in one
place. EAS Build remains a reasonable alternative if that changes.

It does **not** fabricate or guess at any credential — every secret it
reads must already exist in **Settings → Secrets and variables →
Actions** before it will attempt a build. A dedicated `check-secrets`
job runs first and fails immediately with the exact names of whatever's
missing, rather than letting the build fail confusingly partway through
signing. Android and iOS are gated independently, so having only one
platform's credentials still produces a real release for that platform.

**Secrets it needs, and how to get each one** (none of these can be
generated from a coding session — they require real developer-account
access):

*Android* (an upload keystore — this app has none yet, since every
build so far has used Android's auto-generated debug key):
- `ANDROID_KEYSTORE_BASE64` — `keytool -genkeypair -v -keystore
  upload-keystore.jks -alias resq-upload -keyalg RSA -keysize 2048
  -validity 10000`, then base64-encode the file
  (`base64 -w0 upload-keystore.jks` on Linux, `base64 -i
  upload-keystore.jks` on macOS) and paste the output as the secret.
  **Back this keystore up somewhere durable outside GitHub** — if it's
  lost, Play Console cannot rotate it without Google's separate
  key-loss recovery process.
- `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
  `ANDROID_KEY_PASSWORD` — set when generating the keystore above.

*iOS* (requires an active Apple Developer Program membership, which is
a paid, human decision — not provisioned here):
- `IOS_DIST_CERT_BASE64` / `IOS_DIST_CERT_PASSWORD` — a Distribution
  certificate exported as a `.p12` from Xcode or the Apple Developer
  portal, base64-encoded the same way as the keystore above.
- `IOS_PROVISIONING_PROFILE_BASE64` — an App Store distribution
  provisioning profile for `com.resq.app` (matches `app.json`'s
  `ios.bundleIdentifier`), base64-encoded.
- `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_BASE64` — an App Store Connect
  API key (Users and Access → Integrations → App Store Connect API in
  App Store Connect), so the workflow can build against real App Store
  Connect credentials without an interactive Apple ID sign-in. Not yet
  wired to an actual TestFlight/App Store upload step — the workflow
  stops at producing the signed IPA artifact; uploading it is a
  deliberate separate step for whoever owns the App Store Connect
  listing.

**What it deliberately still doesn't do:** publish to either store.
Both jobs stop at a signed, downloadable artifact (`.aab` / `.ipa`)
attached to a GitHub Release — actual Play Console / App Store Connect
submission is a distinct, human-owned step (first submissions
especially need real store-listing metadata, screenshots, and content
ratings that don't belong in a CI workflow).

Once real credentials exist, run it the same way as the existing
workflow — Actions tab → "Build Mobile Release (Signed)" →
"Run workflow". See PROGRESS.md's Phase 2 entry for the corresponding
checklist line.
