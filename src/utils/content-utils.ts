import { type CollectionEntry, getCollection } from 'astro:content'
import { DEFAULT_LOCALE, type Locale } from '@i18n/locales'
import { filterPostsByLocale, getPostRouteSlug, linkPostNeighbors } from '@utils/post-locale'
import { getCategoryLabel, POST_CATEGORY_KEYS, type PostCategory } from '@utils/post-taxonomy'
import { getCategoryUrl } from '@utils/url-utils.ts'

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts(locale: Locale = DEFAULT_LOCALE) {
  const allBlogPosts: CollectionEntry<'posts'>[] = await getCollection(
    'posts',
    ({ data }: { data: { draft?: boolean } }) => {
      return import.meta.env.PROD ? data.draft !== true : true
    }
  )

  const sorted = filterPostsByLocale(allBlogPosts, locale).sort(
    (a: CollectionEntry<'posts'>, b: CollectionEntry<'posts'>) => {
      const aPin = a.data.pin ? 1 : 0
      const bPin = b.data.pin ? 1 : 0
      if (aPin !== bPin) return bPin - aPin
      const dateA = new Date(a.data.published)
      const dateB = new Date(b.data.published)
      return dateA > dateB ? -1 : 1
    }
  )
  return sorted
}

export async function getSortedPosts(locale: Locale = DEFAULT_LOCALE) {
  return linkPostNeighbors(await getRawSortedPosts(locale))
}
export type PostForList = {
  slug: string
  data: CollectionEntry<'posts'>['data']
}
export async function getSortedPostsList(locale: Locale = DEFAULT_LOCALE): Promise<PostForList[]> {
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
  latestPublished: Date
}

export async function getTagList(locale: Locale = DEFAULT_LOCALE): Promise<Tag[]> {
  const allBlogPosts = await getRawSortedPosts(locale)
  const tags = new Map<string, { count: number; latestPublished: Date }>()

  allBlogPosts.forEach((post: CollectionEntry<'posts'>) => {
    post.data.tags.forEach((tag: string) => {
      const current = tags.get(tag)
      tags.set(tag, {
        count: (current?.count ?? 0) + 1,
        latestPublished:
          !current || post.data.published > current.latestPublished
            ? post.data.published
            : current.latestPublished,
      })
    })
  })

  return [...tags.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((left, right) => left.name.localeCompare(right.name, locale))
}

export type Category = {
  key: PostCategory
  name: string
  count: number
  url: string
}

export type Series = {
  name: string
  posts: CollectionEntry<'posts'>[]
}

export async function getCategoryList(locale: Locale = DEFAULT_LOCALE): Promise<Category[]> {
  const allBlogPosts = await getRawSortedPosts(locale)
  const counts = new Map<PostCategory, number>(POST_CATEGORY_KEYS.map((key) => [key, 0]))

  allBlogPosts.forEach((post) => {
    counts.set(post.data.category, (counts.get(post.data.category) ?? 0) + 1)
  })

  return POST_CATEGORY_KEYS.map((key) => ({
    key,
    name: getCategoryLabel(key, locale),
    count: counts.get(key) ?? 0,
    url: getCategoryUrl(key, locale),
  }))
}

export async function getCategoryPosts(
  category: PostCategory,
  locale: Locale = DEFAULT_LOCALE
): Promise<CollectionEntry<'posts'>[]> {
  return (await getRawSortedPosts(locale)).filter((post) => post.data.category === category)
}

export async function getTagPosts(
  tag: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<CollectionEntry<'posts'>[]> {
  return (await getRawSortedPosts(locale)).filter((post) => post.data.tags.includes(tag))
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
