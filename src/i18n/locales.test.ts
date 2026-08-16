import { describe, expect, test } from 'vite-plus/test'
import {
  DEFAULT_LOCALE,
  ENGLISH_LOCALE,
  getLocaleFromPathname,
  isLocaleHomePath,
  isLocalePostPath,
  localizePath,
  normalizeLocale,
  stripLocalePrefix,
} from './locales'

describe('locale helpers', () => {
  test('normalizes supported locale variants', () => {
    expect(normalizeLocale('en_US')).toBe(ENGLISH_LOCALE)
    expect(normalizeLocale('en-GB')).toBe(ENGLISH_LOCALE)
    expect(normalizeLocale('zh_CN')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale()).toBe(DEFAULT_LOCALE)
  })

  test('infers locale only from the leading path segment', () => {
    expect(getLocaleFromPathname('/en/')).toBe(ENGLISH_LOCALE)
    expect(getLocaleFromPathname('/en/posts/example/')).toBe(ENGLISH_LOCALE)
    expect(getLocaleFromPathname('/english/')).toBe(DEFAULT_LOCALE)
    expect(getLocaleFromPathname('/posts/en/')).toBe(DEFAULT_LOCALE)
  })

  test('localizes internal paths without duplicating prefixes', () => {
    expect(localizePath('/about/', ENGLISH_LOCALE)).toBe('/en/about/')
    expect(localizePath('/en/about/', ENGLISH_LOCALE)).toBe('/en/about/')
    expect(localizePath('/en/about/', DEFAULT_LOCALE)).toBe('/about/')
    expect(localizePath('/', ENGLISH_LOCALE)).toBe('/en/')
  })

  test('preserves query strings and hashes', () => {
    expect(localizePath('/archive/?tag=LLM#posts', ENGLISH_LOCALE)).toBe(
      '/en/archive/?tag=LLM#posts'
    )
    expect(localizePath('/en/archive/?tag=LLM', DEFAULT_LOCALE)).toBe('/archive/?tag=LLM')
  })

  test('leaves absolute and protocol-relative URLs untouched', () => {
    expect(localizePath('https://example.com/en/', ENGLISH_LOCALE)).toBe('https://example.com/en/')
    expect(localizePath('//example.com/path', DEFAULT_LOCALE)).toBe('//example.com/path')
  })

  test('strips locale prefixes and recognizes route families', () => {
    expect(stripLocalePrefix('/en/posts/example/')).toBe('/posts/example/')
    expect(stripLocalePrefix('/en/')).toBe('/')
    expect(isLocaleHomePath('/')).toBe(true)
    expect(isLocaleHomePath('/en/2/')).toBe(true)
    expect(isLocalePostPath('/en/posts/example/')).toBe(true)
    expect(isLocalePostPath('/en/about/')).toBe(false)
  })
})
