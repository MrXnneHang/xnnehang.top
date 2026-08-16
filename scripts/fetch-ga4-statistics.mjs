import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import {
  buildLocaleDimensionFilter,
  buildStatistics,
  createEmptyStatistics,
  isStatisticsData,
  STATISTICS_RANGES,
} from './statistics-lib.mjs'

const DIST_DIR = resolve('dist')
const LOCALES = {
  'zh-CN': {
    contentFile: resolve(DIST_DIR, 'statistics-content.json'),
    outputFile: resolve(DIST_DIR, 'statistics.json'),
    fallbackUrl: 'https://xnnehang.top/statistics.json',
  },
  en: {
    contentFile: resolve(DIST_DIR, 'en/statistics-content.json'),
    outputFile: resolve(DIST_DIR, 'en/statistics.json'),
    fallbackUrl: 'https://xnnehang.top/en/statistics.json',
  },
}

async function loadCredentials() {
  if (process.env.GA4_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON)
  }

  if (process.env.GA4_SERVICE_ACCOUNT_FILE) {
    return JSON.parse(await readFile(process.env.GA4_SERVICE_ACCOUNT_FILE, 'utf8'))
  }

  throw new Error('GA4 credentials are not configured')
}

async function readContentCatalog(contentFile) {
  return JSON.parse(await readFile(contentFile, 'utf8'))
}

function metricsFromResponse(response) {
  const row = response.rows?.[0]
  return {
    activeUsers: Number(row?.metricValues?.[0]?.value ?? 0),
    screenPageViews: Number(row?.metricValues?.[1]?.value ?? 0),
    engagementSeconds: Number(row?.metricValues?.[2]?.value ?? 0),
  }
}

async function fetchAnalytics() {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) throw new Error('GA4_PROPERTY_ID is not configured')

  const credentials = await loadCredentials()
  const client = new BetaAnalyticsDataClient({ credentials })
  const property = `properties/${propertyId}`
  const metrics = [
    { name: 'activeUsers' },
    { name: 'screenPageViews' },
    { name: 'userEngagementDuration' },
  ]

  const rangeRows = {}
  for (const [range, startDate] of Object.entries(STATISTICS_RANGES)) {
    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics,
      limit: 100000,
    })
    rangeRows[range] = response.rows ?? []
  }

  const siteMetrics = {}
  for (const locale of Object.keys(LOCALES)) {
    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate: STATISTICS_RANGES.all, endDate: 'today' }],
      dimensionFilter: buildLocaleDimensionFilter(locale),
      metrics,
    })
    siteMetrics[locale] = metricsFromResponse(response)
  }

  return { rangeRows, siteMetrics }
}

async function fetchFallback(locale, fallbackUrl) {
  const response = await fetch(fallbackUrl, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`Fallback returned ${response.status}`)

  const data = await response.json()
  if (!isStatisticsData(data, locale)) {
    throw new Error(`Fallback data has an invalid schema or locale (expected ${locale})`)
  }
  return { ...data, status: data.status === 'empty' ? 'empty' : 'fallback' }
}

async function writeStatistics(outputFile, statistics) {
  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(statistics, null, 2)}\n`)
}

async function main() {
  const catalogs = Object.fromEntries(
    await Promise.all(
      Object.entries(LOCALES).map(async ([locale, config]) => [
        locale,
        await readContentCatalog(config.contentFile),
      ])
    )
  )

  let analytics = null
  try {
    analytics = await fetchAnalytics()
    console.log('Fetched live GA4 statistics')
  } catch (error) {
    console.warn(`GA4 statistics unavailable: ${error.message}`)
  }

  for (const [locale, config] of Object.entries(LOCALES)) {
    const content = catalogs[locale]
    let statistics

    if (analytics) {
      statistics = buildStatistics(
        content,
        analytics.rangeRows,
        analytics.siteMetrics[locale],
        locale
      )
      console.log(`Generated live GA4 statistics for ${locale}`)
    } else {
      try {
        statistics = await fetchFallback(locale, config.fallbackUrl)
        statistics.content = createEmptyStatistics(content, locale).content
        console.log(`Reused the last published ${locale} statistics snapshot`)
      } catch (fallbackError) {
        console.warn(`${locale} published fallback unavailable: ${fallbackError.message}`)
        statistics = createEmptyStatistics(content, locale)
        console.log(`Generated an empty ${locale} statistics snapshot`)
      }
    }

    await writeStatistics(config.outputFile, statistics)
  }
}

await main()
