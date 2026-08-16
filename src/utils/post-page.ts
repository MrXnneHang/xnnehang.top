import { render, type CollectionEntry } from 'astro:content'
import { DEFAULT_LOCALE, type Locale } from '../i18n/locales'
import { getSortedPosts } from './content-utils'
import { getMiniGraph, serializeWikiGraphWithTitles } from './graph-serialize'
import { getPostRouteSlug } from './post-locale'
import { buildTfidfIndex, getRelatedByTfidf } from './tfidf'
import { buildWikiGraphWithTitles } from './wikilinks'

export type PostForSeries = {
  slug: string
  sourceId: string
  data: CollectionEntry<'posts'>['data']
}

export type RelatedPost = PostForSeries & {
  firstImage: string
}

export interface LocalizedPostPageProps {
  entry: CollectionEntry<'posts'>
  allPosts: PostForSeries[]
  relatedPosts: RelatedPost[]
  miniGraphData: ReturnType<typeof getMiniGraph>
  locale: Locale
}

export async function getLocalizedPostStaticPaths(locale: Locale = DEFAULT_LOCALE) {
  const blogEntries = await getSortedPosts(locale)
  const [tfidfIndex, wikiGraphResult] = await Promise.all([
    buildTfidfIndex(locale),
    buildWikiGraphWithTitles(locale),
  ])
  const serializedGraph = serializeWikiGraphWithTitles(
    wikiGraphResult.graph,
    wikiGraphResult.slugToTitle,
    wikiGraphResult.slugToMetadata
  )

  const allPosts: PostForSeries[] = blogEntries.map((post) => ({
    slug: getPostRouteSlug(post),
    sourceId: post.id,
    data: post.data,
  }))

  return Promise.all(
    blogEntries.map(async (entry) => {
      const routeSlug = getPostRouteSlug(entry)
      const relatedPosts = getRelatedByTfidf(routeSlug, tfidfIndex, 5)
      const miniGraphData = getMiniGraph(serializedGraph, routeSlug)

      const relatedWithImg = await Promise.all(
        relatedPosts.map(async (related) => {
          const full = blogEntries.find((post) => post.id === related.sourceId)
          if (!full) return { ...related, firstImage: '' }

          const { remarkPluginFrontmatter } = await render(full)
          return { ...related, firstImage: remarkPluginFrontmatter.firstImage || '' }
        })
      )

      return {
        params: { slug: routeSlug },
        props: {
          entry,
          allPosts,
          relatedPosts: relatedWithImg,
          miniGraphData,
          locale,
        } satisfies LocalizedPostPageProps,
      }
    })
  )
}
