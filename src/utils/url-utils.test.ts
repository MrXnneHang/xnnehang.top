import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from '../i18n/locales'
import {
  getCategoryUrl,
  getPostUrlBySlug,
  getSeriesUrl,
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

  test('preserves locale-aware archive query URLs', () => {
    expect(getTagUrl('Long Term Memory', ENGLISH_LOCALE)).toBe(
      '/en/archive/?tag=Long%20Term%20Memory'
    )
    expect(getCategoryUrl('Tutorials', ENGLISH_LOCALE)).toBe('/en/archive/?category=Tutorials')
    expect(getCategoryUrl('Uncategorized', ENGLISH_LOCALE)).toBe('/en/archive/?uncategorized=true')
    expect(getCategoryUrl('未分类', DEFAULT_LOCALE)).toBe('/archive/?uncategorized=true')
  })

  test('does not duplicate an existing locale prefix', () => {
    expect(url('/en/archive/', ENGLISH_LOCALE)).toBe('/en/archive/')
  })

  test('compares paths independently of slash and case', () => {
    expect(pathsEqual('/EN/About/', 'en/about')).toBe(true)
  })
})
