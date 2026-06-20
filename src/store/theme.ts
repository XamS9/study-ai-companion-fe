import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = '@studyai/theme-mode';

type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  /** Loads the persisted preference once at startup. */
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  hydrated: false,

  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      set({ mode: stored });
    }
    set({ hydrated: true });
  },

  setMode: async (mode) => {
    set({ mode });
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  },
}));
