import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import uk from './locales/uk.json';
import en from './locales/en.json';
import pl from './locales/pl.json';
import de from './locales/de.json';

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetectorPlugin: any = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      await AsyncStorage.getItem(STORE_LANGUAGE_KEY).then((language) => {
        if (language) {
          return callback('en');
        } else {
          return callback('en'); // Default to Ukrainian
        }
      });
    } catch (error) {
      console.log('Error reading language', error);
      callback('en');
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {}
  }
};

const resources = {
  uk: { translation: uk },
  en: { translation: en },
  pl: { translation: pl },
  de: { translation: de },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react is already safe from xss
    },
  });

export default i18n;
