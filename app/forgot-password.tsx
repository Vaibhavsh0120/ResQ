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
import { Check, ChevronRight, Mail } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const logoSource = require('../assets/images/logo-mark.png');

/**
 * Locally-simulated forgot-password flow (see AGENT.md — auth
 * is a stub, so there's no real email to send yet). This exists so the
 * "Forgot?" link on login.tsx isn't a dead end; once real auth exists, only
 * `onSubmit` needs to call a real reset-request endpoint — the screen and
 * its states stay the same.
 */
export default function ForgotPassword() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onSubmit = async () => {
    if (!isValidEmail || submitting) return;
    setSubmitting(true);
    // No backend yet — simulate the request roundtrip so the loading state
    // is real, matching how mockDelay is used elsewhere in the app.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitting(false);
    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollBody, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, isWide && styles.contentWide]}>
          <View style={styles.brandSection}>
            <View style={[styles.logoCircle, { backgroundColor: colors.brandDeep }]}>
              <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>ResQ</Text>
          </View>

          {sent ? (
            <>
              <View style={styles.copySection}>
                <View style={[styles.sentIcon, { backgroundColor: colors.brandSoft }]}>
                  <Check size={26} color={colors.brand} />
                </View>
                <Text style={[styles.heading, { color: colors.foreground }]}>Check your email</Text>
                <Text style={[styles.subtext, { color: colors.inkMuted }]}>
                  If an account exists for {email.trim()}, we've sent a link to reset your password.
                </Text>
              </View>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.brandDeep }, pressed && styles.pressed]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.onBrand }]}>Back to sign in</Text>
                <ChevronRight size={18} color={colors.onBrand} />
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.copySection}>
                <Text style={[styles.heading, { color: colors.foreground }]}>Reset your password</Text>
                <Text style={[styles.subtext, { color: colors.inkMuted }]}>
                  Enter the email on your account and we'll send you a link to get back in.
                </Text>
              </View>

              <View style={styles.formStack}>
                <View>
                  <Text style={[styles.label, { color: colors.foreground }]}>Email address</Text>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="you@example.com"
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      onSubmitEditing={onSubmit}
                      returnKeyType="send"
                      style={[
                        styles.input,
                        styles.inputPadded,
                        { borderColor: emailFocused ? colors.brand : colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft },
                      ]}
                      placeholderTextColor={colors.inkFaint}
                    />
                    <View style={styles.inputIcon}>
                      <Mail size={16} color={colors.inkFaint} />
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={onSubmit}
                  disabled={!isValidEmail || submitting}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: colors.brandDeep },
                    (!isValidEmail || submitting) && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.primaryButtonText, { color: colors.onBrand }]}>
                    {submitting ? 'Sending...' : 'Send reset link'}
                  </Text>
                  {!submitting && <ChevronRight size={18} color={colors.onBrand} />}
                </Pressable>

                <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
                  <Text style={[styles.backText, { color: colors.brand }]}>Back to sign in</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  scrollBody: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', paddingHorizontal: 24, maxWidth: 480 },
  contentWide: { paddingHorizontal: 40 },
  brandSection: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  logoCircle: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoImage: { width: 36, height: 36 },
  appName: { fontSize: 26, fontWeight: '800', letterSpacing: -1.2 },
  copySection: { alignItems: 'center', marginBottom: 28 },
  sentIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heading: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginBottom: 8, textAlign: 'center' },
  subtext: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  formStack: { gap: 18 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 7, letterSpacing: 0.2 },
  input: { height: 52, paddingHorizontal: 16, borderWidth: 1.5, borderRadius: radius.md, fontSize: 15 },
  inputWithIcon: { position: 'relative', justifyContent: 'center' },
  inputPadded: { paddingRight: 42 },
  inputIcon: { position: 'absolute', right: 16 },
  primaryButton: { height: 52, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  backRow: { alignItems: 'center', marginTop: 4 },
  backText: { fontSize: 13, fontWeight: '700' },
});
