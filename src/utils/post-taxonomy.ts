import { DEFAULT_LOCALE, ENGLISH_LOCALE, type Locale } from '../i18n/locales'

export const POST_CATEGORY_KEYS = ['technology', 'culture', 'thought', 'life'] as const
export type PostCategory = (typeof POST_CATEGORY_KEYS)[number]

export const POST_KIND_KEYS = [
  'tutorial',
  'review',
  'reflection',
  'learning-note',
  'resource',
  'note',
] as const
export type PostKind = (typeof POST_KIND_KEYS)[number]

interface TaxonomyCopy {
  label: string
  description: string
}

export const CATEGORY_COLORS: Record<PostCategory, { light: string; dark: string }> = {
  technology: { light: '#2a78d6', dark: '#3987e5' },
  culture: { light: '#eda100', dark: '#c98500' },
  thought: { light: '#e87ba4', dark: '#d55181' },
  life: { light: '#008300', dark: '#008300' },
}

const categoryCopy: Record<Locale, Record<PostCategory, TaxonomyCopy>> = {
  [DEFAULT_LOCALE]: {
    technology: {
      label: '格物集',
      description: '技术、工具、工程实践与原理探索。',
    },
    culture: {
      label: '游艺集',
      description: '书、电影、电视剧、动画、漫画与游戏。',
    },
    thought: {
      label: '行思集',
      description: '哲学、自我审视、社会观察与人生问题。',
    },
    life: {
      label: '岁时集',
      description: '个人经历、旅行、阶段总结与生活记录。',
    },
  },
  [ENGLISH_LOCALE]: {
    technology: {
      label: 'Technology',
      description: 'Technology, tools, engineering practice, and explorations of principles.',
    },
    culture: {
      label: 'Arts & Culture',
      description: 'Books, films, television, animation, comics, and games.',
    },
    thought: {
      label: 'Thought',
      description: 'Philosophy, self-examination, social observation, and questions about life.',
    },
    life: {
      label: 'Life',
      description: 'Personal experiences, travel, retrospectives, and records of everyday life.',
    },
  },
}

const kindCopy: Record<Locale, Record<PostKind, TaxonomyCopy>> = {
  [DEFAULT_LOCALE]: {
    tutorial: { label: '教程', description: '给出可以重复执行的操作步骤。' },
    review: { label: '观后', description: '围绕某部作品记录体验、评价与感受。' },
    reflection: { label: '随想', description: '从某件事出发，形成相对完整的思考或结论。' },
    'learning-note': { label: '边学边记', description: '保留探索、验证与修正的过程。' },
    resource: { label: '资源', description: '提供渠道、工具或资料集合。' },
    note: { label: '随记', description: '保存一个片段、发现、展示或暂未展开的体验。' },
  },
  [ENGLISH_LOCALE]: {
    tutorial: { label: 'Tutorial', description: 'A reproducible sequence of steps.' },
    review: { label: 'Review', description: 'An experience and response centered on a work.' },
    reflection: {
      label: 'Reflection',
      description: 'A developed thought or provisional conclusion.',
    },
    'learning-note': {
      label: 'Learning Note',
      description: 'The process of exploration, testing, and correction.',
    },
    resource: { label: 'Resource', description: 'Useful channels, tools, or materials.' },
    note: {
      label: 'Note',
      description: 'A fragment, discovery, demonstration, or brief experience.',
    },
  },
}

const legacyKindAliases: Record<string, PostKind> = {
  资源: 'resource',
  Resources: 'resource',
  观后: 'review',
  Reviews: 'review',
  教程: 'tutorial',
  Tutorials: 'tutorial',
  思考: 'reflection',
  Reflections: 'reflection',
  边写边学: 'learning-note',
  'Learning as I Build': 'learning-note',
}

export function isPostCategory(value: string): value is PostCategory {
  return POST_CATEGORY_KEYS.includes(value as PostCategory)
}

export function isPostKind(value: string): value is PostKind {
  return POST_KIND_KEYS.includes(value as PostKind)
}

export function getCategoryLabel(category: PostCategory, locale: Locale): string {
  return categoryCopy[locale][category].label
}

export function getCategoryDescription(category: PostCategory, locale: Locale): string {
  return categoryCopy[locale][category].description
}

export function getKindLabel(kind: PostKind, locale: Locale): string {
  return kindCopy[locale][kind].label
}

export function getKindDescription(kind: PostKind, locale: Locale): string {
  return kindCopy[locale][kind].description
}

export function parseLegacyKind(value: string | null | undefined): PostKind | null {
  if (!value) return null
  const normalized = value.trim()
  if (isPostKind(normalized)) return normalized
  return legacyKindAliases[normalized] ?? null
}
