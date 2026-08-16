import { type CollectionEntry, getCollection } from 'astro:content'
import I18nKey from '@i18n/i18nKey'
import { i18n } from '@i18n/translation'
import { DEFAULT_LOCALE, type Locale } from '@i18n/locales'
import {
  filterPostsByLocale,
  getPostRouteSlug,
  linkPostNeighbors,
} from '@utils/post-locale'
import { getCategoryUrl } from '@utils/url-utils.ts'

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts(locale: Locale = DEFAULT_LOCALE) {
  const allBlogPosts: CollectionEntry<'posts'>[] = await getCollection(
    'posts',
    ({ data }: { data: { draft?: boolean } }) => {
      return import.meta.env.PROD ? data.draft !== true : true
    }
  )

  const sorted = filterPostsByLocale(allBlogPosts, locale).sort((a: CollectionEntry<'posts'>, b: CollectionEntry<'posts'>) => {
    const aPin = a.data.pin ? 1 : 0
    const bPin = b.data.pin ? 1 : 0
    if (aPin !== bPin) return bPin - aPin
    const dateA = new Date(a.data.published)
    const dateB = new Date(b.data.published)
    return dateA > dateB ? -1 : 1
  })
  return sorted
}

export async function getSortedPosts(locale: Locale = DEFAULT_LOCALE) {
  return linkPostNeighbors(await getRawSortedPosts(locale))
}
export type PostForList = {
  slug: string
  data: CollectionEntry<'posts'>['data']
}
export async function getSortedPostsList(
  locale: Locale = DEFAULT_LOCALE
): Promise<PostForList[]> {
  const sortedFullPosts = await getRawSortedPosts(locale)

  // delete post.body
  const sortedPostsList = sortedFullPosts.map((post: CollectionEntry<'posts'>) => ({
    slug: getPostRouteSlug(post),
    data: post.data,
  }))

  return sortedPostsList
}
export type Tag = {
  name: string
  count: number
}

export async function getTagList(locale: Locale = DEFAULT_LOCALE): Promise<Tag[]> {
  const allBlogPosts = await getRawSortedPosts(locale)

  const countMap: { [key: string]: number } = {}
  allBlogPosts.forEach((post: CollectionEntry<'posts'>) => {
    post.data.tags.forEach((tag: string) => {
      if (!countMap[tag]) countMap[tag] = 0
      countMap[tag]++
    })
  })

  // sort tags
  const keys: string[] = Object.keys(countMap).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })

  return keys.map((key) => ({ name: key, count: countMap[key] }))
}

export type Category = {
  name: string
  count: number
  url: string
}

export type Series = {
  name: string
  posts: CollectionEntry<'posts'>[]
}

export async function getCategoryList(
  locale: Locale = DEFAULT_LOCALE
): Promise<Category[]> {
  const allBlogPosts = await getRawSortedPosts(locale)
  const count: { [key: string]: number } = {}
  allBlogPosts.forEach((post: CollectionEntry<'posts'>) => {
    if (!post.data.category) {
      const ucKey = i18n(I18nKey.uncategorized, locale)
      count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1
      return
    }

    const categoryName =
      typeof post.data.category === 'string'
        ? post.data.category.trim()
        : String(post.data.category).trim()

    count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1
  })

  const lst = Object.keys(count).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })

  const ret: Category[] = []
  for (const c of lst) {
    ret.push({
      name: c,
      count: count[c],
      url: getCategoryUrl(c, locale),
    })
  }
  return ret
}

export async function getSeriesList(locale: Locale = DEFAULT_LOCALE): Promise<Series[]> {
  const allBlogPosts = await getRawSortedPosts(locale)

  const seriesMap: Map<string, PostForList[]> = new Map()
  allBlogPosts.forEach((post: CollectionEntry<'posts'>) => {
    const names = post.data.series || []
    names.forEach((name: string) => {
      if (!seriesMap.has(name)) seriesMap.set(name, [])
      seriesMap.get(name)!.push(post)
    })
  })

  // Sort posts within each series by published date (ascending)
  for (const [, posts] of seriesMap) {
    posts.sort((a, b) => {
      return new Date(a.data.published).getTime() - new Date(b.data.published).getTime()
    })
  }

  // Sort series by their newest post date
  const sorted = Array.from(seriesMap.entries())
    .map(([name, posts]) => ({ name, posts }))
    .sort((a, b) => {
      const aDate = new Date(a.posts[a.posts.length - 1]?.data.published ?? 0).getTime()
      const bDate = new Date(b.posts[b.posts.length - 1]?.data.published ?? 0).getTime()
      return bDate - aDate
    })

  return sorted
}
