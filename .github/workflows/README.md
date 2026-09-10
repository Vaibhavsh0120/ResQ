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
store submission. At that point this becomes a real decision, not a
checklist item to guess at now:
- Whether to add EAS Build (`eas.json` + Expo's managed credentials) or
  sign natively in this same workflow (Android: a real upload keystore
  as a GitHub secret; iOS: a distribution certificate/provisioning
  profile, also as secrets — either needs an Apple Developer Program
  membership, which is a paid, human decision, not something to
  provision from a coding session).
- Whichever path is chosen, it should be a **second**, separate
  workflow/job (e.g. `build-release-signed.yml` or an added job here)
  rather than replacing this one — the fast, credential-free unsigned
  build is still the right default for day-to-day device testing.

Not started in this pass since there's no Apple/Google signing identity
to wire up yet — flagged here instead so the tradeoffs are already known
once someone actually has credentials to add. See PROGRESS.md's Phase 2
entry for the corresponding checklist line.
