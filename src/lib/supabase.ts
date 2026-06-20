import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev: the app cannot authenticate without these. Fill them in
  // from your Supabase project settings (see .env.example).
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — auth will not work.',
  );
}

/**
 * SecureStore-backed storage adapter for the Supabase auth session.
 *
 * Two wrinkles this handles:
 *  - SecureStore is native-only (no web) → fall back to AsyncStorage on web.
 *  - SecureStore values are capped (~2048 bytes on iOS historically); a Supabase
 *    session token exceeds that, so we transparently split values into chunks
 *    under the limit and reassemble them on read. Keys may only contain
 *    alphanumerics, '.', '-', '_', so chunk suffixes use dots.
 */
const CHUNK_SIZE = 2000;

async function secureGet(key: string): Promise<string | null> {
  const meta = await SecureStore.getItemAsync(`${key}.meta`);
  if (meta == null) return SecureStore.getItemAsync(key);
  const count = parseInt(meta, 10);
  let value = '';
  for (let i = 0; i < count; i++) {
    const chunk = await SecureStore.getItemAsync(`${key}.${i}`);
    if (chunk == null) return null;
    value += chunk;
  }
  return value;
}

async function secureRemove(key: string): Promise<void> {
  const meta = await SecureStore.getItemAsync(`${key}.meta`);
  if (meta != null) {
    const count = parseInt(meta, 10);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}.meta`);
  }
  await SecureStore.deleteItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  await secureRemove(key);
  const count = Math.ceil(value.length / CHUNK_SIZE) || 1;
  await SecureStore.setItemAsync(`${key}.meta`, String(count));
  for (let i = 0; i < count; i++) {
    await SecureStore.setItemAsync(
      `${key}.${i}`,
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    );
  }
}

const secureStoreAdapter: SupportedStorage = {
  getItem: secureGet,
  setItem: secureSet,
  removeItem: secureRemove,
};

const authStorage: SupportedStorage = Platform.OS === 'web' ? AsyncStorage : secureStoreAdapter;

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    // We parse the OAuth/recovery redirect URL ourselves (native deep link), so
    // the client should not try to read tokens from window.location.
    detectSessionInUrl: false,
  },
});
