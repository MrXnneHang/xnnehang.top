import assert from 'node:assert/strict'
import test from 'node:test'
import {
  average,
  buildStatistics,
  createEmptyStatistics,
  isStatisticsData,
  mergeAnalyticsRows,
  normalizePagePath,
} from './statistics-lib.mjs'

test('normalizes GA4 page paths', () => {
  assert.equal(normalizePagePath('/posts/example'), '/posts/example/')
  assert.equal(normalizePagePath('https://xnnehang.top/posts/example/?ref=test'), '/posts/example/')
  assert.equal(normalizePagePath('//posts//example#heading'), '/posts/example/')
  assert.equal(normalizePagePath('/'), '/')
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

test('builds post ranges and filters unknown paths', () => {
  const content = {
    posts: [
      {
        title: 'Example',
        path: '/posts/example/',
        published: '2026-01-01',
        words: 1200,
        estimatedMinutes: 5,
      },
    ],
    totals: { postCount: 1, totalWords: 1200, publications: [{ month: '2026-01', count: 1 }] },
  }
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
  assert.equal(output.site.engagementSecondsPerUser, 20)
  assert.equal(output.ranges['7d'].length, 1)
  assert.equal(output.ranges['7d'][0].engagementSecondsPerView, 5)
})

test('empty statistics conform to the public contract', () => {
  const output = createEmptyStatistics()
  assert.equal(output.status, 'empty')
  assert.equal(isStatisticsData(output), true)
  assert.equal(isStatisticsData({ version: 1 }), false)
})
