import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useCallback, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';
import {
  OnboardingProvider,
  useOnboarding,
} from '../src/features/onboarding/OnboardingContext';
import { FONT_MAP } from '../src/features/splash/fonts';
import { ThemeProvider, useTheme } from '../src/features/theme/ThemeProvider';
import { getSupabaseClient } from '../src/lib/supabase';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 300 });

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);
  const fontsReady = fontsLoaded || !!fontError;

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider client={getSupabaseClient()}>
          <OnboardingProvider>
            <RootGate />
            <ThemedStatusBar />
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} translucent />;
}

function RootGate() {
  const { status: authStatus } = useAuth();
  const { status: onboardingStatus } = useOnboarding();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments() as string[];

  const hide = useCallback(async () => {
    await SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (authStatus === 'loading' || onboardingStatus === 'loading') return;

    const top = segments[0];
    const inAuth = top === '(auth)';
    const inOnboarding = top === '(onboarding)';
    const IN_APP_SEGMENTS: (string | undefined)[] = [
      '(tabs)',
      'new-job',
      'jobs',
      'day',
      undefined,
    ];
    const inApp = IN_APP_SEGMENTS.includes(top);

    if (authStatus === 'signed-in') {
      if (!inApp) router.replace('/(tabs)');
    } else if (onboardingStatus === 'pending') {
      if (!inOnboarding) router.replace('/(onboarding)/permissions');
    } else if (!inAuth) {
      router.replace('/(auth)/login');
    }

    hide();
  }, [authStatus, onboardingStatus, segments, router, hide]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="new-job" options={{ presentation: 'modal', title: 'New job' }} />
      <Stack.Screen name="jobs/[id]/index" />
      <Stack.Screen name="jobs/[id]/edit" options={{ presentation: 'modal', title: 'Edit job' }} />
      <Stack.Screen name="day/[date]" />
    </Stack>
  );
}
