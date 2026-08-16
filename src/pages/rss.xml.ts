import type { APIContext } from 'astro'
import { DEFAULT_LOCALE } from '@/i18n/locales'
import { buildRssResponse } from '@/utils/rss'

export function GET(context: APIContext): Promise<Response> {
  return buildRssResponse(context, DEFAULT_LOCALE)
}
