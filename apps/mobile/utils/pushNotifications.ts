import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiFetch } from './api';

const TOKEN_STORAGE_KEY = 'eurostore-expo-push-token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

function expoProjectId(): string | null {
  return Constants.easConfig?.projectId
    ?? (Constants.expoConfig?.extra?.eas?.projectId as string | undefined)
    ?? null;
}

export async function registerPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'EuroStore',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#CFA63D',
    });
  }

  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted') permissions = await Notifications.requestPermissionsAsync();
  if (permissions.status !== 'granted') return;

  const projectId = expoProjectId();
  if (!projectId) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  if (!/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(token)) return;

  await apiFetch('/api/push-tokens', {
    method: 'POST',
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function unregisterPushNotifications(): Promise<void> {
  const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  if (!token) return;
  await apiFetch('/api/push-tokens', {
    method: 'DELETE',
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
}
