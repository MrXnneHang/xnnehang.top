import I18nKey from '../i18n/i18nKey'
import { DEFAULT_LOCALE, localizePath, type Locale } from '../i18n/locales'
import { i18n } from '../i18n/translation'

export function pathsEqual(path1: string, path2: string) {
  const normalizedPath1 = path1.replace(/^\/|\/$/g, '').toLowerCase()
  const normalizedPath2 = path2.replace(/^\/|\/$/g, '').toLowerCase()
  return normalizedPath1 === normalizedPath2
}

function joinUrl(...parts: string[]): string {
  const joined = parts.join('/')
  return joined.replace(/\/+/g, '/')
}

export function getPostUrlBySlug(slug: string, locale: Locale = DEFAULT_LOCALE): string {
  return url(`/posts/${slug}/`, locale)
}

export function getTagUrl(tag: string, locale: Locale = DEFAULT_LOCALE): string {
  if (!tag) return url('/archive/', locale)
  return url(`/archive/?tag=${encodeURIComponent(tag.trim())}`, locale)
}

export function getCategoryUrl(category: string | null, locale: Locale = DEFAULT_LOCALE): string {
  if (
    !category ||
    category.trim() === '' ||
    category.trim().toLowerCase() === i18n(I18nKey.uncategorized, locale).toLowerCase()
  )
    return url('/archive/?uncategorized=true', locale)
  return url(`/archive/?category=${encodeURIComponent(category.trim())}`, locale)
}

export function getSeriesUrl(name: string, locale: Locale = DEFAULT_LOCALE): string {
  return url(`/series/${encodeURIComponent(name.trim())}/`, locale)
}

export function getDir(path: string): string {
  const lastSlashIndex = path.lastIndexOf('/')
  if (lastSlashIndex < 0) {
    return '/'
  }
  return path.substring(0, lastSlashIndex + 1)
}

export function url(path: string, locale: Locale = DEFAULT_LOCALE) {
  return joinUrl('', import.meta.env.BASE_URL, localizePath(path, locale))
}
