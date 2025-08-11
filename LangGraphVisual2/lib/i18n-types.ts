// Type-safe internationalization types
import { TRANSLATIONS } from './constants'

export type TranslationKey = keyof typeof TRANSLATIONS.en
export type Language = keyof typeof TRANSLATIONS

// Type-safe translation function
export type TranslationFunction = (key: TranslationKey) => string

// Simplified validation - ensures all languages have the same structure as English
type TranslationRecord = Record<TranslationKey, string>

// Type assertion to validate translation consistency at compile time
export const _validateTranslations = (): void => {
  // This function will cause TypeScript errors if translations are inconsistent
  const _check: Record<Language, TranslationRecord> = TRANSLATIONS
  void _check // Prevent unused variable warning
}

// Runtime validation helper for development
export const validateTranslationKeys = (): boolean => {
  const englishKeys = Object.keys(TRANSLATIONS.en)
  const languages = Object.keys(TRANSLATIONS) as Language[]
  
  for (const lang of languages) {
    const langKeys = Object.keys(TRANSLATIONS[lang])
    const missingKeys = englishKeys.filter(key => !(key in TRANSLATIONS[lang]))
    const extraKeys = langKeys.filter(key => !(key in TRANSLATIONS.en))
    
    if (missingKeys.length > 0) {
      console.warn(`Missing translation keys in ${lang}:`, missingKeys)
      return false
    }
    if (extraKeys.length > 0) {
      console.warn(`Extra translation keys in ${lang}:`, extraKeys)
      return false
    }
  }
  return true
}

// Export validated translations with proper typing
export type ValidatedTranslations = typeof TRANSLATIONS