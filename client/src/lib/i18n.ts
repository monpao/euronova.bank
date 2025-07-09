import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Récupérer la langue préférée depuis localStorage
const savedLanguage = localStorage.getItem('preferredLanguage');

// Pour déboguer i18next
const DEBUG = true;

// Initialize i18next
void i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: savedLanguage || undefined, // Utiliser la langue sauvegardée si disponible
    fallbackLng: 'fr',
    debug: DEBUG,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'preferredLanguage',
      caches: ['localStorage']
    }
  });

// Log lorsque la langue change
if (DEBUG) {
  i18n.on('languageChanged', (lng) => {
    console.log(`Language changed to: ${lng}`);
    console.log('Current i18n state:', i18n.language, i18n.languages);
  });
}

export default i18n;