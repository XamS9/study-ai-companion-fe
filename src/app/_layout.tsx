import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Splash } from '@/components/ui/splash';
import { DbProvider } from '@/db/provider';
import { useExamSync } from '@/hooks/use-exam-sync';
import { useResolvedScheme } from '@/hooks/use-theme';
import { createSessionFromUrl } from '@/lib/auth-oauth';
import { queryClient } from '@/lib/query-client';
import { useAuthStore, type AuthStatus } from '@/store/auth';
import { useLanguageStore } from '@/store/language';
import { useThemeStore } from '@/store/theme';

/** Redirects between the (auth) and (app) groups based on session status. */
function useProtectedRoute(status: AuthStatus) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const inAuthGroup = segments[0] === '(auth)';
    // The password-recovery screen runs with an active (recovery) session, so
    // don't bounce it into the app — let the user set a new password first.
    const onResetScreen = inAuthGroup && segments[1] === 'reset-password';
    if (onResetScreen) return;

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/');
    }
  }, [status, segments, router]);
}

function RootNavigator() {
  const scheme = useResolvedScheme();
  const status = useAuthStore((s) => s.status);
  const initAuth = useAuthStore((s) => s.init);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const languageHydrated = useLanguageStore((s) => s.hydrated);

  const incomingUrl = Linking.useURL();

  // Replays offline exam submissions once connectivity returns.
  useExamSync();

  useEffect(() => {
    hydrateTheme();
    hydrateLanguage();
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [hydrateTheme, hydrateLanguage, initAuth]);

  // Email-confirmation deep links land on the app and carry the session tokens.
  // The reset-password link is handled by that screen, so skip it here.
  useEffect(() => {
    if (!incomingUrl || incomingUrl.includes('reset-password')) return;
    createSessionFromUrl(incomingUrl).catch(() => {});
  }, [incomingUrl]);

  useProtectedRoute(status);

  const ready = themeHydrated && languageHydrated && status !== 'loading';

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      {ready ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      ) : (
        <Splash />
      )}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <DbProvider>
            <RootNavigator />
          </DbProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
