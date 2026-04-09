import { setSupabaseStorage, supabase } from '@meupersonal/supabase';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

// Set the storage adapter for React Native
setSupabaseStorage(ExpoSecureStoreAdapter);

// Re-export supabase for backward compatibility
export { supabase };
