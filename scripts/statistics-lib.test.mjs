import assert from 'node:assert/strict'
import test from 'node:test'
import {
  average,
  buildContentTotals,
  buildLocaleDimensionFilter,
  buildStatistics,
  createEmptyStatistics,
  isEnglishPagePath,
  isStatisticsData,
  mergeAnalyticsRows,
  normalizePagePath,
} from './statistics-lib.mjs'

const contentPost = (overrides = {}) => ({
  title: 'Example',
  path: '/posts/example/',
  published: '2026-01-01',
  words: 1200,
  estimatedMinutes: 5,
  category: '思考',
  series: [],
  editCount: 1,
  lastModified: '2026-01-02T00:00:00.000Z',
  ...overrides,
})

test('normalizes GA4 page paths', () => {
  assert.equal(normalizePagePath('/posts/example'), '/posts/example/')
  assert.equal(normalizePagePath('https://xnnehang.top/posts/example/?ref=test'), '/posts/example/')
  assert.equal(normalizePagePath('//posts//example#heading'), '/posts/example/')
  assert.equal(normalizePagePath('/'), '/')
  assert.equal(normalizePagePath('/en'), '/en/')
  assert.equal(isEnglishPagePath('/en'), true)
  assert.equal(isEnglishPagePath('/en/posts/example/'), true)
  assert.equal(isEnglishPagePath('/english/'), false)
  assert.equal(isEnglishPagePath('/posts/example/'), false)
})

test('builds complementary GA4 locale filters', () => {
  const english = buildLocaleDimensionFilter('en')
  const chinese = buildLocaleDimensionFilter('zh-CN')

  assert.equal(english.filter.fieldName, 'pagePath')
  assert.equal(english.filter.stringFilter.value, '^/en(?:/.*)?$')
  assert.deepEqual(chinese, { notExpression: english })
})

test('merges duplicate rows and coerces metrics', () => {
  const rows = [
    {
      dimensionValues: [{ value: '/posts/example/' }],
      metricValues: [{ value: '2' }, { value: '3' }, { value: '12.5' }],
    },
    {
      dimensionValues: [{ value: '/posts/example' }],
      metricValues: [{ value: '1' }, { value: '2' }, { value: '7.5' }],
    },
  ]

  assert.deepEqual(mergeAnalyticsRows(rows).get('/posts/example/'), {
    activeUsers: 3,
    screenPageViews: 5,
    engagementSeconds: 20,
  })
})

test('calculates rounded averages safely', () => {
  assert.equal(average(10, 4), 2.5)
  assert.equal(average(1, 3), 0.33)
  assert.equal(average(10, 0), 0)
})

test('builds chronological buckets including zero months', () => {
  const totals = buildContentTotals([
    contentPost(),
    contentPost({
      title: 'Second',
      path: '/posts/second/',
      published: '2026-03-04',
      words: 800,
      estimatedMinutes: 3,
    }),
    contentPost({
      title: 'Third',
      path: '/posts/third/',
      published: '2025-12-31',
      words: 500,
      estimatedMinutes: 2,
    }),
  ])

  assert.deepEqual(
    totals.monthlyOutput.map(({ month, postCount }) => ({ month, postCount })),
    [
      { month: '2025-12', postCount: 1 },
      { month: '2026-01', postCount: 1 },
      { month: '2026-02', postCount: 0 },
      { month: '2026-03', postCount: 1 },
    ]
  )
  assert.equal(totals.dailyPublications[0].date, '2025-12-31')
  assert.equal(totals.totalWords, 2500)
})

test('calculates publication rhythm by distinct publication days', () => {
  const totals = buildContentTotals([
    contentPost({ title: 'A', path: '/posts/a/', published: '2026-01-01' }),
    contentPost({ title: 'B', path: '/posts/b/', published: '2026-01-01' }),
    contentPost({ title: 'C', path: '/posts/c/', published: '2026-01-11' }),
    contentPost({ title: 'D', path: '/posts/d/', published: '2026-01-31' }),
    contentPost({ title: 'E', path: '/posts/e/', published: '2026-03-02' }),
  ])

  assert.equal(totals.rhythm.publishingDays, 4)
  assert.equal(totals.rhythm.medianIntervalDays, 20)
  assert.equal(totals.rhythm.longestGapDays, 30)
  assert.deepEqual(totals.rhythm.densest30Days, {
    start: '2026-01-01',
    end: '2026-01-30',
    count: 3,
  })
})

test('folds excess categories and preserves monthly count and share totals', () => {
  const categories = ['', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
  const totals = buildContentTotals(
    categories.map((category, index) =>
      contentPost({
        title: `Post ${index}`,
        path: `/posts/${index}/`,
        category,
      })
    )
  )
  const month = totals.categoryEvolution.months[0]

  assert.equal(totals.categoryEvolution.categories.length, 8)
  assert.ok(totals.categoryEvolution.categories.includes('未分类'))
  assert.ok(totals.categoryEvolution.categories.includes('其他'))
  assert.equal(
    month.values.reduce((sum, value) => sum + value.count, 0),
    9
  )
  assert.equal(
    month.values.reduce((sum, value) => sum + value.share, 0),
    100
  )
})

test('localizes uncategorized and other category labels', () => {
  const categories = ['', '', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
  const totals = buildContentTotals(
    categories.map((category, index) =>
      contentPost({
        title: `Post ${index}`,
        path: `/en/posts/${index}/`,
        category,
      })
    ),
    'en'
  )

  assert.ok(totals.categoryEvolution.categories.includes('Uncategorized'))
  assert.ok(totals.categoryEvolution.categories.includes('Other'))
  assert.ok(!totals.categoryEvolution.categories.includes('未分类'))
  assert.ok(!totals.categoryEvolution.categories.includes('其他'))
})

test('adds posts to multiple series without double-counting site totals', () => {
  const totals = buildContentTotals([
    contentPost({ series: ['Alpha', 'Beta'] }),
    contentPost({
      title: 'Second',
      path: '/posts/second/',
      published: '2026-02-01',
      words: 300,
      series: ['Alpha'],
    }),
  ])

  assert.equal(totals.postCount, 2)
  assert.equal(totals.totalWords, 1500)
  assert.equal(totals.seriesLifelines.find((series) => series.name === 'Alpha').postCount, 2)
  assert.equal(totals.seriesLifelines.find((series) => series.name === 'Beta').postCount, 1)
})

test('builds post ranges and filters unknown paths', () => {
  const posts = [contentPost()]
  const content = { posts, totals: buildContentTotals(posts) }
  const row = (path) => ({
    dimensionValues: [{ value: path }],
    metricValues: [{ value: '4' }, { value: '8' }, { value: '40' }],
  })
  const rangeRows = {
    '7d': [row('/posts/example'), row('/about/')],
    '30d': [],
    '90d': [],
    all: [],
  }

  const output = buildStatistics(content, rangeRows, {
    activeUsers: 5,
    screenPageViews: 10,
    engagementSeconds: 100,
  })

  assert.equal(output.status, 'live')
  assert.equal(output.version, 2)
  assert.equal(output.locale, 'zh-CN')
  assert.equal(output.site.engagementSecondsPerUser, 20)
  assert.equal(output.ranges['7d'].length, 1)
  assert.equal(output.ranges['7d'][0].engagementSecondsPerView, 5)
  assert.equal(output.ranges['7d'][0].category, '思考')
  assert.equal(output.content.dailyPublications.length, 1)
})

test('keeps translation-pair metrics separated by localized paths', () => {
  const chinesePost = contentPost({ title: '中文', path: '/posts/example/' })
  const englishPost = contentPost({ title: 'English', path: '/en/posts/example/', category: 'Reviews' })
  const row = (path, views) => ({
    dimensionValues: [{ value: path }],
    metricValues: [{ value: '2' }, { value: String(views) }, { value: '20' }],
  })
  const rangeRows = {
    '7d': [row('/posts/example/', 8), row('/en/posts/example/', 3)],
    '30d': [],
    '90d': [],
    all: [],
  }

  const chinese = buildStatistics(
    { posts: [chinesePost], totals: buildContentTotals([chinesePost], 'zh-CN') },
    rangeRows,
    {},
    'zh-CN'
  )
  const english = buildStatistics(
    { posts: [englishPost], totals: buildContentTotals([englishPost], 'en') },
    rangeRows,
    {},
    'en'
  )

  assert.equal(chinese.ranges['7d'][0].screenPageViews, 8)
  assert.equal(english.ranges['7d'][0].screenPageViews, 3)
  assert.equal(chinese.ranges['7d'][0].title, '中文')
  assert.equal(english.ranges['7d'][0].title, 'English')
})

test('empty statistics preserve the expanded content contract', () => {
  const posts = [contentPost()]
  const totals = buildContentTotals(posts)
  const output = createEmptyStatistics({ posts, totals })

  assert.equal(output.status, 'empty')
  assert.equal(output.content.monthlyOutput.length, 1)
  assert.equal(output.content.seriesLifelines.length, 0)
  assert.equal(isStatisticsData(output), true)
  assert.equal(isStatisticsData(output, 'zh-CN'), true)
  assert.equal(isStatisticsData(output, 'en'), false)
  assert.equal(isStatisticsData({ version: 1 }), false)
})
