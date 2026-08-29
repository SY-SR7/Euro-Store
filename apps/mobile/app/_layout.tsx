import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PreferencesProvider, usePreferences } from '../contexts/PreferencesContext';
import { useOnboardingStore } from '../store/onboardingStore';
import { useEffect } from 'react';
import '../global.css';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);
  const segments = useSegments();
  const router = useRouter();
  const { resolvedTheme } = usePreferences();

  useEffect(() => {
    if (isLoading || !hasHydrated) return;

    if (!hasSeenOnboarding && segments[0] !== 'onboarding') {
      router.replace('/onboarding');
      return;
    }

    if (session && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, hasSeenOnboarding, hasHydrated, router]);

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: resolvedTheme === 'dark' ? '#0F0F0F' : '#FAF9F7' } }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PreferencesProvider>
  );
}
