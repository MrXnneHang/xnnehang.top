import type { CollectionEntry } from 'astro:content'
import { DEFAULT_LOCALE, type Locale } from '../i18n/locales'
import { getPostCoverUrl } from './cover'
import { getPostLocale, getPostRouteSlug, getPostTranslationKey } from './post-locale'
import { getPostUrlBySlug } from './url-utils'

export const FEATURED_POST_LIMIT = 3

const SITE_URL = 'https://xnnehang.top'

type Post = CollectionEntry<'posts'>

export interface FeaturedPost {
  title: string
  description: string
  published: string
  url: string
  coverUrl: string | null
  lang: Locale
  translationKey: string
  alternateUrl?: string
  alternateLang?: Locale
}

function getAbsolutePostUrl(post: Post): string {
  const path = getPostUrlBySlug(getPostRouteSlug(post), getPostLocale(post))
  return new URL(path, SITE_URL).toString()
}

function selectLocalizedPost(posts: Post[], locale: Locale): Post {
  return posts.find((post) => getPostLocale(post) === locale) ?? posts[0]
}

export function buildFeaturedPosts(
  posts: Post[],
  locale: Locale = DEFAULT_LOCALE,
  limit: number = FEATURED_POST_LIMIT
): FeaturedPost[] {
  const groupedPosts = new Map<string, Post[]>()

  for (const post of posts) {
    if (post.data.draft === true) continue

    const translationKey = getPostTranslationKey(post)
    const group = groupedPosts.get(translationKey) ?? []
    group.push(post)
    groupedPosts.set(translationKey, group)
  }

  return [...groupedPosts.entries()]
    .filter(([, group]) => group.some((post) => post.data.featured === true))
    .map(([translationKey, group]) => {
      const selected = selectLocalizedPost(group, locale)
      return { translationKey, group, selected }
    })
    .sort(
      (a, b) =>
        b.selected.data.published.getTime() - a.selected.data.published.getTime() ||
        a.translationKey.localeCompare(b.translationKey)
    )
    .slice(0, limit)
    .map(({ translationKey, group, selected }) => {
      const selectedLocale = getPostLocale(selected)
      const alternate = group.find((post) => getPostLocale(post) !== selectedLocale)

      return {
        title: selected.data.title,
        description: selected.data.description || '',
        published: selected.data.published.toISOString().slice(0, 10),
        url: getAbsolutePostUrl(selected),
        coverUrl: getPostCoverUrl(selected.data.image, selected.body, selected.id),
        lang: selectedLocale,
        translationKey,
        ...(alternate && {
          alternateUrl: getAbsolutePostUrl(alternate),
          alternateLang: getPostLocale(alternate),
        }),
      }
    })
}

export function createFeaturedPostsResponse(posts: Post[], locale: Locale): Response {
  return new Response(JSON.stringify(buildFeaturedPosts(posts, locale), null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
