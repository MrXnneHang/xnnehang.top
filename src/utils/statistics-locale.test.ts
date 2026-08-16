import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from '../i18n/locales'
import {
  formatStatisticsDate,
  formatStatisticsDuration,
  formatStatisticsMonth,
  getStatisticsDataPath,
  getStatisticsGraphPath,
  getStatisticsLabels,
} from './statistics-locale'

describe('Statistics localization', () => {
  test('localizes data and graph endpoints', () => {
    expect(getStatisticsDataPath(DEFAULT_LOCALE)).toBe('/statistics.json')
    expect(getStatisticsDataPath(ENGLISH_LOCALE)).toBe('/en/statistics.json')
    expect(getStatisticsGraphPath(DEFAULT_LOCALE)).toBe('/graph-data.json')
    expect(getStatisticsGraphPath(ENGLISH_LOCALE)).toBe('/en/graph-data.json')
  })

  test('localizes pluralized labels', () => {
    const english = getStatisticsLabels(ENGLISH_LOCALE)
    expect(english.postUnit(1)).toBe('1 post')
    expect(english.postUnit(2)).toBe('2 posts')
    expect(english.publicationCount(1)).toBe('1 post published')
    expect(english.publicationCount(2)).toBe('2 posts published')
  })

  test('formats dates and durations for each locale', () => {
    expect(formatStatisticsDate('2026-08-15', DEFAULT_LOCALE)).toContain('2026')
    expect(formatStatisticsDate('2026-08-15', ENGLISH_LOCALE)).toBe('Aug 15, 2026')
    expect(formatStatisticsMonth('2026-08', ENGLISH_LOCALE)).toBe('Aug 2026')
    expect(formatStatisticsDuration(3665, DEFAULT_LOCALE)).toBe('1 小时 1 分')
    expect(formatStatisticsDuration(3665, ENGLISH_LOCALE)).toBe('1 hour 1 min')
  })
})
