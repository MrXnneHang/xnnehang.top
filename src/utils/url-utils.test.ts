import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from '../i18n/locales'
import {
  getCategoryUrl,
  getKindUrl,
  getPostUrlBySlug,
  getSeriesUrl,
  getTagsIndexUrl,
  getTagUrl,
  pathsEqual,
  url,
} from './url-utils'

describe('locale-aware URL utilities', () => {
  test('keeps existing Chinese URLs unchanged by default', () => {
    expect(url('/about/')).toBe('/about/')
    expect(getPostUrlBySlug('example')).toBe('/posts/example/')
    expect(getSeriesUrl('LLM')).toBe('/series/LLM/')
  })

  test('prefixes English route families consistently', () => {
    expect(url('/about/', ENGLISH_LOCALE)).toBe('/en/about/')
    expect(getPostUrlBySlug('example', ENGLISH_LOCALE)).toBe('/en/posts/example/')
    expect(getSeriesUrl('Long-Term Memory', ENGLISH_LOCALE)).toBe('/en/series/Long-Term%20Memory/')
  })

  test('builds locale-aware collection and archive URLs', () => {
    expect(getTagUrl('Long Term Memory', ENGLISH_LOCALE)).toBe('/en/tags/Long%20Term%20Memory/')
    expect(getCategoryUrl('technology', ENGLISH_LOCALE)).toBe('/en/categories/technology/')
    expect(getKindUrl('tutorial', DEFAULT_LOCALE)).toBe('/archive/?kind=tutorial')
    expect(getTagsIndexUrl(ENGLISH_LOCALE)).toBe('/en/tags/')
  })

  test('does not duplicate an existing locale prefix', () => {
    expect(url('/en/archive/', ENGLISH_LOCALE)).toBe('/en/archive/')
  })

  test('compares paths independently of slash and case', () => {
    expect(pathsEqual('/EN/About/', 'en/about')).toBe(true)
  })
})
