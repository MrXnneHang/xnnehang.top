import type { APIRoute } from 'astro'
import { buildWikiGraphWithTitles } from '@utils/wikilinks'
import { serializeWikiGraphWithTitles } from '@utils/graph-serialize'

export const GET: APIRoute = async () => {
  const { graph, slugToTitle, slugToMetadata } = await buildWikiGraphWithTitles()
  const serialized = serializeWikiGraphWithTitles(graph, slugToTitle, slugToMetadata)

  return new Response(JSON.stringify(serialized), {
    headers: { 'Content-Type': 'application/json' },
  })
}
