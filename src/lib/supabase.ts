import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SupabaseLike } from './catalog';
import { AuthClientLike } from './session';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Sesi disimpan di perangkat supaya pengguna tetap masuk setelah aplikasi ditutup.
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const hasSupabaseConfig = Boolean(supabase);

export type AppClient = SupabaseLike & {
  auth?: {
    getSession: () => Promise<{
      data: { session: { user: { id: string; email?: string | null } } | null } | null;
    }>;
  };
};

// Klien nyata dipakai lewat antarmuka kecil milik lapisan data dan lapisan sesi.
// Cast ini menjaga modul lib tetap ringan untuk diuji tanpa membawa seluruh tipe pustaka Supabase.
export const dataClient = supabase as unknown as AppClient | null;
export const authClient = supabase as unknown as AuthClientLike | null;
