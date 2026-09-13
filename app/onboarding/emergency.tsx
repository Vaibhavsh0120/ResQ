import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { OnboardingLayout } from '@/components/OnboardingLayout';
import { useAuth } from '@/context/AuthContext';
import { Check, Phone, Plus, ShieldCheck, Users, X } from '@/components/icons';
import {
  clearOnboardingDraft,
  getOnboardingEmergencyDraft,
  getOnboardingFamilyDraft,
  mergeOnboardingContacts,
  saveOnboardingEmergencyDraft,
} from '@/services/onboardingService';
import { seedFamilyMembers } from '@/services/familyService';

type Contact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
};

export default function EmergencyStep() {
  const { colors } = useAppTheme();
  const { completeOnboarding } = useAuth();

  // Starts empty — this used to pre-seed two fake contacts ("Maya Chen",
  // "David Chen"), which along with family.tsx's own fake seed meant two
  // separate lists both claimed the same made-up person (see AGENT.md
  // §4.3). A real draft, loaded below, pre-fills this now instead.
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Emergency Contact');
  const [phone, setPhone] = useState('');
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    getOnboardingEmergencyDraft().then((saved) => {
      if (saved) setContacts(saved);
    });
  }, []);

  const togglePrimary = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPrimary: !c.isPrimary } : c))
    );
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const addContact = () => {
    if (!name.trim() || !phone.trim()) return;
    setContacts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: name.trim(),
        relation: relation.trim() || 'Contact',
        phone: phone.trim(),
        isPrimary: true,
      },
    ]);
    setName('');
    setPhone('');
    setShowAddForm(false);
  };

  const handleFinish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      await saveOnboardingEmergencyDraft(contacts);
      // Merge this step's contacts with whatever family.tsx's step
      // collected (a person mentioned in both isn't duplicated — see
      // onboardingService.mergeOnboardingContacts) and write the result
      // into the real family circle that useFamily()/SOS actually reads,
      // in one shot, now that onboarding is actually finishing.
      const familyDraft = await getOnboardingFamilyDraft();
      const merged = mergeOnboardingContacts(familyDraft ?? [], contacts);
      if (merged.length > 0) {
        await seedFamilyMembers(merged);
      }
      // The per-step drafts (personal/medical/location/family/emergency)
      // have now all been folded into the real profile + family-circle
      // stores — clear them so a later re-run of onboarding (e.g. after
      // logout/login) starts from a clean slate instead of an old draft.
      await clearOnboardingDraft();
      await completeOnboarding();
      router.replace('/(tabs)');
    } finally {
      setFinishing(false);
    }
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      title="Emergency contacts"
      subtitle="Designate contacts who will be immediately alerted with your live location when you initiate an SOS."
      continueLabel="Complete Setup"
      onContinue={handleFinish}
      onSkip={handleFinish}
    >
      {/* Contact Cards */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Selected emergency contacts ({contacts.length})
        </Text>

        {contacts.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.line }]}>
            <Users size={28} color={colors.inkFaint} />
            <Text style={[styles.emptyText, { color: colors.inkMuted }]}>
              No emergency contacts yet. Add one below, or skip — {'\n'}
              112 will still be called directly during an SOS either way.
            </Text>
          </View>
        )}

        {contacts.map((contact) => (
          <Pressable
            key={contact.id}
            onPress={() => togglePrimary(contact.id)}
            style={[
              styles.contactCard,
              {
                backgroundColor: contact.isPrimary ? colors.brandSoft : colors.surface,
                borderColor: contact.isPrimary ? colors.brand : colors.line,
              },
            ]}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: contact.isPrimary ? colors.brand : colors.inkFaint,
                  backgroundColor: contact.isPrimary ? colors.brand : 'transparent',
                },
              ]}
            >
              {contact.isPrimary ? <Check size={14} color="#ffffff" /> : null}
            </View>

            <View style={styles.contactInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.nameText, { color: colors.foreground }]}>
                  {contact.name}
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.surfaceSoft }]}>
                  <Text style={[styles.badgeText, { color: colors.inkMuted }]}>
                    {contact.relation}
                  </Text>
                </View>
              </View>
              <Text style={[styles.phoneText, { color: colors.inkMuted }]}>{contact.phone}</Text>
            </View>

            <Pressable
              onPress={() => removeContact(contact.id)}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <X size={16} color={colors.inkFaint} />
            </Pressable>
          </Pressable>
        ))}
      </View>

      {/* Add new contact */}
      {showAddForm ? (
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.surfaceSoft, borderColor: colors.line },
          ]}
        >
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Add contact</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Dr. Robert Vance"
            placeholderTextColor={colors.inkFaint}
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.line, color: colors.foreground },
            ]}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Relationship</Text>
          <TextInput
            value={relation}
            onChangeText={setRelation}
            placeholder="e.g. Physician, Neighbor, Co-worker"
            placeholderTextColor={colors.inkFaint}
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.line, color: colors.foreground },
            ]}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
            placeholderTextColor={colors.inkFaint}
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.line, color: colors.foreground },
            ]}
          />

          <View style={styles.formActions}>
            <Pressable
              onPress={() => setShowAddForm(false)}
              style={[styles.cancelBtn, { borderColor: colors.line }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={addContact}
              disabled={!name.trim() || !phone.trim()}
              style={[
                styles.addSubmitBtn,
                { backgroundColor: name.trim() && phone.trim() ? colors.brand : colors.surfaceSoft },
              ]}
            >
              <Text
                style={[
                  styles.addSubmitBtnText,
                  { color: name.trim() && phone.trim() ? '#ffffff' : colors.inkFaint },
                ]}
              >
                Add Contact
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setShowAddForm(true)}
          style={[styles.addBtn, { borderColor: colors.brand }]}
        >
          <Plus size={18} color={colors.brand} />
          <Text style={[styles.addBtnText, { color: colors.brand }]}>
            Add another contact
          </Text>
        </Pressable>
      )}

      {/* Assurance banner */}
      <View
        style={[
          styles.noticeCard,
          { backgroundColor: colors.surfaceSoft, borderColor: colors.line },
        ]}
      >
        <ShieldCheck size={20} color={colors.brand} />
        <Text style={[styles.noticeText, { color: colors.inkMuted }]}>
          Emergency services (911 / 112) will always be connected directly in an SOS, regardless of your personal contacts list.
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  phoneText: {
    fontSize: 13,
  },
  removeBtn: {
    padding: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
    gap: 10,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  addSubmitBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 6,
  },
  noticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
});
