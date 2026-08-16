import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from '../i18n/locales'
import {
  filterPostsByLocale,
  getPostRouteSlug,
  getPostTranslationKey,
  linkPostNeighbors,
  type LocalizedPostIdentity,
} from './post-locale'

const post = (
  id: string,
  title: string,
  lang?: string,
  translationKey?: string
): LocalizedPostIdentity => ({
  id,
  data: { title, lang, translationKey },
})

describe('localized post identity', () => {
  test('treats legacy posts as Chinese without editing their frontmatter', () => {
    const legacy = post('example', '示例')
    expect(filterPostsByLocale([legacy], DEFAULT_LOCALE)).toEqual([legacy])
    expect(filterPostsByLocale([legacy], ENGLISH_LOCALE)).toEqual([])
    expect(getPostTranslationKey(legacy)).toBe('example')
  })

  test('uses translation identity as the public English route slug', () => {
    const english = post('example.en', 'Example', 'en', 'example')
    expect(getPostRouteSlug(english)).toBe('example')
    expect(filterPostsByLocale([english], ENGLISH_LOCALE)).toEqual([english])
  })

  test('links neighbors inside an already filtered locale corpus', () => {
    const newest = post('new.en', 'New', 'en', 'new')
    const middle = post('middle.en', 'Middle', 'en', 'middle')
    const oldest = post('old.en', 'Old', 'en', 'old')

    linkPostNeighbors([newest, middle, oldest])

    expect(newest.data.prevSlug).toBe('middle')
    expect(newest.data.nextSlug).toBe('')
    expect(middle.data.nextSlug).toBe('new')
    expect(middle.data.prevSlug).toBe('old')
    expect(oldest.data.nextSlug).toBe('middle')
    expect(oldest.data.prevSlug).toBe('')
  })
})
