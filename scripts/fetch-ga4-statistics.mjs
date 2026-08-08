import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import {
  buildStatistics,
  createEmptyStatistics,
  isStatisticsData,
  STATISTICS_RANGES,
} from './statistics-lib.mjs'

const DIST_DIR = resolve('dist')
const CONTENT_FILE = resolve(DIST_DIR, 'statistics-content.json')
const OUTPUT_FILE = resolve(DIST_DIR, 'statistics.json')
const FALLBACK_URL = 'https://xnnehang.top/statistics.json'

async function loadCredentials() {
  if (process.env.GA4_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON)
  }

  if (process.env.GA4_SERVICE_ACCOUNT_FILE) {
    return JSON.parse(await readFile(process.env.GA4_SERVICE_ACCOUNT_FILE, 'utf8'))
  }

  throw new Error('GA4 credentials are not configured')
}

async function readContentCatalog() {
  return JSON.parse(await readFile(CONTENT_FILE, 'utf8'))
}

function metricsFromResponse(response) {
  const row = response.rows?.[0]
  return {
    activeUsers: Number(row?.metricValues?.[0]?.value ?? 0),
    screenPageViews: Number(row?.metricValues?.[1]?.value ?? 0),
    engagementSeconds: Number(row?.metricValues?.[2]?.value ?? 0),
  }
}

async function fetchStatistics(content) {
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

  const [siteResponse] = await client.runReport({
    property,
    dateRanges: [{ startDate: STATISTICS_RANGES.all, endDate: 'today' }],
    metrics,
  })

  return buildStatistics(content, rangeRows, metricsFromResponse(siteResponse))
}

async function fetchFallback() {
  const response = await fetch(FALLBACK_URL, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`Fallback returned ${response.status}`)

  const data = await response.json()
  if (!isStatisticsData(data)) throw new Error('Fallback data has an invalid schema')
  return { ...data, status: data.status === 'empty' ? 'empty' : 'fallback' }
}

async function main() {
  const content = await readContentCatalog()
  let statistics

  try {
    statistics = await fetchStatistics(content)
    console.log('Generated live GA4 statistics')
  } catch (error) {
    console.warn(`GA4 statistics unavailable: ${error.message}`)

    try {
      statistics = await fetchFallback()
      statistics.content = createEmptyStatistics(content).content
      console.log('Reused the last published statistics snapshot')
    } catch (fallbackError) {
      console.warn(`Published fallback unavailable: ${fallbackError.message}`)
      statistics = createEmptyStatistics(content)
      console.log('Generated an empty statistics snapshot')
    }
  }

  await writeFile(OUTPUT_FILE, `${JSON.stringify(statistics, null, 2)}\n`)
}

await main()
