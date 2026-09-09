import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { OnboardingLayout } from '@/components/OnboardingLayout';
import { Plus, Users, X } from '@/components/icons';
import { getOnboardingFamilyDraft, saveOnboardingFamilyDraft } from '@/services/onboardingService';

type FamilyMemberDraft = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

const RELATIONS = ['Parent', 'Spouse', 'Child', 'Sibling', 'Partner', 'Friend', 'Other'];

export default function FamilyStep() {
  const { colors } = useAppTheme();

  // Starts empty — this used to pre-seed a fake "Maya Chen" entry, which
  // meant every new user's family circle looked already-populated with a
  // person they never added (see PROGRESS.md §4.3). A real draft, loaded
  // below, is what should pre-fill this now.
  const [members, setMembers] = useState<FamilyMemberDraft[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Parent');
  const [phone, setPhone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    getOnboardingFamilyDraft().then((saved) => {
      if (saved) setMembers(saved);
    });
  }, []);

  const addMember = () => {
    if (!name.trim()) return;
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: name.trim(),
        relation,
        phone: phone.trim(),
      },
    ]);
    setName('');
    setPhone('');
    setShowAddForm(false);
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const onContinue = async () => {
    await saveOnboardingFamilyDraft(members);
    router.push('/onboarding/location' as any);
  };

  const onSkip = async () => {
    await saveOnboardingFamilyDraft(members);
    router.push('/onboarding/location' as any);
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={5}
      title="Family circle"
      subtitle="Add loved ones to check in on during emergencies and automatically share status updates."
      onContinue={onContinue}
      onSkip={onSkip}
    >
      {/* Existing members */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Added members ({members.length})
        </Text>

        {members.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.line }]}>
            <Users size={28} color={colors.inkFaint} />
            <Text style={[styles.emptyText, { color: colors.inkMuted }]}>
              No members added yet. You can add them below or skip for now.
            </Text>
          </View>
        ) : (
          members.map((member) => (
            <View
              key={member.id}
              style={[
                styles.memberCard,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.brandSoft }]}>
                <Text style={[styles.avatarText, { color: colors.brand }]}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberRow}>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>
                    {member.name}
                  </Text>
                  <View style={[styles.relationBadge, { backgroundColor: colors.surfaceSoft }]}>
                    <Text style={[styles.relationBadgeText, { color: colors.inkMuted }]}>
                      {member.relation}
                    </Text>
                  </View>
                </View>
                {member.phone ? (
                  <Text style={[styles.memberPhone, { color: colors.inkMuted }]}>
                    {member.phone}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => removeMember(member.id)}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <X size={16} color={colors.inkFaint} />
              </Pressable>
            </View>
          ))
        )}
      </View>

      {/* Add member section */}
      {showAddForm ? (
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.surfaceSoft, borderColor: colors.line },
          ]}
        >
          <Text style={[styles.formTitle, { color: colors.foreground }]}>New member</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sarah Connor"
            placeholderTextColor={colors.inkFaint}
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.line, color: colors.foreground },
            ]}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Relationship</Text>
          <View style={styles.relationGrid}>
            {RELATIONS.map((r) => {
              const isSelected = relation === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRelation(r)}
                  style={[
                    styles.relationChip,
                    {
                      backgroundColor: isSelected ? colors.brand : colors.surface,
                      borderColor: isSelected ? colors.brand : colors.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.relationChipText,
                      { color: isSelected ? '#ffffff' : colors.foreground },
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>Phone number (optional)</Text>
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
              onPress={addMember}
              disabled={!name.trim()}
              style={[
                styles.addSubmitBtn,
                { backgroundColor: name.trim() ? colors.brand : colors.surfaceSoft },
              ]}
            >
              <Text
                style={[
                  styles.addSubmitBtnText,
                  { color: name.trim() ? '#ffffff' : colors.inkFaint },
                ]}
              >
                Add Member
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setShowAddForm(true)}
          style={[styles.addMemberBtn, { borderColor: colors.brand }]}
        >
          <Plus size={18} color={colors.brand} />
          <Text style={[styles.addMemberBtnText, { color: colors.brand }]}>
            Add a family member
          </Text>
        </Pressable>
      )}
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
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
  },
  relationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  relationBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  memberPhone: {
    fontSize: 13,
  },
  removeBtn: {
    padding: 4,
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
  relationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  relationChipText: {
    fontSize: 12,
    fontWeight: '500',
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
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  addMemberBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
