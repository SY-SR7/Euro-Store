import { Stack } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import { I18nManager } from 'react-native';

I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

NativeWindStyleSheet.setOutput({
  default: 'native',
});

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F0F' }
      }}
    >
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
    </Stack>
  );
}
