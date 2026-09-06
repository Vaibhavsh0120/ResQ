import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, LockKeyhole } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function Login() {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('resq-demo');

  const onLogin = () => router.replace('/(tabs)');

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Logo />
          <Pressable>
            <Text style={[styles.textButton, { color: colors.inkMuted }]}>Need help?</Text>
          </Pressable>
        </View>

        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.inkMuted }]}>WELCOME BACK</Text>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Stay ready.{'\n'}
            <Text style={{ color: colors.brand }}>Stay connected.</Text>
          </Text>
          <Text style={[styles.subtext, { color: colors.inkMuted }]}>
            Sign in to keep your safety plan, people, and places close.
          </Text>
        </View>

        <View style={styles.formStack}>
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft }]}
              placeholderTextColor={colors.inkMuted}
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[
                  styles.input,
                  styles.inputPadded,
                  { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft },
                ]}
                placeholderTextColor={colors.inkMuted}
              />
              <View style={styles.inputIcon}>
                <LockKeyhole size={16} color={colors.inkMuted} />
              </View>
            </View>
          </View>

          <PrimaryButton title="Sign in" onPress={onLogin} />

          <View style={styles.orDivider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
            <Text style={[styles.orText, { color: colors.inkMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
          </View>

          <PrimaryButton title="Continue with Google" onPress={onLogin} variant="secondary" />

          <Pressable
            onPress={onLogin}
            style={[styles.emergencyLogin, { borderColor: colors.danger, backgroundColor: colors.dangerSoft }]}
          >
            <AlertTriangle size={17} color={colors.danger} />
            <Text style={[styles.emergencyLoginText, { color: colors.danger }]}>Emergency login</Text>
          </Pressable>
        </View>

        <Text style={[styles.footNote, { color: colors.inkMuted }]}>
          By continuing, you agree to the Terms and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollBody: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textButton: {
    fontSize: 12,
  },
  copy: {
    marginTop: 64,
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '800',
  },
  heading: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 10,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 280,
  },
  formStack: {
    gap: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radius.md,
    fontSize: 14,
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputPadded: {
    paddingRight: 38,
  },
  inputIcon: {
    position: 'absolute',
    right: 14,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 11,
  },
  emergencyLogin: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emergencyLoginText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footNote: {
    marginTop: 'auto',
    paddingTop: 32,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 15,
  },
});
