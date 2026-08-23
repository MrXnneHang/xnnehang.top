import { getCollection, render, type CollectionEntry } from 'astro:content'
import type { Locale } from '@/i18n/locales'
import type { StatisticsContentCatalog, StatisticsContentPost } from '@/types/statistics'
import { buildContentTotals } from '../../scripts/statistics-lib.mjs'
import { getGitFileInfo } from './git-utils'
import { filterPostsByLocale, getPostRouteSlug } from './post-locale'
import { getPostUrlBySlug } from './url-utils'

export async function buildStatisticsContentCatalog(
  locale: Locale
): Promise<StatisticsContentCatalog> {
  const entries = await getCollection('posts', ({ data }: CollectionEntry<'posts'>) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })
  const localizedEntries = filterPostsByLocale(entries, locale)

  const posts: StatisticsContentPost[] = await Promise.all(
    localizedEntries.map(async (entry) => {
      const { remarkPluginFrontmatter } = await render(entry)
      const gitInfo = getGitFileInfo(entry.filePath)

      return {
        title: entry.data.title,
        path: getPostUrlBySlug(getPostRouteSlug(entry), locale),
        published: entry.data.published.toISOString().slice(0, 10),
        words: Number(remarkPluginFrontmatter.words) || 0,
        estimatedMinutes: Number(remarkPluginFrontmatter.minutes) || 0,
        category: entry.data.category,
        kind: entry.data.kind,
        series: entry.data.series.map((name) => name.trim()).filter(Boolean),
        editCount: gitInfo.editCount,
        lastModified: gitInfo.lastModified?.toISOString() ?? null,
      }
    })
  )

  posts.sort((a, b) => b.published.localeCompare(a.published) || a.path.localeCompare(b.path))

  return {
    posts,
    totals: buildContentTotals(posts, locale),
  }
}
