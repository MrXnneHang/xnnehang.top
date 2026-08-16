import { DEFAULT_LOCALE, normalizeLocale, type Locale } from '../i18n/locales'

export interface LocalizedPostIdentity {
  id: string
  data: {
    lang?: string
    translationKey?: string
    prevSlug?: string
    prevTitle?: string
    nextSlug?: string
    nextTitle?: string
    title: string
  }
}

export function getPostLocale(post: LocalizedPostIdentity): Locale {
  return normalizeLocale(post.data.lang)
}

export function getPostTranslationKey(post: LocalizedPostIdentity): string {
  const translationKey = post.data.translationKey?.trim()
  return translationKey || post.id
}

export function getPostRouteSlug(post: LocalizedPostIdentity): string {
  return getPostTranslationKey(post)
}

export function filterPostsByLocale<T extends LocalizedPostIdentity>(
  posts: T[],
  locale: Locale = DEFAULT_LOCALE
): T[] {
  return posts.filter((post) => getPostLocale(post) === locale)
}

export function linkPostNeighbors<T extends LocalizedPostIdentity>(posts: T[]): T[] {
  for (const post of posts) {
    post.data.prevSlug = ''
    post.data.prevTitle = ''
    post.data.nextSlug = ''
    post.data.nextTitle = ''
  }

  for (let index = 0; index < posts.length; index++) {
    const newer = posts[index - 1]
    const older = posts[index + 1]
    const current = posts[index]

    if (newer) {
      current.data.nextSlug = getPostRouteSlug(newer)
      current.data.nextTitle = newer.data.title
    }
    if (older) {
      current.data.prevSlug = getPostRouteSlug(older)
      current.data.prevTitle = older.data.title
    }
  }

  return posts
}
