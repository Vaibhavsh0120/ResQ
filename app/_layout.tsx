import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '@/theme/ThemeContext';
import { NavVisibilityProvider } from '@/context/NavVisibilityContext';
import { AuthProvider } from '@/context/AuthContext';

function RootStack() {
  const { isDark, colors } = useAppTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="readiness" />
        <Stack.Screen name="guidance-result" />
        <Stack.Screen name="family-member" />
        <Stack.Screen name="place-detail" />
        <Stack.Screen name="update-detail" />
        <Stack.Screen name="alert-preferences" />
        <Stack.Screen name="privacy-security" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavVisibilityProvider>
              <RootStack />
            </NavVisibilityProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
