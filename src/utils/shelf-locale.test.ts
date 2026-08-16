import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from '../i18n/locales'
import {
  formatShelfProgress,
  getShelfCategoryLabel,
  getShelfLabels,
  getShelfSubCategoryLabel,
} from './shelf-locale'

describe('Shelf localization', () => {
  test('translates canonical category and subcategory values for display', () => {
    expect(getShelfCategoryLabel('书籍', DEFAULT_LOCALE)).toBe('书籍')
    expect(getShelfCategoryLabel('书籍', ENGLISH_LOCALE)).toBe('Books')
    expect(getShelfSubCategoryLabel('心理学', ENGLISH_LOCALE)).toBe('Psychology')
    expect(getShelfSubCategoryLabel('unmapped', ENGLISH_LOCALE)).toBe('unmapped')
  })

  test('localizes Shelf UI copy and pluralizes work counts', () => {
    expect(getShelfLabels(DEFAULT_LOCALE).all).toBe('全部')
    expect(getShelfLabels(ENGLISH_LOCALE).all).toBe('All')
    expect(getShelfLabels(ENGLISH_LOCALE).works(1)).toBe('1 work')
    expect(getShelfLabels(ENGLISH_LOCALE).works(2)).toBe('2 works')
  })

  test('formats indeterminate progress for each locale', () => {
    expect(formatShelfProgress(undefined, DEFAULT_LOCALE)).toEqual({
      label: '正在读',
      percent: null,
    })
    expect(formatShelfProgress(undefined, ENGLISH_LOCALE)).toEqual({
      label: 'In progress',
      percent: null,
    })
  })

  test('formats progress values with locale-aware units and percentages', () => {
    expect(formatShelfProgress({ current: 120, total: 300, unit: '页' }, DEFAULT_LOCALE)).toEqual({
      label: '120 / 300页',
      percent: 40,
    })
    expect(formatShelfProgress({ current: 120, total: 300, unit: '页' }, ENGLISH_LOCALE)).toEqual({
      label: '120 / 300 pages',
      percent: 40,
    })
    expect(formatShelfProgress({ current: 4, unit: 'vol.' }, ENGLISH_LOCALE)).toEqual({
      label: '4 vol.',
      percent: null,
    })
  })
})
