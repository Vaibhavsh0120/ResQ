import { Stack } from 'expo-router';
import { useAppTheme } from '@/theme/ThemeContext';

export default function OnboardingLayout() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="personal" />
      <Stack.Screen name="medical" />
      <Stack.Screen name="family" />
      <Stack.Screen name="location" />
      <Stack.Screen name="emergency" />
    </Stack>
  );
}
