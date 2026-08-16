import { describe, expect, test } from 'vite-plus/test'
import I18nKey from './i18nKey'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from './locales'
import { createI18n, getLocaleTranslation, i18n } from './translation'

describe('request-scoped translations', () => {
  test('keeps the configured Chinese locale as the default', () => {
    expect(i18n(I18nKey.home)).toBe('主页')
  })

  test('supports an explicit locale override', () => {
    expect(i18n(I18nKey.home, ENGLISH_LOCALE)).toBe('Home')
    expect(i18n(I18nKey.home, 'en_US')).toBe('Home')
  })

  test('creates a locale-bound translation function', () => {
    const t = createI18n(ENGLISH_LOCALE)
    expect(t(I18nKey.archive)).toBe('Archive')
    expect(t(I18nKey.about)).toBe('About')
  })

  test('returns complete locale dictionaries', () => {
    expect(getLocaleTranslation(DEFAULT_LOCALE)[I18nKey.friends]).toBe('友链')
    expect(getLocaleTranslation(ENGLISH_LOCALE)[I18nKey.friends]).toBe('Friends')
  })
})
