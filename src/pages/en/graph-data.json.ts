import type { APIRoute } from 'astro'
import { ENGLISH_LOCALE } from '@/i18n/locales'
import { serializeWikiGraphWithTitles } from '@/utils/graph-serialize'
import { buildWikiGraphWithTitles } from '@/utils/wikilinks'

export const GET: APIRoute = async () => {
  const { graph, slugToTitle, slugToMetadata } = await buildWikiGraphWithTitles(ENGLISH_LOCALE)
  const serialized = serializeWikiGraphWithTitles(graph, slugToTitle, slugToMetadata)

  return new Response(JSON.stringify(serialized), {
    headers: { 'Content-Type': 'application/json' },
  })
}
