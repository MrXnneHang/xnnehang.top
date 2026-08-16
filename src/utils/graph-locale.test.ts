import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from '../i18n/locales'
import { getGraphCategoryOrder, getGraphLabels } from './graph-locale'

describe('Graph localization', () => {
  test('localizes interaction and accessibility labels', () => {
    expect(getGraphLabels(DEFAULT_LOCALE).showIsolated).toBe('显示未关联文章')
    expect(getGraphLabels(ENGLISH_LOCALE).showIsolated).toBe('Show isolated posts')
    expect(getGraphLabels(ENGLISH_LOCALE).nodeAria('Demian', 1)).toBe('Demian, 1 relationship')
    expect(getGraphLabels(ENGLISH_LOCALE).nodeAria('Demian', 2)).toBe('Demian, 2 relationships')
  })

  test('uses locale-specific category legends', () => {
    expect(getGraphCategoryOrder(DEFAULT_LOCALE)).toContain('观后')
    expect(getGraphCategoryOrder(ENGLISH_LOCALE)).toContain('Reviews')
    expect(getGraphCategoryOrder(ENGLISH_LOCALE)).not.toContain('观后')
  })
})
