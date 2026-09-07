import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { ChevronRight } from '@/components/icons';

type Props = {
  /** Current step number (1-based). */
  step: number;
  /** Total number of steps. */
  totalSteps: number;
  /** Large heading. */
  title: string;
  /** Sub-heading text. */
  subtitle: string;
  /** Form content. */
  children: React.ReactNode;
  /** Label for the continue button. Defaults to "Continue". */
  continueLabel?: string;
  /** Called when Continue is pressed. */
  onContinue: () => void;
  /** Called when Skip is pressed. Omit to hide the skip option. */
  onSkip?: () => void;
};

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  continueLabel = 'Continue',
  onContinue,
  onSkip,
}: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, isWide && styles.contentWide]}>
          {/* ── Progress dots ── */}
          <View style={styles.progressRow}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i < step ? colors.brand : colors.line,
                    // Current step dot is wider
                    ...(i === step - 1 ? { width: 28 } : {}),
                  },
                ]}
              />
            ))}
          </View>

          {/* ── Step indicator ── */}
          <Text style={[styles.stepText, { color: colors.inkFaint }]}>
            Step {step} of {totalSteps}
          </Text>

          {/* ── Heading ── */}
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>{subtitle}</Text>

          {/* ── Form content ── */}
          <View style={styles.formArea}>{children}</View>

          {/* ── Bottom actions ── */}
          <View style={styles.actionsArea}>
            <Pressable
              onPress={onContinue}
              style={({ pressed }) => [
                styles.continueButton,
                { backgroundColor: colors.brandDeep },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.continueText, { color: colors.onBrand }]}>
                {continueLabel}
              </Text>
              <ChevronRight size={18} color={colors.onBrand} />
            </Pressable>

            {onSkip && (
              <Pressable onPress={onSkip} hitSlop={8} style={styles.skipButton}>
                <Text style={[styles.skipText, { color: colors.inkMuted }]}>Skip for now</Text>
              </Pressable>
            )}
          </View>
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
    maxWidth: 520,
  },
  contentWide: {
    paddingHorizontal: 40,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  dot: {
    height: 5,
    width: 16,
    borderRadius: 3,
  },

  // Step
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Heading
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
  },

  // Form
  formArea: {
    gap: 18,
  },

  // Actions
  actionsArea: {
    marginTop: 32,
    gap: 14,
  },
  continueButton: {
    height: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
