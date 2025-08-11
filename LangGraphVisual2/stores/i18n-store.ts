import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Language } from '@/lib/types'
import { DEFAULT_LANGUAGE, TRANSLATIONS } from '@/lib/constants'

interface I18nStore {
  language: Language
  setLanguage: (language: Language) => void
}

// Pure translation function - prevents infinite loops
const createTranslationFunction = (language: Language) => (key: string) => {
  const translation = TRANSLATIONS[language]?.[key as keyof (typeof TRANSLATIONS)[typeof language]]
  
  if (translation) return translation

  // Fallback to English if key exists
  const fallback = TRANSLATIONS.en[key as keyof (typeof TRANSLATIONS)['en']]
  if (fallback) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation for key "${key}" in language "${language}", using English fallback`)
    }
    return fallback
  }

  // Return key if no translation found
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Translation key "${key}" not found in any language`)
  }
  return key
}

const initialState = {
  language: DEFAULT_LANGUAGE,
}

export const useI18nStore = create<I18nStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      ...initialState,

      setLanguage: (language: Language) => {
        set({ language })
      },
    })),
    {
      name: 'i18n-store',
    }
  )
)

// Typed selectors for optimal performance
export const useLanguage = () => useI18nStore(state => state.language)

// Translation hook that uses the pure function
export const useTranslation = () => {
  const language = useI18nStore(state => state.language)
  return createTranslationFunction(language)
}

// Action selectors
export const useLanguageActions = () => useI18nStore(state => ({
  setLanguage: state.setLanguage,
}))

// Combined selector for convenience with shallow comparison to prevent infinite loops
export const useI18n = () => {
  const store = useI18nStore(
    useShallow((state) => ({
      language: state.language,
      setLanguage: state.setLanguage,
    }))
  )
  
  const t = createTranslationFunction(store.language)
  
  return {
    ...store,
    t,
  }
}