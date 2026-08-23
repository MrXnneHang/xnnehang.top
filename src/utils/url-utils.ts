import { DEFAULT_LOCALE, localizePath, type Locale } from '../i18n/locales'
import { type PostCategory, type PostKind } from './post-taxonomy'

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
  if (!tag) return url('/tags/', locale)
  return url(`/tags/${encodeURIComponent(tag.trim())}/`, locale)
}

export function getCategoryUrl(category: PostCategory, locale: Locale = DEFAULT_LOCALE): string {
  return url(`/categories/${category}/`, locale)
}

export function getKindUrl(kind: PostKind, locale: Locale = DEFAULT_LOCALE): string {
  return url(`/archive/?kind=${encodeURIComponent(kind)}`, locale)
}

export function getTagsIndexUrl(locale: Locale = DEFAULT_LOCALE): string {
  return url('/tags/', locale)
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
