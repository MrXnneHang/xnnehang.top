import { DEFAULT_LOCALE, ENGLISH_LOCALE, type Locale } from '../i18n/locales'

export const SHELF_CATEGORY_ORDER = [
  '书籍',
  '漫画',
  '游戏',
  '电影',
  '电视剧',
  '动漫',
  '论文',
] as const

export type ShelfCategory = (typeof SHELF_CATEGORY_ORDER)[number]

const categoryLabels: Record<Locale, Record<ShelfCategory, string>> = {
  [DEFAULT_LOCALE]: {
    书籍: '书籍',
    漫画: '漫画',
    游戏: '游戏',
    电影: '电影',
    电视剧: '电视剧',
    动漫: '动漫',
    论文: '论文',
  },
  [ENGLISH_LOCALE]: {
    书籍: 'Books',
    漫画: 'Manga',
    游戏: 'Games',
    电影: 'Films',
    电视剧: 'TV Series',
    动漫: 'Anime',
    论文: 'Papers',
  },
}

const subCategoryLabels: Record<Locale, Record<string, string>> = {
  [DEFAULT_LOCALE]: {},
  [ENGLISH_LOCALE]: {
    小说: 'Fiction',
    心理学: 'Psychology',
    散文: 'Essays',
    文学: 'Literature',
    轻小说: 'Light Novels',
    galgame: 'Visual Novels',
  },
}

const progressUnitLabels: Record<Locale, Record<string, string>> = {
  [DEFAULT_LOCALE]: {},
  [ENGLISH_LOCALE]: {
    页: 'pages',
    章: 'chapters',
    集: 'episodes',
    话: 'episodes',
    小时: 'hours',
    分钟: 'minutes',
  },
}

export interface ShelfLabels {
  pageDescription: string
  pageSubtitle: string
  currentEyebrow: string
  currentTitle: string
  currentDescription: string
  libraryEyebrow: string
  libraryTitle: string
  categoryNavLabel: string
  all: string
  readNotes: string
  notesNotStarted: string
  emptyState: string
  inProgress: string
  works: (count: number) => string
  subCategoryLabel: (category: string) => string
  updatedAt: (date: string) => string
  readNotesLabel: (title: string) => string
}

const shelfLabels: Record<Locale, ShelfLabels> = {
  [DEFAULT_LOCALE]: {
    pageDescription: '书影音',
    pageSubtitle: '正在读的，和已经留下来的。',
    currentEyebrow: 'Reading now',
    currentTitle: '继续阅读',
    currentDescription: '为正在读的书留个位置，也提醒自己继续读下去。',
    libraryEyebrow: 'Library',
    libraryTitle: '完整收藏',
    categoryNavLabel: '收藏分类',
    all: '全部',
    readNotes: '阅读笔记',
    notesNotStarted: '笔记尚未开始',
    emptyState: '这个分类下还没有内容。',
    inProgress: '正在读',
    works: (count) => `${count} 部作品`,
    subCategoryLabel: (category) => `${category}二级分类`,
    updatedAt: (date) => `更新于 ${date}`,
    readNotesLabel: (title) => `阅读《${title}》的笔记`,
  },
  [ENGLISH_LOCALE]: {
    pageDescription: 'Books, films, and more',
    pageSubtitle: "What I'm enjoying now, and what has stayed with me.",
    currentEyebrow: 'Reading now',
    currentTitle: 'Continue reading',
    currentDescription: 'A place for what I am reading now—and a reminder to keep going.',
    libraryEyebrow: 'Library',
    libraryTitle: 'The full collection',
    categoryNavLabel: 'Collection categories',
    all: 'All',
    readNotes: 'Read notes',
    notesNotStarted: 'Notes not started yet',
    emptyState: 'There is nothing in this category yet.',
    inProgress: 'In progress',
    works: (count) => `${count} ${count === 1 ? 'work' : 'works'}`,
    subCategoryLabel: (category) => `${category} subcategories`,
    updatedAt: (date) => `Updated ${date}`,
    readNotesLabel: (title) => `Read notes on “${title}”`,
  },
}

export function getShelfLabels(locale: Locale): ShelfLabels {
  return shelfLabels[locale]
}

export function getShelfCategoryLabel(category: ShelfCategory, locale: Locale): string {
  return categoryLabels[locale][category]
}

export function getShelfSubCategoryLabel(subCategory: string, locale: Locale): string {
  return subCategoryLabels[locale][subCategory] ?? subCategory
}

export function formatShelfProgress(
  progress: { current: number; total?: number; unit?: string } | undefined,
  locale: Locale
): { label: string; percent: number | null } {
  if (!progress) return { label: getShelfLabels(locale).inProgress, percent: null }

  const unit = progress.unit || ''
  const localizedUnit = progressUnitLabels[locale][unit] ?? unit
  const value = progress.total ? `${progress.current} / ${progress.total}` : `${progress.current}`
  const label = localizedUnit
    ? locale === ENGLISH_LOCALE
      ? `${value} ${localizedUnit}`
      : `${value}${localizedUnit}`
    : value
  const percent = progress.total
    ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : null

  return { label, percent }
}
