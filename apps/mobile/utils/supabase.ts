import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

const parsedUrl = new URL(supabaseUrl);
if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL must use HTTPS outside localhost.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web'
      ? {
          getItem: (key) => typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage.getItem(key),
          setItem: (key, value) => { if (typeof globalThis.localStorage !== 'undefined') globalThis.localStorage.setItem(key, value); },
          removeItem: (key) => { if (typeof globalThis.localStorage !== 'undefined') globalThis.localStorage.removeItem(key); },
        }
      : {
          getItem: (key) => SecureStore.getItemAsync(key),
          setItem: (key, value) => SecureStore.setItemAsync(key, value, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
          }),
          removeItem: (key) => SecureStore.deleteItemAsync(key),
        },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

