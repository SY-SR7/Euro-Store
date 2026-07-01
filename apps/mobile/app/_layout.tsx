import { Stack, useRouter, useSegments } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import { I18nManager } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import '../global.css';

I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

NativeWindStyleSheet.setOutput({
  default: 'native',
});

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    
    if (!session && inAuthGroup) {
      // Redirect to the login page if trying to access tabs without auth
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      // Redirect to tabs if logged in and trying to access login
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F0F' }
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
