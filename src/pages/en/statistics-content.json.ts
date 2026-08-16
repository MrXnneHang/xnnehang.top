import { ENGLISH_LOCALE } from '@/i18n/locales'
import { buildStatisticsContentCatalog } from '@/utils/statistics-content'

export async function GET(): Promise<Response> {
  const catalog = await buildStatisticsContentCatalog(ENGLISH_LOCALE)
  return new Response(JSON.stringify(catalog), {
    headers: { 'Content-Type': 'application/json' },
  })
}
