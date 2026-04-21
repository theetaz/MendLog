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
      <AuthProvider client={getSupabaseClient()}>
        <OnboardingProvider>
          <RootGate />
          <StatusBar style="dark" translucent />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootGate() {
  const { status: authStatus } = useAuth();
  const { status: onboardingStatus } = useOnboarding();
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
    const inApp = top === '(tabs)' || top === 'new-job' || top === undefined;

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
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F6F2' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="new-job" options={{ presentation: 'modal', title: 'New job' }} />
    </Stack>
  );
}
