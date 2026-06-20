import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import i18n from '@/i18n';

export type Language = 'es' | 'en';

const STORAGE_KEY = '@studyai/language';

type LanguageState = {
  language: Language;
  hydrated: boolean;
  /** Loads the persisted choice; falls back to the device language on first launch. */
  hydrate: () => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: (i18n.language as Language) ?? 'en',
  hydrated: false,

  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') {
      await i18n.changeLanguage(stored);
      set({ language: stored });
    } else {
      set({ language: (i18n.language as Language) ?? 'en' });
    }
    set({ hydrated: true });
  },

  setLanguage: async (language) => {
    await i18n.changeLanguage(language);
    set({ language });
    await AsyncStorage.setItem(STORAGE_KEY, language);
  },
}));
