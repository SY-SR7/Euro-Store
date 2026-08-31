import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PreferencesProvider, usePreferences } from '../contexts/PreferencesContext';
import { useOnboardingStore } from '../store/onboardingStore';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { GlobalBottomNav } from '../components/GlobalBottomNav';
import '../global.css';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !hasHydrated) return;

    const authFlow = segments[0] === 'login' || segments[0] === 'reset-password' || segments[0] === 'verify-email';
    if (!hasSeenOnboarding && segments[0] !== 'onboarding' && !authFlow) {
      router.replace('/onboarding');
      return;
    }

    if (session && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, hasSeenOnboarding, hasHydrated, router]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" backgroundColor="#FFFDF8" />
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF7EF' } }}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
      </View>
      <GlobalBottomNav />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
