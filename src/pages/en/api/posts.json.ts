import { getCollection, type CollectionEntry } from 'astro:content'
import { ENGLISH_LOCALE } from '@/i18n/locales'
import { createFeaturedPostsResponse } from '@/utils/featured-posts'

type Post = CollectionEntry<'posts'>

export async function GET(): Promise<Response> {
  const posts = await getCollection('posts', ({ data }: Post) => data.draft !== true)
  return createFeaturedPostsResponse(posts, ENGLISH_LOCALE)
}
