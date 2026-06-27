import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import pt from './locales/pt'
import en from './locales/en'
import fr from './locales/fr'
import zh from './locales/zh'
import ar from './locales/ar'

export const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'zh', label: '中文',       flag: '🇨🇳' },
  { code: 'ar', label: 'العربية',   flag: '🇸🇦' },
] as const

export type LangCode = (typeof LANGUAGES)[number]['code']

const savedLang = (localStorage.getItem('ev_lang') as LangCode) || 'pt'

i18next
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      fr: { translation: fr },
      zh: { translation: zh },
      ar: { translation: ar },
    },
    lng: savedLang,
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
  })

function applyLang(lng: string) {
  localStorage.setItem('ev_lang', lng)
  document.documentElement.dir  = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
}

i18next.on('languageChanged', applyLang)
applyLang(savedLang)

export default i18next
