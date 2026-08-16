import type { CollectionEntry } from 'astro:content'
import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE, type Locale } from '../i18n/locales'
import { buildFeaturedPosts } from './featured-posts'

type Post = CollectionEntry<'posts'>

interface PostOptions {
  id: string
  title: string
  published: string
  lang?: Locale
  translationKey?: string
  featured?: boolean
  draft?: boolean
}

const post = ({
  id,
  title,
  published,
  lang = DEFAULT_LOCALE,
  translationKey = id,
  featured = true,
  draft = false,
}: PostOptions): Post =>
  ({
    id,
    body: '',
    collection: 'posts',
    data: {
      title,
      published: new Date(`${published}T00:00:00.000Z`),
      draft,
      featured,
      description: `${title} description`,
      image: '',
      lang,
      translationKey,
    },
  }) as Post

describe('featured posts', () => {
  test('deduplicates translations and prefers the endpoint locale', () => {
    const chinese = post({
      id: 'example',
      title: '示例',
      published: '2026-08-08',
      translationKey: 'example',
    })
    const english = post({
      id: 'example.en',
      title: 'Example',
      published: '2026-08-08',
      lang: ENGLISH_LOCALE,
      translationKey: 'example',
      featured: false,
    })

    const [featured] = buildFeaturedPosts([chinese, english], ENGLISH_LOCALE)

    expect(featured).toMatchObject({
      title: 'Example',
      lang: ENGLISH_LOCALE,
      translationKey: 'example',
      url: 'https://xnnehang.top/en/posts/example/',
      alternateLang: DEFAULT_LOCALE,
      alternateUrl: 'https://xnnehang.top/posts/example/',
    })
    expect(buildFeaturedPosts([chinese, english], ENGLISH_LOCALE)).toHaveLength(1)
  })

  test('selects Chinese for the default endpoint', () => {
    const posts = [
      post({
        id: 'example.en',
        title: 'Example',
        published: '2026-08-08',
        lang: ENGLISH_LOCALE,
        translationKey: 'example',
      }),
      post({
        id: 'example',
        title: '示例',
        published: '2026-08-08',
        translationKey: 'example',
      }),
    ]

    expect(buildFeaturedPosts(posts, DEFAULT_LOCALE)[0]).toMatchObject({
      title: '示例',
      lang: DEFAULT_LOCALE,
      url: 'https://xnnehang.top/posts/example/',
      alternateLang: ENGLISH_LOCALE,
      alternateUrl: 'https://xnnehang.top/en/posts/example/',
    })
  })

  test('falls back to the available translation without inventing an alternate', () => {
    const chineseOnly = post({
      id: 'chinese-only',
      title: '仅中文',
      published: '2026-08-07',
    })

    expect(buildFeaturedPosts([chineseOnly], ENGLISH_LOCALE)).toEqual([
      expect.objectContaining({
        title: '仅中文',
        lang: DEFAULT_LOCALE,
        url: 'https://xnnehang.top/posts/chinese-only/',
      }),
    ])
    expect(buildFeaturedPosts([chineseOnly], ENGLISH_LOCALE)[0]).not.toHaveProperty('alternateUrl')
    expect(buildFeaturedPosts([chineseOnly], ENGLISH_LOCALE)[0]).not.toHaveProperty('alternateLang')
  })

  test('sorts and limits after grouping translation pairs', () => {
    const posts = [
      post({ id: 'newest', title: '最新', published: '2026-08-10' }),
      post({
        id: 'newest.en',
        title: 'Newest',
        published: '2026-08-10',
        lang: ENGLISH_LOCALE,
        translationKey: 'newest',
      }),
      post({ id: 'second', title: '第二', published: '2026-08-09' }),
      post({ id: 'third', title: '第三', published: '2026-08-08' }),
      post({ id: 'fourth', title: '第四', published: '2026-08-07' }),
    ]

    expect(
      buildFeaturedPosts(posts, DEFAULT_LOCALE).map(({ translationKey }) => translationKey)
    ).toEqual(['newest', 'second', 'third'])
  })

  test('excludes drafts and groups without a featured translation', () => {
    const posts = [
      post({ id: 'draft', title: '草稿', published: '2026-08-10', draft: true }),
      post({
        id: 'regular',
        title: '普通文章',
        published: '2026-08-09',
        featured: false,
      }),
      post({ id: 'featured', title: '精选', published: '2026-08-08' }),
    ]

    expect(buildFeaturedPosts(posts).map(({ translationKey }) => translationKey)).toEqual([
      'featured',
    ])
  })
})
