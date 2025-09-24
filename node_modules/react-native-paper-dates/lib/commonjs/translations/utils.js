"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTranslation = getTranslation;
exports.registerTranslation = registerTranslation;
let translationsPerLocale = {};
function getTranslation(locale, key, fallback) {
  const l = locale || 'en';
  const translationForLocale = translationsPerLocale[l];
  if (!translationForLocale) {
    console.warn(`[react-native-paper-dates] The locale ${locale} is not registered, see README!, key: ${key}`);
    return fallback || key;
  }
  const translation = typeof translationForLocale === 'function' ? translationForLocale(locale)[key] : translationForLocale[key];
  if (!translation) {
    console.warn(`[react-native-paper-dates] The locale ${locale} is registered, but ${key} is missing`);
  }
  return translation || fallback || key;
}
function registerTranslation(locale, translations) {
  translationsPerLocale[locale] = translations;
}
//# sourceMappingURL=utils.js.map