import React from 'react';
import { LegalDocument } from '@/components/LegalDocument';

// See privacy-policy.tsx's header comment — same standard applies here:
// this describes what the app actually does today, needs a real edit
// (not just a date bump) whenever that changes, and should be reviewed
// by counsel before a public launch, especially given this is a
// safety-critical app where overstating what it can do is itself a real
// risk (see section 3 below).
const LAST_UPDATED = 'September 10, 2026';

export default function Terms() {
  return (
    <LegalDocument
      title="Terms of Service"
      eyebrow="WHAT TO EXPECT FROM RESQ"
      lastUpdated={LAST_UPDATED}
      intro="These terms explain what ResQ is, what it isn't, and what you're agreeing to by creating an account or using guest access."
      sections={[
        {
          heading: '1. What ResQ is',
          body: [
            'ResQ is a personal disaster-safety app: an emergency SOS shortcut, a place to keep medical information and a family circle for quick access, disaster-preparedness guidance, and incident reporting. This version of the app runs entirely on your device — see the Privacy Policy for what that means for your data.',
          ],
        },
        {
          heading: '2. Minimum age',
          body: [
            'You must be 18 or older to register for a ResQ account. By registering, you confirm that the date of birth you provide is accurate. See the Privacy Policy\'s "Minimum age" section for why.',
          ],
        },
        {
          heading: '3. ResQ is not emergency dispatch, and does not replace it',
          body: [
            'This is the single most important thing to understand about ResQ. The SOS feature opens your phone\'s own dialer to call your local emergency number and opens your phone\'s own messaging app to notify contacts — it does not place the call or send the message for you, and it does not itself contact police, fire, medical services, or any dispatch center. You must complete the call yourself, exactly as the SOS screen tells you.',
            'ResQ has no way to guarantee a message was delivered, that a family member saw it, or that help is on its way. Nothing in this app should be relied on as a substitute for calling your local emergency number directly, and nothing in this app can promise a response time, an outcome, or that any contacted person will actually respond.',
            'Guidance and chat-assistant content in this app is general safety information, not professional emergency, medical, or legal advice, and is not a substitute for instructions from local authorities or emergency responders during an actual disaster.',
          ],
        },
        {
          heading: '4. Incident reports aren\'t verified',
          body: [
            'Reports you submit through ResQ are marked "reported," not "verified." They are not reviewed by emergency services or fact-checked before being shown back to you or (in a future version, once a backend exists) to others — don\'t rely on an unverified report, yours or anyone else\'s, as confirmed information about an actual hazard.',
          ],
        },
        {
          heading: '5. Accounts and guest access',
          body: [
            'Account credentials in this version of the app are not validated against a real identity system — there is no backend yet to do that (see the Privacy Policy). Don\'t rely on account-based features as a secure identity or access-control mechanism until that changes.',
            '"Emergency App Access" (guest mode) gives access to core safety features without creating an account. Guest sessions are not linked to any profile, and any data created during a guest session lives only on that device for that session, subject to the same on-device storage described in the Privacy Policy.',
          ],
        },
        {
          heading: '6. Your responsibilities',
          body: [
            'Keep the medical information, emergency contacts, and family circle details in ResQ current — the app can only surface what you\'ve entered. Don\'t enter anyone else\'s personal information (including a family member\'s phone number) without their knowledge that you\'re doing so, since ResQ will use it to place real calls and messages on your behalf.',
          ],
        },
        {
          heading: '7. No warranty, limitation of liability',
          body: [
            'ResQ is provided "as is," without warranty of any kind, express or implied, including — without limitation — any warranty that it will be available, uninterrupted, error-free, or fit for a particular purpose. Given ResQ\'s current no-backend, single-device architecture, features can behave differently across devices and OS versions, and local storage can be lost if you clear app data, switch devices, or delete the app.',
            'To the fullest extent permitted by law, ResQ\'s developers are not liable for any injury, loss, or damage arising from reliance on this app during an actual emergency, disaster, or medical situation, or from the loss of any locally-stored data.',
          ],
        },
        {
          heading: '8. Changes to these terms',
          body: [
            'These terms will be updated, with a new "Last updated" date, as ResQ\'s real capabilities change — most significantly once a backend exists and some of the "on this device only" language above no longer applies to every feature.',
          ],
        },
      ]}
    />
  );
}
