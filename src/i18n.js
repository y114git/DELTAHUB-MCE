import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';
import zh_cn from './locales/zh_cn.json';
import zh_tw from './locales/zh_tw.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  zh_cn: { translation: zh_cn },
  zh_tw: { translation: zh_tw },
  es: { translation: es }
};

const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
      format: function(value, format, lng) {
        if (format === 'uppercase') return value.toUpperCase();
        return value;
      }
    }
  });

export default i18n;

