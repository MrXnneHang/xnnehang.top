export const STATISTICS_RANGES = {
  '7d': '7daysAgo',
  '30d': '30daysAgo',
  '90d': '90daysAgo',
  all: '2020-01-01',
}

const DAY_MS = 24 * 60 * 60 * 1000
const UNCATEGORIZED = '未分类'
const OTHER_CATEGORY = '其他'

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

function dateFromKey(value) {
  return new Date(`${value}T00:00:00.000Z`)
}

function dateKey(value) {
  return value.toISOString().slice(0, 10)
}

function addDays(value, days) {
  return new Date(value.getTime() + days * DAY_MS)
}

function dayDifference(start, end) {
  return Math.round((dateFromKey(end).getTime() - dateFromKey(start).getTime()) / DAY_MS)
}

function monthRange(first, last) {
  if (!first || !last) return []
  const start = dateFromKey(`${first.slice(0, 7)}-01`)
  const end = dateFromKey(`${last.slice(0, 7)}-01`)
  const months = []

  for (
    let cursor = start;
    cursor <= end;
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  ) {
    months.push(dateKey(cursor).slice(0, 7))
  }
  return months
}

function trailPost(post) {
  return {
    title: post.title,
    path: post.path,
    published: post.published,
    words: numeric(post.words),
  }
}

function median(values) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? average(sorted[middle - 1] + sorted[middle], 2) : sorted[middle]
}

function buildRhythm(dailyPublications) {
  const dates = dailyPublications.map((day) => day.date)
  if (dates.length === 0) {
    return {
      firstPublished: null,
      lastPublished: null,
      spanDays: 0,
      publishingDays: 0,
      medianIntervalDays: 0,
      densest30Days: { start: null, end: null, count: 0 },
      longestGapDays: 0,
    }
  }

  const intervals = dates.slice(1).map((date, index) => dayDifference(dates[index], date))
  let densest = { start: dates[0], end: dateKey(addDays(dateFromKey(dates[0]), 29)), count: 0 }
  let endIndex = 0
  let runningCount = 0

  for (let startIndex = 0; startIndex < dailyPublications.length; startIndex += 1) {
    if (endIndex < startIndex) {
      endIndex = startIndex
      runningCount = 0
    }
    const windowEnd = addDays(dateFromKey(dailyPublications[startIndex].date), 29)
    while (
      endIndex < dailyPublications.length &&
      dateFromKey(dailyPublications[endIndex].date) <= windowEnd
    ) {
      runningCount += dailyPublications[endIndex].count
      endIndex += 1
    }
    if (runningCount > densest.count) {
      densest = {
        start: dailyPublications[startIndex].date,
        end: dateKey(windowEnd),
        count: runningCount,
      }
    }
    runningCount -= dailyPublications[startIndex].count
  }

  return {
    firstPublished: dates[0],
    lastPublished: dates.at(-1),
    spanDays: dayDifference(dates[0], dates.at(-1)) + 1,
    publishingDays: dates.length,
    medianIntervalDays: median(intervals),
    densest30Days: densest,
    longestGapDays: intervals.length > 0 ? Math.max(...intervals) : 0,
  }
}

export function buildContentTotals(inputPosts = []) {
  const posts = [...inputPosts].sort(
    (a, b) => a.published.localeCompare(b.published) || a.path.localeCompare(b.path)
  )
  const firstPublished = posts[0]?.published ?? null
  const lastPublished = posts.at(-1)?.published ?? null
  const months = monthRange(firstPublished, lastPublished)

  const dailyMap = new Map()
  const monthlyMap = new Map(
    months.map((month) => [month, { month, postCount: 0, words: 0, estimatedMinutes: 0 }])
  )
  const categoryCounts = new Map()
  const categoryMonthMaps = new Map(months.map((month) => [month, new Map()]))
  const seriesMap = new Map()

  for (const post of posts) {
    const postDate = post.published
    const month = postDate.slice(0, 7)
    const day = dailyMap.get(postDate) ?? { date: postDate, count: 0, posts: [] }
    day.count += 1
    day.posts.push(trailPost(post))
    dailyMap.set(postDate, day)

    const monthly = monthlyMap.get(month)
    if (monthly) {
      monthly.postCount += 1
      monthly.words += numeric(post.words)
      monthly.estimatedMinutes += numeric(post.estimatedMinutes)
    }

    const category = String(post.category || '').trim() || UNCATEGORIZED
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    const monthCategories = categoryMonthMaps.get(month)
    monthCategories?.set(category, (monthCategories.get(category) ?? 0) + 1)

    for (const rawSeries of Array.isArray(post.series) ? post.series : []) {
      const name = String(rawSeries).trim()
      if (!name) continue
      const series = seriesMap.get(name) ?? { name, posts: [] }
      series.posts.push(trailPost(post))
      seriesMap.set(name, series)
    }
  }

  const dailyPublications = [...dailyMap.values()]
  const monthlyOutput = [...monthlyMap.values()]
  const rankedCategories = [...categoryCounts]
    .sort(
      ([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB, 'zh-CN')
    )
    .map(([name]) => name)
  const categories =
    rankedCategories.length > 8
      ? [...rankedCategories.slice(0, 7), OTHER_CATEGORY]
      : rankedCategories
  const visibleCategorySet = new Set(categories)
  const categoryMonths = months.map((month) => {
    const rawValues = categoryMonthMaps.get(month) ?? new Map()
    const mappedValues = new Map(categories.map((category) => [category, 0]))
    for (const [category, count] of rawValues) {
      const target = visibleCategorySet.has(category) ? category : OTHER_CATEGORY
      mappedValues.set(target, (mappedValues.get(target) ?? 0) + count)
    }
    const total = [...mappedValues.values()].reduce((sum, count) => sum + count, 0)
    const values = categories.map((category) => {
      const count = mappedValues.get(category) ?? 0
      return { category, count, share: average(count * 100, total) }
    })
    if (total > 0 && values.length > 0) {
      const remainder =
        Math.round((100 - values.reduce((sum, value) => sum + value.share, 0)) * 100) / 100
      const lastNonEmpty = values.findLast((value) => value.count > 0)
      if (lastNonEmpty)
        lastNonEmpty.share = Math.round((lastNonEmpty.share + remainder) * 100) / 100
    }
    return { month, total, values }
  })
  const seriesLifelines = [...seriesMap.values()]
    .map((series) => ({
      name: series.name,
      firstPublished: series.posts[0].published,
      lastPublished: series.posts.at(-1).published,
      postCount: series.posts.length,
      totalWords: series.posts.reduce((sum, post) => sum + post.words, 0),
      posts: series.posts,
    }))
    .sort(
      (a, b) =>
        b.lastPublished.localeCompare(a.lastPublished) || a.name.localeCompare(b.name, 'zh-CN')
    )

  return {
    postCount: posts.length,
    totalWords: posts.reduce((sum, post) => sum + numeric(post.words), 0),
    publications: monthlyOutput
      .filter((item) => item.postCount > 0)
      .map((item) => ({ month: item.month, count: item.postCount })),
    dailyPublications,
    monthlyOutput,
    categoryEvolution: { categories, months: categoryMonths },
    seriesLifelines,
    rhythm: buildRhythm(dailyPublications),
  }
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
  const totals = content.totals ?? {}
  const defaults = buildContentTotals([])
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
      ...defaults,
      ...totals,
      postCount: numeric(totals.postCount),
      totalWords: numeric(totals.totalWords),
      publications: Array.isArray(totals.publications) ? totals.publications : [],
      dailyPublications: Array.isArray(totals.dailyPublications) ? totals.dailyPublications : [],
      monthlyOutput: Array.isArray(totals.monthlyOutput) ? totals.monthlyOutput : [],
      categoryEvolution: totals.categoryEvolution ?? defaults.categoryEvolution,
      seriesLifelines: Array.isArray(totals.seriesLifelines) ? totals.seriesLifelines : [],
      rhythm: totals.rhythm ?? defaults.rhythm,
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
