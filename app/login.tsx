import React, { useState } from 'react';
import {
  Animated,
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
import { AlertTriangle, LockKeyhole, ChevronRight } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius, spacing } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const logoSource = require('../assets/images/logo-mark.png');

export default function Login() {
  const { colors } = useAppTheme();
  const { login, loginAsGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const onLogin = async () => {
    // No backend yet to look up a real name from this email (see
    // PROGRESS.md — auth is a stub). Deriving a placeholder from the
    // email itself, rather than hardcoding a fictional "Alex Chen", so a
    // real returning user doesn't see someone else's name across the app.
    const trimmedEmail = email.trim() || 'you@example.com';
    const localPart = trimmedEmail.split('@')[0];
    const placeholderName = localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
    await login({ name: placeholderName || 'ResQ user', email: trimmedEmail });
    router.replace('/(tabs)');
  };

  const onGuestAccess = async () => {
    await loginAsGuest();
    router.replace('/(tabs)');
  };

  const onGoToRegister = () => {
    router.push('/register' as any);
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
            <Text style={[styles.tagline, { color: colors.inkMuted }]}>
              Prepared for what matters.
            </Text>
          </View>

          {/* ── Welcome copy ── */}
          <View style={styles.copySection}>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtext, { color: colors.inkMuted }]}>
              Sign in to keep your safety plan, people, and places close.
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.formStack}>
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

            <View>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
                <Pressable hitSlop={8} onPress={() => router.push('/forgot-password' as any)}>
                  <Text style={[styles.forgotText, { color: colors.brand }]}>Forgot?</Text>
                </Pressable>
              </View>
              <View style={styles.inputWithIcon}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
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

            {/* Sign in button */}
            <Pressable
              onPress={onLogin}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.brandDeep },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.onBrand }]}>Sign in</Text>
              <ChevronRight size={18} color={colors.onBrand} />
            </Pressable>

            {/* Register link */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchText, { color: colors.inkMuted }]}>
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={onGoToRegister} hitSlop={8}>
                <Text style={[styles.switchLink, { color: colors.brand }]}>Register</Text>
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
            By continuing, you agree to the{' '}
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
    marginTop: 20,
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  tagline: {
    fontSize: 13,
    marginTop: 4,
  },

  // Copy
  copySection: {
    marginBottom: 28,
  },
  heading: {
    fontSize: 28,
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
    gap: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  footNoteLink: {
    fontSize: 11,
    fontWeight: '700',
  },
});
