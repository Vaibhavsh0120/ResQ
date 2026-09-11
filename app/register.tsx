import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, CalendarDays, ChevronRight, LockKeyhole, User } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MINIMUM_AGE, meetsMinimumAge, parseDob } from '@/utils/age';

const logoSource = require('../assets/images/logo-mark.png');

export default function Register() {
  const { colors } = useAppTheme();
  const { register, loginAsGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword || confirmPassword.length === 0;

  // India-first launch: the DPDP Act 2023 requires verifiable
  // parental/guardian consent to process a child's data (see
  // src/utils/age.ts's doc comment). There's no backend to run a real
  // consent flow against yet, so — rather than fake one — registration
  // itself requires being MINIMUM_AGE (18) or older. DOB is asked for here,
  // at the actual account-creation gate, rather than only later in
  // onboarding's personal-info step (which happens after an account
  // already exists and previously had no age check on it at all).
  const onDobBlur = () => {
    setDobFocused(false);
    if (!dob.trim()) {
      setAgeError(null);
      return;
    }
    if (!parseDob(dob)) {
      setAgeError('Enter a valid date as DD / MM / YYYY.');
    } else if (!meetsMinimumAge(dob)) {
      setAgeError(`You must be at least ${MINIMUM_AGE} to create a ResQ account.`);
    } else {
      setAgeError(null);
    }
  };

  const onRegister = async () => {
    if (!parseDob(dob)) {
      setAgeError('Enter your date of birth as DD / MM / YYYY to continue.');
      return;
    }
    if (!meetsMinimumAge(dob)) {
      setAgeError(`You must be at least ${MINIMUM_AGE} to create a ResQ account.`);
      return;
    }
    await register({ name: name || 'New User', email: email || 'user@example.com' });
    router.replace('/onboarding/personal' as any);
  };

  const onGuestAccess = async () => {
    await loginAsGuest();
    router.replace('/(tabs)');
  };

  const onGoToLogin = () => {
    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, isWide && styles.contentWide]}>
          {/* ── Brand header ── */}
          <View style={styles.brandSection}>
            <View style={[styles.logoCircle, { backgroundColor: colors.brandDeep }]}>
              <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>ResQ</Text>
          </View>

          {/* ── Welcome copy ── */}
          <View style={styles.copySection}>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              Create your account
            </Text>
            <Text style={[styles.subtext, { color: colors.inkMuted }]}>
              Set up your safety profile so ResQ can keep you and your people protected.
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.formStack}>
            {/* Full Name */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Full name</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Alex Chen"
                  autoCapitalize="words"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  style={[
                    styles.input,
                    styles.inputPadded,
                    {
                      borderColor: nameFocused ? colors.brand : colors.line,
                      color: colors.foreground,
                      backgroundColor: colors.surfaceSoft,
                    },
                  ]}
                  placeholderTextColor={colors.inkFaint}
                />
                <View style={styles.inputIcon}>
                  <User size={16} color={colors.inkFaint} />
                </View>
              </View>
            </View>

            {/* Date of birth (minimum-age gate — see src/utils/age.ts) */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Date of birth</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  value={dob}
                  onChangeText={(text) => {
                    setDob(text);
                    if (ageError) setAgeError(null);
                  }}
                  placeholder="DD / MM / YYYY"
                  keyboardType="numeric"
                  onFocus={() => setDobFocused(true)}
                  onBlur={onDobBlur}
                  style={[
                    styles.input,
                    styles.inputPadded,
                    {
                      borderColor: ageError ? colors.danger : dobFocused ? colors.brand : colors.line,
                      color: colors.foreground,
                      backgroundColor: colors.surfaceSoft,
                    },
                  ]}
                  placeholderTextColor={colors.inkFaint}
                />
                <View style={styles.inputIcon}>
                  <CalendarDays size={16} color={ageError ? colors.danger : colors.inkFaint} />
                </View>
              </View>
              {ageError ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>{ageError}</Text>
              ) : (
                <Text style={[styles.helperText, { color: colors.inkFaint }]}>
                  ResQ requires account holders to be 18 or older.
                </Text>
              )}
            </View>

            {/* Email */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Email address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={[
                  styles.input,
                  {
                    borderColor: emailFocused ? colors.brand : colors.line,
                    color: colors.foreground,
                    backgroundColor: colors.surfaceSoft,
                  },
                ]}
                placeholderTextColor={colors.inkFaint}
              />
            </View>

            {/* Password */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="At least 8 characters"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  style={[
                    styles.input,
                    styles.inputPadded,
                    {
                      borderColor: passwordFocused ? colors.brand : colors.line,
                      color: colors.foreground,
                      backgroundColor: colors.surfaceSoft,
                    },
                  ]}
                  placeholderTextColor={colors.inkFaint}
                />
                <View style={styles.inputIcon}>
                  <LockKeyhole size={16} color={colors.inkFaint} />
                </View>
              </View>
            </View>

            {/* Confirm Password */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Confirm password</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Re-enter your password"
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                  style={[
                    styles.input,
                    styles.inputPadded,
                    {
                      borderColor: !passwordsMatch
                        ? colors.danger
                        : confirmFocused
                        ? colors.brand
                        : colors.line,
                      color: colors.foreground,
                      backgroundColor: colors.surfaceSoft,
                    },
                  ]}
                  placeholderTextColor={colors.inkFaint}
                />
                <View style={styles.inputIcon}>
                  <LockKeyhole size={16} color={!passwordsMatch ? colors.danger : colors.inkFaint} />
                </View>
              </View>
              {!passwordsMatch && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  Passwords don't match
                </Text>
              )}
            </View>

            {/* Create Account button */}
            <Pressable
              onPress={onRegister}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.brandDeep },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.onBrand }]}>
                Create Account
              </Text>
              <ChevronRight size={18} color={colors.onBrand} />
            </Pressable>

            {/* Switch to login */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchText, { color: colors.inkMuted }]}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={onGoToLogin} hitSlop={8}>
                <Text style={[styles.switchLink, { color: colors.brand }]}>Sign in</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Emergency Access ── */}
          <Pressable
            onPress={onGuestAccess}
            style={({ pressed }) => [
              styles.emergencyButton,
              { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
              pressed && styles.pressed,
            ]}
          >
            <AlertTriangle size={17} color={colors.danger} />
            <Text style={[styles.emergencyButtonText, { color: colors.danger }]}>
              Emergency App Access
            </Text>
          </Pressable>
          <Text style={[styles.emergencyHint, { color: colors.inkFaint }]}>
            Use core safety features without an account
          </Text>

          {/* ── Footer ── */}
          <Text style={[styles.footNote, { color: colors.inkFaint }]}>
            By creating an account, you agree to the{' '}
            <Text style={[styles.footNoteLink, { color: colors.brand }]} onPress={() => router.push('/terms')}>
              Terms
            </Text>{' '}
            and{' '}
            <Text
              style={[styles.footNoteLink, { color: colors.brand }]}
              onPress={() => router.push('/privacy-policy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  scrollBody: {
    flexGrow: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 24,
    maxWidth: 480,
  },
  contentWide: {
    paddingHorizontal: 40,
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -1,
  },

  // Copy
  copySection: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    lineHeight: 21,
  },

  // Form
  formStack: {
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: radius.md,
    fontSize: 15,
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputPadded: {
    paddingRight: 42,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
  },
  errorText: {
    fontSize: 11,
    marginTop: 5,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    marginTop: 5,
  },

  // Buttons
  primaryButton: {
    height: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Switch row
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  switchText: {
    fontSize: 13,
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Emergency
  emergencyButton: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emergencyHint: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },

  // Footer
  footNote: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    paddingBottom: 12,
  },
  footNoteLink: {
    fontSize: 11,
    fontWeight: '700',
  },
});
