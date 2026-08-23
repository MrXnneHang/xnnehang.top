import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from '../i18n/locales'
import {
  getCategoryDescription,
  getCategoryLabel,
  getKindLabel,
  parseLegacyKind,
  POST_CATEGORY_KEYS,
  POST_KIND_KEYS,
} from './post-taxonomy'

describe('post taxonomy', () => {
  test('keeps category and kind keys in a stable order', () => {
    expect(POST_CATEGORY_KEYS).toEqual(['technology', 'culture', 'thought', 'life'])
    expect(POST_KIND_KEYS).toEqual([
      'tutorial',
      'review',
      'reflection',
      'learning-note',
      'resource',
      'note',
    ])
  })

  test('localizes stable keys without changing their identity', () => {
    expect(getCategoryLabel('technology', DEFAULT_LOCALE)).toBe('格物集')
    expect(getCategoryLabel('culture', ENGLISH_LOCALE)).toBe('Arts & Culture')
    expect(getKindLabel('reflection', DEFAULT_LOCALE)).toBe('随想')
    expect(getKindLabel('learning-note', ENGLISH_LOCALE)).toBe('Learning Note')
    expect(getCategoryDescription('life', ENGLISH_LOCALE)).toContain('Personal experiences')
  })

  test('maps every legacy category label to its kind key', () => {
    expect(parseLegacyKind('教程')).toBe('tutorial')
    expect(parseLegacyKind('Reviews')).toBe('review')
    expect(parseLegacyKind('Learning as I Build')).toBe('learning-note')
    expect(parseLegacyKind('note')).toBe('note')
    expect(parseLegacyKind('unknown')).toBeNull()
  })
})
