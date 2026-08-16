export const DEFAULT_LOCALE = 'zh-CN' as const
export const ENGLISH_LOCALE = 'en' as const

export const SUPPORTED_LOCALES = [DEFAULT_LOCALE, ENGLISH_LOCALE] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_DETAILS = {
  [DEFAULT_LOCALE]: {
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    rssLanguage: 'zh-CN',
    pathPrefix: '',
  },
  [ENGLISH_LOCALE]: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    rssLanguage: 'en',
    pathPrefix: '/en',
  },
} as const satisfies Record<
  Locale,
  { htmlLang: string; ogLocale: string; rssLanguage: string; pathPrefix: string }
>

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE

  const normalized = value.replace('_', '-').toLowerCase()
  return normalized === 'en' || normalized.startsWith('en-') ? ENGLISH_LOCALE : DEFAULT_LOCALE
}

export function getLocaleFromPathname(pathname: string): Locale {
  return /^\/en(?:\/|$)/i.test(pathname) ? ENGLISH_LOCALE : DEFAULT_LOCALE
}

export function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/en(?=\/|$)/i, '')
  return stripped || '/'
}

function splitPathSuffix(path: string): { pathname: string; suffix: string } {
  const suffixIndex = path.search(/[?#]/)
  if (suffixIndex < 0) return { pathname: path, suffix: '' }

  return {
    pathname: path.slice(0, suffixIndex),
    suffix: path.slice(suffixIndex),
  }
}

export function localizePath(path: string, locale: Locale): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path

  const { pathname, suffix } = splitPathSuffix(path)
  const normalizedPathname = stripLocalePrefix(pathname.startsWith('/') ? pathname : `/${pathname}`)
  const prefix = LOCALE_DETAILS[locale].pathPrefix
  const localizedPathname = prefix ? `${prefix}${normalizedPathname}` : normalizedPathname

  return `${localizedPathname || '/'}${suffix}`
}

export function getAlternatePath(path: string, locale: Locale): string {
  return localizePath(path, locale)
}

export function isLocaleHomePath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname).replace(/\/+$/, '') || '/'
  return path === '/' || /^\/\d+$/.test(path)
}

export function isLocalePostPath(pathname: string): boolean {
  return stripLocalePrefix(pathname).startsWith('/posts/')
}
