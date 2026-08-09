import { getCollection } from 'astro:content'
import { getPostCoverSource } from './cover'
import { optimizePostCover } from './cover-optimize'
import { WIKI_LINK_REGEX } from './wiki-regex'

export type WikiLinkInfo = {
  resolved: { title: string; slug: string }[]
  unresolved: string[]
}

export type WikiGraph = Map<
  string,
  { outbound: WikiLinkInfo; inbound: { slug: string; title: string }[] }
>

export type WikiGraphMetadata = {
  title: string
  description: string
  published: string
  category: string
  tags: string[]
  cover: string
}

/**
 * Build the wiki link graph from all post bodies.
 * Runs at build time in getStaticPaths.
 */
export type WikiGraphResult = {
  graph: WikiGraph
  slugToTitle: Map<string, string>
  slugToMetadata: Map<string, WikiGraphMetadata>
}

/**
 * Build the wiki link graph and also return the slug→title map.
 * Used by graph serialization to get accurate titles.
 */
export async function buildWikiGraphWithTitles(): Promise<WikiGraphResult> {
  const allPosts = await getCollection('posts', ({ data }: { data: { draft?: boolean } }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  const titleToSlug = new Map<string, string>()
  const slugToTitle = new Map<string, string>()
  const slugToMetadata = new Map<string, WikiGraphMetadata>()
  for (const post of allPosts) {
    const title = post.data.title.trim()
    if (title) {
      titleToSlug.set(title.toLowerCase(), post.id)
      slugToTitle.set(post.id, title)
      slugToMetadata.set(post.id, {
        title,
        description: post.data.description,
        published: post.data.published.toISOString().slice(0, 10),
        category: post.data.category?.trim() || '未分类',
        tags: post.data.tags,
        cover: await optimizePostCover(
          getPostCoverSource(post.data.image, post.body),
          post.id
        ),
      })
    }
  }

  const graph: WikiGraph = new Map()
  const regex = WIKI_LINK_REGEX

  for (const post of allPosts) {
    if (!post.body) continue

    const resolved: { title: string; slug: string }[] = []
    const unresolved: string[] = []
    const seen = new Set<string>()

    let match
    regex.lastIndex = 0
    while ((match = regex.exec(post.body)) !== null) {
      const title = match[1].trim()
      if (seen.has(title)) continue
      seen.add(title)

      const slug = titleToSlug.get(title.toLowerCase())
      if (slug) {
        resolved.push({ title, slug })
      } else {
        unresolved.push(title)
      }
    }

    graph.set(post.id, {
      outbound: { resolved, unresolved },
      inbound: [],
    })
  }

  for (const [slug, data] of graph) {
    for (const link of data.outbound.resolved) {
      const targetGraph = graph.get(link.slug)
      if (targetGraph) {
        targetGraph.inbound.push({ slug, title: slugToTitle.get(slug) || '' })
      }
    }
  }

  return { graph, slugToTitle, slugToMetadata }
}
