import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ukTranslation from './uk.json';
import enTranslation from './en.json';

const resources = {
  uk: {
    translation: ukTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'uk', // Основна мова - українська
    fallbackLng: 'uk',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
