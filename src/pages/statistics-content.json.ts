import { getCollection, render, type CollectionEntry } from 'astro:content'
import type {
  StatisticsContentCatalog,
  StatisticsContentPost,
  StatisticsPublicationMonth,
} from '@/types/statistics'

export async function GET(): Promise<Response> {
  const entries = await getCollection('posts', ({ data }: CollectionEntry<'posts'>) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  const posts: StatisticsContentPost[] = await Promise.all(
    entries.map(async (entry) => {
      const { remarkPluginFrontmatter } = await render(entry)

      return {
        title: entry.data.title,
        path: `/posts/${entry.id}/`,
        published: entry.data.published.toISOString().slice(0, 10),
        words: Number(remarkPluginFrontmatter.words) || 0,
        estimatedMinutes: Number(remarkPluginFrontmatter.minutes) || 0,
      }
    })
  )

  posts.sort((a, b) => b.published.localeCompare(a.published))

  const publicationMap = new Map<string, number>()
  for (const post of posts) {
    const month = post.published.slice(0, 7)
    publicationMap.set(month, (publicationMap.get(month) ?? 0) + 1)
  }

  const publications: StatisticsPublicationMonth[] = [...publicationMap]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  const catalog: StatisticsContentCatalog = {
    posts,
    totals: {
      postCount: posts.length,
      totalWords: posts.reduce((sum, post) => sum + post.words, 0),
      publications,
    },
  }

  return new Response(JSON.stringify(catalog), {
    headers: { 'Content-Type': 'application/json' },
  })
}
