import { useTranslation } from 'react-i18next'
import { ptBR as ptPT } from 'date-fns/locale/pt-BR'
import { enUS }         from 'date-fns/locale/en-US'
import { fr as frFR }   from 'date-fns/locale/fr'
import { zhCN }         from 'date-fns/locale/zh-CN'
import { arSA }         from 'date-fns/locale/ar-SA'
import type { Locale }  from 'date-fns'

const localeMap: Record<string, Locale> = {
  pt: ptPT,
  en: enUS,
  fr: frFR,
  zh: zhCN,
  ar: arSA,
}

export function useDateFnsLocale(): Locale {
  const { i18n } = useTranslation()
  return localeMap[i18n.language] ?? ptPT
}
