import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

// Detect the device language on first launch (synchronous). The persisted user
// override, if any, is applied later by the language store's hydrate().
const deviceLanguage = getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';

// eslint-disable-next-line import/no-named-as-default-member -- i18next default export's .use()
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
