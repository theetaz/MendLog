import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

// react-native-image-viewing (used by the job photo lightbox) still imports
// the deprecated SafeAreaView from react-native core. Suppress just that
// one warning so the dev console stays readable until the lib updates.
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';
import {
  OnboardingProvider,
  useOnboarding,
} from '../src/features/onboarding/OnboardingContext';
import { useOfflineMigrations } from '../src/offline/migrations';
import { SyncProvider } from '../src/offline/syncManager';
import { AnimatedSplash } from '../src/features/splash/AnimatedSplash';
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
  const { success: dbReady, error: dbError } = useOfflineMigrations();
  const [splashDone, setSplashDone] = useState(false);

  // Gate render on both fonts AND local DB being migrated — no screen should
  // ever query Drizzle against an unmigrated schema. If the migration throws
  // we log and fall through; the app can still run against Supabase directly
  // until the offline layer is flipped on for reads.
  useEffect(() => {
    if (dbError) console.warn('offline DB migration failed:', dbError.message);
  }, [dbError]);

  if (!fontsReady || (!dbReady && !dbError)) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider client={getSupabaseClient()}>
          <SyncProvider>
            <OnboardingProvider>
              <RootGate />
              <ThemedStatusBar />
              {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
            </OnboardingProvider>
          </SyncProvider>
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
