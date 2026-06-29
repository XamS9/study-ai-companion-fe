import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useLanguageStore, type Language } from '@/store/language';
import { useThemeStore, type ThemeMode } from '@/store/theme';

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  theme: ThemeMode;
  language: Language;
};

export type ProfilePatch = Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'theme' | 'language'>>;

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  status: AuthStatus;
  /** Loads the persisted session and subscribes to auth changes. Returns an unsubscribe fn. */
  init: () => () => void;
  refreshProfile: () => Promise<void>;
  /** Persists profile fields (name, avatar, theme, language) via the backend API. */
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  status: 'loading',

  init: () => {
    // Apply whatever session is persisted (works offline from SecureStore).
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
      });
      if (session) get().refreshProfile();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
      });
      if (session) {
        get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });

    return () => subscription.unsubscribe();
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, theme, language')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      const profile = data as Profile;
      set({ profile });
      // Apply the synced preferences to the local stores so a fresh device picks
      // up the user's choices (the stores also persist them to AsyncStorage).
      if (profile.theme) void useThemeStore.getState().setMode(profile.theme);
      if (profile.language) void useLanguageStore.getState().setLanguage(profile.language);
    }
  },

  updateProfile: async (patch) => {
    if (!get().user) return;
    const updated = await api.patch<Profile>('/api/profile', patch);
    set({ profile: updated });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, status: 'unauthenticated' });
  },
}));
