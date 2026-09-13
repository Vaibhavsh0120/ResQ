import React from 'react';
import { LegalDocument } from '@/components/LegalDocument';

// ── Real content, not boilerplate ──────────────────────────────────────
// This describes what ResQ *actually* does today — a local-only app with
// no backend (see AGENT.md's working assumptions). Every claim below
// was checked against the real storage keys and permission strings in
// this codebase (src/services/*.ts's AsyncStorage keys, app.json's
// expo-location/expo-image-picker/expo-notifications plugin config)
// rather than written as generic boilerplate — this file needs a real
// edit, not just a "last updated" bump, the day a backend (Phase 3) or a
// new data-collecting feature ships, since at that point some of these
// claims (e.g. "nothing leaves this device") stop being true.
//
// Section 4 ("How your data is protected on-device") added 2026-09-10,
// checked against the real implementation in src/services/secureStorage.ts
// and docs/data-safety.md — keep these three in sync if that module's
// design changes (which data domains are encrypted, native-only vs. web
// fallback, what account deletion destroys).
//
// This is app copy, not a legal instrument — before a real public launch,
// this should be reviewed by counsel familiar with India's DPDP Act 2023
// (this app's first launch market — see AGENT.md) and any other
// jurisdiction it ships into, and the reviewed text should also be hosted
// at a public URL (Play Store's Data Safety section requires a live link,
// not just in-app text — see AGENT.md notes).
const LAST_UPDATED = 'September 10, 2026';

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      eyebrow="YOUR DATA, IN PLAIN LANGUAGE"
      lastUpdated={LAST_UPDATED}
      intro="ResQ is built to work entirely on your device, without a server, while it's in this stage of development. This page explains exactly what that means for your data — what's collected, where it's stored, and who (if anyone) can see it."
      sections={[
        {
          heading: '1. There is currently no ResQ server',
          body: [
            'ResQ does not yet have a backend. Every piece of information you enter — your profile, medical details, family circle, incident reports, chat history, and SOS activation log — is written only to storage on your own device (technically, your device\'s AsyncStorage, the same mechanism apps use to remember settings). None of it is transmitted to Anthropic, to ResQ\'s developers, or to any third party, because there is nowhere for it to be sent yet.',
            'If you use the "Ask ResQ" chat assistant or view live updates or nearby safe places, this version of the app answers using preloaded sample content on your device, not a live lookup — so those features don\'t send your questions or location anywhere either.',
          ],
        },
        {
          heading: '2. What we ask you for, and why',
          body: [
            'Account details (name, email): used to personalize the app and let you sign back in. Password: stored only long enough to check it matches on sign-in in this version of the app — there is no real account-recovery system yet beyond the locally-simulated "forgot password" flow.',
            'Date of birth: collected at registration solely to confirm you meet ResQ\'s minimum age of 18, and again during onboarding as part of your profile. See "Minimum age" below.',
            'Profile details (phone, home area, blood type, emergency note): shown back to you in your Profile, and — for blood type and medical details below — intended to be shown to first responders during an emergency. Encrypted on your device before being stored — see "How your data is protected on-device" below.',
            'Medical information (allergies, conditions, mobility/vision/hearing needs): entered during onboarding specifically so it can be surfaced quickly in an emergency (your Profile\'s "Medical ID" card). This is sensitive health information — it stays on-device like everything else, is encrypted before being stored (see below), and only appears where you\'d expect it to (your own Profile screen).',
            'Family circle (names, relationships, phone numbers, and — if you choose to share it — a last-known-location note): used to power Call/Message/Locate actions and SOS. Locate opens a Maps search using whatever location text is on file; ResQ does not track anyone\'s live position. Encrypted on your device before being stored, same as your profile and medical information.',
            'Incident reports (hazard type, location, description, and an optional photo): stored locally and marked "reported," not "verified" — they inform the guidance shown back to you, and are not shared with your family circle automatically.',
            'Device location: requested only when a screen actually needs it (Safe places, Report, SOS) to show or send your real position. You can decline the OS permission prompt; screens fall back to your saved home area instead.',
            'Camera/photo library access: requested only when you choose to attach a photo to an incident report.',
            'Notifications: local, on-device reminders only (e.g. an optional family check-in reminder) — not push notifications from a server, since there is no server to send them.',
          ],
        },
        {
          heading: '3. Who can see your data',
          body: [
            'Only you, on your own device. Nothing here is visible to other ResQ users, including people in your family circle, unless you directly share it with them yourself (for example, by calling or messaging them through the app, which opens your device\'s own Phone/Messages app).',
            'The two in-app toggles on the Privacy & security screen ("Share live location," "Visible to my circle") describe how sharing will work once a real backend and live family-circle syncing exist. Today, turning them on or off does not transmit anything anywhere, for the same reason nothing else does — there is no server yet to receive it.',
          ],
        },
        {
          heading: '4. How your data is protected on-device',
          body: [
            'Your profile, medical information, and family circle are encrypted (AES-256) before being written to storage, using a random encryption key held in your device\'s own secure hardware storage (the iOS Keychain or Android\'s equivalent) — the same protected storage banking and password-manager apps use, not a key ResQ can read or export. This means that even if someone inspected your device\'s raw app storage directly, this data would appear as unreadable, scrambled text rather than your actual profile or medical details.',
            'Deleting your account (see "Your controls" below) also permanently destroys this encryption key, not just the encrypted data — so nothing left behind afterward, even a stale device backup, could ever be decrypted again.',
            'This on-device encryption is in addition to your device\'s own operating-system protections, not a replacement for them — it protects against someone inspecting the app\'s stored files directly. It does not protect data on an unlocked, already-accessed device, and it is currently only active on Android and iOS; the web version of ResQ does not yet have an equivalent, since browsers have no comparable secure hardware storage to hold the key in.',
          ],
        },
        {
          heading: '5. Your controls',
          body: [
            'Download my data: from Profile → Privacy & security, you can export everything ResQ has stored about you as a file, which opens your device\'s share sheet so you can save it, send it to yourself, or move it elsewhere. This export is decrypted for you automatically — you get your actual readable data, not the encrypted form it\'s stored in.',
            'Delete my account: from the same screen, this permanently erases everything ResQ has stored on this device — profile, medical info, family circle, reports, SOS history, and settings — and signs you out. This cannot be undone. Because there is no server yet, this is a real, complete deletion, not a request queued for later processing.',
          ],
        },
        {
          heading: '6. Minimum age',
          body: [
            'You must be 18 or older to create a ResQ account. We ask for your date of birth at registration to check this. India\'s Digital Personal Data Protection Act, 2023 requires verifiable parental or guardian consent before processing a child\'s personal data — ResQ has no way to verify a parent\'s identity or consent yet, so rather than build a consent flow it can\'t actually stand behind, ResQ currently requires every account holder to meet the adult age threshold themselves.',
            'ResQ\'s "Emergency App Access" guest mode exists so that core safety features (like SOS) can be used without creating an account at all, for exactly this kind of situation — it is not a way around the age requirement, and no personal profile is created for a guest session.',
          ],
        },
        {
          heading: '7. What changes once a backend exists',
          body: [
            'ResQ\'s architecture (see its own README) is deliberately built so that a real backend can be added one feature at a time without changing how any screen works — but the moment that happens, the promises in section 1 above stop applying to whichever feature switched over. This policy will be updated, with a new "Last updated" date, before or at the same time any feature starts sending data off-device, and the update will say plainly which feature changed and what is now transmitted.',
          ],
        },
        {
          heading: '8. Contact',
          body: [
            'This build of ResQ does not yet have a live support inbox or a hosted version of this policy. Both are tracked as an open item for this app\'s next compliance pass — see this project\'s AGENT.md if you\'re a contributor looking for the current status.',
          ],
        },
      ]}
    />
  );
}
