import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  status: AuthStatus;
  /** Loads the persisted session and subscribes to auth changes. Returns an unsubscribe fn. */
  init: () => () => void;
  refreshProfile: () => Promise<void>;
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
      .select('id, full_name, avatar_url')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, status: 'unauthenticated' });
  },
}));
