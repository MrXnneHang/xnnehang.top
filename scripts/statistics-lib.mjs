export const STATISTICS_RANGES = {
  '7d': '7daysAgo',
  '30d': '30daysAgo',
  '90d': '90daysAgo',
  all: '2020-01-01',
}

export function normalizePagePath(value) {
  if (!value) return '/'

  const raw = String(value)
  let pathname
  try {
    pathname = /^https?:\/\//i.test(raw) ? new URL(raw).pathname : raw.split(/[?#]/, 1)[0]
  } catch {
    pathname = raw.split(/[?#]/, 1)[0]
  }

  pathname = pathname.replace(/\/{2,}/g, '/')
  if (!pathname.startsWith('/')) pathname = `/${pathname}`
  if (pathname !== '/' && !pathname.endsWith('/')) pathname = `${pathname}/`
  return pathname
}

function numeric(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function mergeAnalyticsRows(rows = []) {
  const merged = new Map()

  for (const row of rows) {
    const path = normalizePagePath(row.dimensionValues?.[0]?.value)
    const metrics = row.metricValues ?? []
    const current = merged.get(path) ?? {
      activeUsers: 0,
      screenPageViews: 0,
      engagementSeconds: 0,
    }

    current.activeUsers += numeric(metrics[0]?.value)
    current.screenPageViews += numeric(metrics[1]?.value)
    current.engagementSeconds += numeric(metrics[2]?.value)
    merged.set(path, current)
  }

  return merged
}

export function average(numerator, denominator) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100) / 100
}

export function createEmptyStatistics(content = { posts: [], totals: {} }) {
  return {
    version: 1,
    generatedAt: null,
    status: 'empty',
    source: 'ga4',
    site: {
      activeUsers: 0,
      screenPageViews: 0,
      engagementSeconds: 0,
      engagementSecondsPerUser: 0,
    },
    content: {
      postCount: numeric(content.totals?.postCount),
      totalWords: numeric(content.totals?.totalWords),
      publications: Array.isArray(content.totals?.publications) ? content.totals.publications : [],
    },
    ranges: { '7d': [], '30d': [], '90d': [], all: [] },
  }
}

export function isStatisticsData(value) {
  if (!value || typeof value !== 'object') return false
  if (value.version !== 1 || value.source !== 'ga4') return false
  if (!value.site || !value.content || !value.ranges) return false
  return ['7d', '30d', '90d', 'all'].every((range) => Array.isArray(value.ranges[range]))
}

export function buildStatistics(content, rangeRows, siteMetrics) {
  const output = createEmptyStatistics(content)
  const contentByPath = new Map(
    content.posts.map((post) => [normalizePagePath(post.path), { ...post }])
  )

  output.generatedAt = new Date().toISOString()
  output.status = 'live'
  output.site = {
    activeUsers: numeric(siteMetrics.activeUsers),
    screenPageViews: numeric(siteMetrics.screenPageViews),
    engagementSeconds: numeric(siteMetrics.engagementSeconds),
    engagementSecondsPerUser: average(
      numeric(siteMetrics.engagementSeconds),
      numeric(siteMetrics.activeUsers)
    ),
  }

  for (const range of Object.keys(STATISTICS_RANGES)) {
    const analyticsByPath = mergeAnalyticsRows(rangeRows[range])

    output.ranges[range] = [...analyticsByPath]
      .filter(([path]) => contentByPath.has(path))
      .map(([path, metrics]) => ({
        ...contentByPath.get(path),
        ...metrics,
        engagementSecondsPerView: average(metrics.engagementSeconds, metrics.screenPageViews),
      }))
      .sort((a, b) => b.screenPageViews - a.screenPageViews)
  }

  return output
}
