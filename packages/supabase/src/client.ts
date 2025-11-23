import { createClient } from '@supabase/supabase-js';

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Storage adapter factory
const createStorageAdapter = () => {
  if (isReactNative) {
    // For React Native, storage will be injected from the mobile app
    // This allows us to use expo-secure-store
    return undefined; // Will be set by mobile app
  } else {
    // For web, use localStorage
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  }
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: !isReactNative,
  },
});

// Helper to set storage for React Native
export const setSupabaseStorage = (storage: any) => {
  // This will be called from the mobile app to inject expo-secure-store
  if (isReactNative && storage) {
    (supabase.auth as any).storage = storage;
  }
};

// Types export (will be populated later)
export type Database = any;
