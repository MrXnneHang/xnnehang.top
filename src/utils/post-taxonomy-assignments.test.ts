import { describe, expect, test } from 'vite-plus/test'
import assignments from '../data/post-taxonomy-assignments.json'
import { POST_CATEGORY_KEYS, POST_KIND_KEYS } from './post-taxonomy'

const entries = Object.values(assignments)

describe('post taxonomy migration fixture', () => {
  test('covers all bilingual source posts', () => {
    expect(Object.keys(assignments)).toHaveLength(75)
  })

  test('uses only supported category and kind keys', () => {
    for (const entry of entries) {
      expect(POST_CATEGORY_KEYS).toContain(entry.category)
      expect(POST_KIND_KEYS).toContain(entry.kind)
    }
  })

  test('uses every category and kind', () => {
    expect(new Set(entries.map((entry) => entry.category))).toEqual(new Set(POST_CATEGORY_KEYS))
    expect(new Set(entries.map((entry) => entry.kind))).toEqual(new Set(POST_KIND_KEYS))
  })
})
