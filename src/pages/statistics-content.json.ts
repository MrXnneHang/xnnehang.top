import { getCollection, render, type CollectionEntry } from 'astro:content'
import type { StatisticsContentCatalog, StatisticsContentPost } from '@/types/statistics'
import { getGitFileInfo } from '@utils/git-utils'
import { buildContentTotals } from '../../scripts/statistics-lib.mjs'

export async function GET(): Promise<Response> {
  const entries = await getCollection('posts', ({ data }: CollectionEntry<'posts'>) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  const posts: StatisticsContentPost[] = await Promise.all(
    entries.map(async (entry) => {
      const { remarkPluginFrontmatter } = await render(entry)
      const gitInfo = getGitFileInfo(entry.filePath)

      return {
        title: entry.data.title,
        path: `/posts/${entry.id}/`,
        published: entry.data.published.toISOString().slice(0, 10),
        words: Number(remarkPluginFrontmatter.words) || 0,
        estimatedMinutes: Number(remarkPluginFrontmatter.minutes) || 0,
        category: entry.data.category?.trim() || '未分类',
        series: entry.data.series.map((name) => name.trim()).filter(Boolean),
        editCount: gitInfo.editCount,
        lastModified: gitInfo.lastModified?.toISOString() ?? null,
      }
    })
  )

  posts.sort((a, b) => b.published.localeCompare(a.published) || a.path.localeCompare(b.path))

  const catalog: StatisticsContentCatalog = {
    posts,
    totals: buildContentTotals(posts),
  }

  return new Response(JSON.stringify(catalog), {
    headers: { 'Content-Type': 'application/json' },
  })
}
