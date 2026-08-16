import { defineCollection } from 'astro:content'
import { file, glob } from 'astro/loaders'
import { z } from 'astro/zod'

const shelfCategories = ['电影', '电视剧', '动漫', '书籍', '漫画', '游戏', '论文'] as const

const currentShelfCollection = defineCollection({
  loader: file('src/content/current-shelf.json'),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional().default(''),
    shelf: z.enum(shelfCategories),
    cover: z.string().optional().default(''),
    progress: z
      .object({
        current: z.number().nonnegative(),
        total: z.number().positive().optional(),
        unit: z.string().optional().default(''),
        unitEn: z.string().optional().default(''),
      })
      .refine((value) => value.total === undefined || value.current <= value.total, {
        message: 'Current shelf progress cannot exceed its total',
      })
      .optional(),
    note: z.string().optional().default(''),
    noteEn: z.string().optional().default(''),
    lastActivity: z.string().optional().default(''),
  }),
})

const postsCollection = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    published: z.date(),
    updated: z.date().optional(),
    draft: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
    pin: z.boolean().optional().default(false),
    description: z.string().optional().default(''),
    image: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional().nullable().default(''),
    series: z.array(z.string()).optional().default([]),
    lang: z.enum(['zh-CN', 'en']).optional().default('zh-CN'),
    translationKey: z.string().optional().default(''),
    shelf: z.enum(shelfCategories).optional(),
    subCategory: z.array(z.string()).optional().default([]),
    shelfCover: z.string().optional().default(''),
    blurb: z.string().optional().default(''),
    arxiv: z.string().optional().default(''),

    /* For internal use */
    prevTitle: z.string().default(''),
    prevSlug: z.string().default(''),
    nextTitle: z.string().default(''),
    nextSlug: z.string().default(''),
  }),
})

const specCollection = defineCollection({
  loader: glob({ base: './src/content/spec', pattern: '**/*.md' }),
  schema: z.object({}),
})

export const collections = {
  posts: postsCollection,
  currentShelf: currentShelfCollection,
  spec: specCollection,
}
