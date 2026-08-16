import { DEFAULT_LOCALE, ENGLISH_LOCALE, type Locale } from '../i18n/locales'
import { url } from './url-utils'

export type StatisticsTrailRange = '6m' | '12m' | 'all'
export type StatisticsReadingRange = '7d' | '30d' | '90d' | 'all'

export interface StatisticsLabels {
  tabsAria: string
  viewsAria: string
  overviewTab: string
  overviewDescription: string
  graphTab: string
  graphDescription: string
  loading: string
  offlineTitle: string
  loadError: string
  statusFallback: string
  statusEmpty: string
  statusLive: string
  writingKicker: string
  writingTitle: string
  writingDescription: string
  writingOverviewAria: string
  span: string
  publishingDays: string
  distinctDays: string
  medianInterval: string
  longestGap: (days: string) => string
  densestThirtyDays: string
  startingAt: (date: string) => string
  waitingForData: string
  waitingForFirstPublication: string
  timeSlice: string
  timeSliceDescription: string
  trailRangeAria: string
  trailRanges: Record<StatisticsTrailRange, string>
  calendarTitle: string
  calendarDescription: string
  calendarViewAria: string
  earlierMonths: string
  laterMonths: string
  calendarYearAria: string
  calendarAria: (year: number) => string
  publicationScaleAria: string
  less: string
  more: string
  publicationCount: (count: number) => string
  publicationPulseKicker: string
  publicationPulseTitle: string
  publicationPulseDescription: string
  publicationMetricsAria: string
  postsMetric: string
  wordsMetric: string
  readingMetric: string
  postUnit: (count: number) => string
  wordUnit: (count: number) => string
  minuteUnit: (count: number) => string
  monthlyChart: (metric: string) => string
  quietMonths: (count: number) => string
  categoryKicker: string
  categoryTitle: string
  categoryDescription: string
  categoryModeAria: string
  count: string
  share: string
  categoryLegendAria: string
  categoryChart: (mode: 'count' | 'share') => string
  monthCategoryTotal: (month: string, count: number) => string
  categoryValue: (month: string, category: string, count: number, share: number) => string
  seriesKicker: string
  seriesTitle: string
  seriesDescription: string
  seriesSortAria: string
  recent: string
  duration: string
  activity: string
  seriesCaveat: string
  noSeries: string
  seriesRange: (name: string, count: number, first: string, last: string) => string
  readingKicker: string
  readingTitle: string
  readingDescription: string
  summaryAria: string
  articles: string
  totalWords: string
  visitors: string
  views: string
  totalReadingTime: string
  readingPerVisitor: string
  rankingTitle: string
  rankingDescription: string
  readingRangeAria: string
  readingRanges: Record<StatisticsReadingRange, string>
  sort: string
  sortViews: string
  sortVisitors: string
  sortDuration: string
  noReading: string
  noReadingDescription: string
  rankArticle: string
  averageReading: string
  estimatedReading: (minutes: number, words: string) => string
  insufficientSample: string
  insufficientSampleTitle: (minimum: number) => string
  interpretationTitle: string
  interpretation: string
  privacyLink: string
  days: (count: number) => string
  hours: (count: number) => string
  minutes: (count: number) => string
  seconds: (count: number) => string
}

const labels: Record<Locale, StatisticsLabels> = {
  [DEFAULT_LOCALE]: {
    tabsAria: '统计与图谱视图',
    viewsAria: '数据视图',
    overviewTab: '统计概览',
    overviewDescription: '发布轨迹与阅读回声',
    graphTab: '关系图谱',
    graphDescription: '文章之间的引用脉络',
    loading: '正在读取统计数据',
    offlineTitle: '数据暂时离线',
    loadError: '统计数据暂时无法加载，请稍后再试。',
    statusFallback: '使用上一份可用数据',
    statusEmpty: '等待数据积累',
    statusLive: 'GA4 汇总数据',
    writingKicker: 'Writing trail',
    writingTitle: '这些文字，是怎样一点点积累起来的',
    writingDescription:
      '从发布日期回望内容的节奏、主题与系列延伸。它记录的是作品出现的轨迹，而不是每天真实发生的写作过程。',
    writingOverviewAria: '创作轨迹概览',
    span: '累计跨度',
    publishingDays: '有作品发布的天数',
    distinctDays: '按自然日去重',
    medianInterval: '发布日间隔中位数',
    longestGap: (days) => `最长间隔 ${days} 天`,
    densestThirtyDays: '最密集 30 天',
    startingAt: (date) => `${date} 起`,
    waitingForData: '等待数据',
    waitingForFirstPublication: '等待首次发布',
    timeSlice: '时间切片',
    timeSliceDescription: '在同一段时间里，对照发布强度、分类变化与系列延伸',
    trailRangeAria: '创作轨迹时间范围',
    trailRanges: { '6m': '近半年', '12m': '近一年', all: '全部' },
    calendarTitle: '发布日历',
    calendarDescription: '记录作品发布的日期，不等同于实际写作日',
    calendarViewAria: '日历视图',
    earlierMonths: '查看更早月份',
    laterMonths: '查看更晚月份',
    calendarYearAria: '日历年份',
    calendarAria: (year) => `${year} 年发布日历`,
    publicationScaleAria: '发布数量色阶',
    less: '少',
    more: '多',
    publicationCount: (count) => `发布 ${count} 篇`,
    publicationPulseKicker: '发布强度',
    publicationPulseTitle: '发布脉冲',
    publicationPulseDescription: '作品发布的密度、体量与安静时段',
    publicationMetricsAria: '发布脉冲指标',
    postsMetric: '文章',
    wordsMetric: '字数',
    readingMetric: '预计阅读',
    postUnit: (count) => `${count} 篇`,
    wordUnit: (count) => `${count} 字`,
    minuteUnit: (count) => `${count} 分钟`,
    monthlyChart: (metric) => `每月${metric}柱状图`,
    quietMonths: (count) => `沉寂 ${count} 个月`,
    categoryKicker: '主题构成',
    categoryTitle: '分类演化',
    categoryDescription: '同一时间切片中，内容主题如何变化',
    categoryModeAria: '分类统计方式',
    count: '数量',
    share: '占比',
    categoryLegendAria: '分类图例',
    categoryChart: (mode) => `每月分类${mode === 'count' ? '文章数量' : '占比'}堆叠柱状图`,
    monthCategoryTotal: (month, count) => `${month}共 ${count} 篇`,
    categoryValue: (month, category, count, share) =>
      `${month}，${category}：${count} 篇，占 ${share}%`,
    seriesKicker: '系列延伸',
    seriesTitle: '系列生命线',
    seriesDescription: '同一时间切片中，系列何时延续或停顿',
    seriesSortAria: '系列排序',
    recent: '最近活跃',
    duration: '跨度',
    activity: '文章数',
    seriesCaveat:
      '同一篇文章可以属于多个系列，因此各系列文章数会重叠，不能相加为全站文章总数。Git 提交次数只代表文件历史触达，不等于语义重写次数。',
    noSeries: '这个时间范围还没有系列更新',
    seriesRange: (name, count, first, last) => `${name}，${count} 篇，从 ${first} 到 ${last}`,
    readingKicker: 'Reading pulse',
    readingTitle: '这些文字发布之后，又怎样被读过',
    readingDescription: '从真实访问到参与时长，这是作品离开创作桌之后收到的回声。',
    summaryAria: '全站统计概览',
    articles: '文章',
    totalWords: '总字数',
    visitors: '访客',
    views: '访问',
    totalReadingTime: '总阅读时长',
    readingPerVisitor: '人均阅读',
    rankingTitle: '文章阅读排行',
    rankingDescription: '同一时间范围内的访客、访问与参与时长',
    readingRangeAria: '统计范围',
    readingRanges: { '7d': '7 天', '30d': '30 天', '90d': '90 天', all: '全部' },
    sort: '排序：',
    sortViews: '访问量',
    sortVisitors: '访客数',
    sortDuration: '平均阅读时长',
    noReading: '这个时间范围还没有阅读记录',
    noReadingDescription: '数据会在埋点上线后开始积累，并约每六小时更新。',
    rankArticle: '文章',
    averageReading: '平均阅读',
    estimatedReading: (minutes, words) => `预计 ${minutes} 分钟 · ${words} 字`,
    insufficientSample: '样本不足',
    insufficientSampleTitle: (minimum) => `少于 ${minimum} 位访客，暂不参与时长排名`,
    interpretationTitle: '数据如何理解',
    interpretation:
      '阅读时长是 GA4 记录的参与时长，不代表访客始终在认真阅读。预计阅读时间则由文章字数计算。',
    privacyLink: '隐私与统计说明 →',
    days: (count) => `${count} 天`,
    hours: (count) => `${count} 小时`,
    minutes: (count) => `${count} 分`,
    seconds: (count) => `${count} 秒`,
  },
  [ENGLISH_LOCALE]: {
    tabsAria: 'Statistics and graph views',
    viewsAria: 'Data views',
    overviewTab: 'Overview',
    overviewDescription: 'Publishing trail and reading response',
    graphTab: 'Relationship graph',
    graphDescription: 'References between posts',
    loading: 'Loading statistics',
    offlineTitle: 'Statistics temporarily offline',
    loadError: 'Statistics could not be loaded. Please try again later.',
    statusFallback: 'Using the last available snapshot',
    statusEmpty: 'Waiting for data',
    statusLive: 'GA4 aggregate data',
    writingKicker: 'Writing trail',
    writingTitle: 'How these words accumulated over time',
    writingDescription:
      'Look back from publication dates at the rhythm, themes, and growth of each series. This traces when work appeared, not the days when writing actually happened.',
    writingOverviewAria: 'Writing trail overview',
    span: 'Total span',
    publishingDays: 'Publishing days',
    distinctDays: 'Distinct calendar days',
    medianInterval: 'Median interval',
    longestGap: (days) => `Longest gap: ${days} days`,
    densestThirtyDays: 'Densest 30 days',
    startingAt: (date) => `Starting ${date}`,
    waitingForData: 'Waiting for data',
    waitingForFirstPublication: 'Waiting for the first publication',
    timeSlice: 'Time slice',
    timeSliceDescription:
      'Compare publishing intensity, category shifts, and series growth over the same period',
    trailRangeAria: 'Writing trail range',
    trailRanges: { '6m': '6 months', '12m': '12 months', all: 'All time' },
    calendarTitle: 'Publication calendar',
    calendarDescription: 'Dates when work was published, not necessarily when it was written',
    calendarViewAria: 'Calendar view',
    earlierMonths: 'View earlier months',
    laterMonths: 'View later months',
    calendarYearAria: 'Calendar years',
    calendarAria: (year) => `${year} publication calendar`,
    publicationScaleAria: 'Publication count scale',
    less: 'Less',
    more: 'More',
    publicationCount: (count) => `${count} ${count === 1 ? 'post' : 'posts'} published`,
    publicationPulseKicker: 'Publishing intensity',
    publicationPulseTitle: 'Publication pulse',
    publicationPulseDescription: 'The density, volume, and quiet stretches of published work',
    publicationMetricsAria: 'Publication pulse metric',
    postsMetric: 'Posts',
    wordsMetric: 'Words',
    readingMetric: 'Est. reading',
    postUnit: (count) => `${count} ${count === 1 ? 'post' : 'posts'}`,
    wordUnit: (count) => `${count} ${count === 1 ? 'word' : 'words'}`,
    minuteUnit: (count) => `${count} ${count === 1 ? 'minute' : 'minutes'}`,
    monthlyChart: (metric) => `Monthly ${metric.toLowerCase()} bar chart`,
    quietMonths: (count) => `${count} quiet ${count === 1 ? 'month' : 'months'}`,
    categoryKicker: 'Theme mix',
    categoryTitle: 'Category evolution',
    categoryDescription: 'How the mix of topics changes within the same time slice',
    categoryModeAria: 'Category statistic mode',
    count: 'Count',
    share: 'Share',
    categoryLegendAria: 'Category legend',
    categoryChart: (mode) =>
      `Monthly category ${mode === 'count' ? 'post count' : 'share'} stacked bar chart`,
    monthCategoryTotal: (month, count) => `${month}: ${count} ${count === 1 ? 'post' : 'posts'}`,
    categoryValue: (month, category, count, share) =>
      `${month}, ${category}: ${count} ${count === 1 ? 'post' : 'posts'}, ${share}%`,
    seriesKicker: 'Series growth',
    seriesTitle: 'Series lifelines',
    seriesDescription: 'When each series continues or pauses within the same time slice',
    seriesSortAria: 'Series sorting',
    recent: 'Recent',
    duration: 'Duration',
    activity: 'Post count',
    seriesCaveat:
      'A post may belong to more than one series, so series counts overlap and cannot be added into a site total. Git revision counts show file history touches, not semantic rewrites.',
    noSeries: 'No series updates in this range',
    seriesRange: (name, count, first, last) =>
      `${name}, ${count} ${count === 1 ? 'post' : 'posts'}, from ${first} to ${last}`,
    readingKicker: 'Reading pulse',
    readingTitle: 'What happened after these words were published',
    readingDescription:
      'From real visits to engagement time, these are the echoes that returned after the work left the writing desk.',
    summaryAria: 'Site statistics overview',
    articles: 'Posts',
    totalWords: 'Total words',
    visitors: 'Visitors',
    views: 'Views',
    totalReadingTime: 'Reading time',
    readingPerVisitor: 'Per visitor',
    rankingTitle: 'Post reading ranking',
    rankingDescription: 'Visitors, views, and engagement time within the same range',
    readingRangeAria: 'Statistics range',
    readingRanges: { '7d': '7 days', '30d': '30 days', '90d': '90 days', all: 'All time' },
    sort: 'Sort:',
    sortViews: 'Views',
    sortVisitors: 'Visitors',
    sortDuration: 'Average reading time',
    noReading: 'No reading activity in this range yet',
    noReadingDescription:
      'Data begins accumulating after analytics collection and refreshes about every six hours.',
    rankArticle: 'Post',
    averageReading: 'Avg. reading',
    estimatedReading: (minutes, words) => `${minutes} min read · ${words} words`,
    insufficientSample: 'Small sample',
    insufficientSampleTitle: (minimum) =>
      `Fewer than ${minimum} visitors; excluded from duration ranking`,
    interpretationTitle: 'How to read this data',
    interpretation:
      'Reading time is GA4 engagement time and does not mean a visitor was actively reading throughout. Estimated reading time is calculated from the post word count.',
    privacyLink: 'Privacy and analytics →',
    days: (count) => `${count} ${count === 1 ? 'day' : 'days'}`,
    hours: (count) => `${count} ${count === 1 ? 'hour' : 'hours'}`,
    minutes: (count) => `${count} min`,
    seconds: (count) => `${count} sec`,
  },
}

export function getStatisticsLabels(locale: Locale): StatisticsLabels {
  return labels[locale]
}

export function getStatisticsDataPath(locale: Locale): string {
  return url('/statistics.json', locale)
}

export function getStatisticsContentPath(locale: Locale): string {
  return url('/statistics-content.json', locale)
}

export function getStatisticsGraphPath(locale: Locale): string {
  return url('/graph-data.json', locale)
}

export function formatStatisticsNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === ENGLISH_LOCALE ? 'en' : 'zh-CN').format(Math.round(value))
}

export function formatStatisticsCompact(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === ENGLISH_LOCALE ? 'en' : 'zh-CN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatStatisticsDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === ENGLISH_LOCALE ? 'en' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export function formatStatisticsMonth(value: string, locale: Locale): string {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(locale === ENGLISH_LOCALE ? 'en' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function formatStatisticsUpdated(value: string | null, locale: Locale): string {
  if (!value) return getStatisticsLabels(locale).waitingForData
  return new Intl.DateTimeFormat(locale === ENGLISH_LOCALE ? 'en' : 'zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}

export function formatStatisticsDuration(totalSeconds: number, locale: Locale): string {
  const labels = getStatisticsLabels(locale)
  const seconds = Math.max(0, Math.round(totalSeconds))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (days > 0) return `${labels.days(days)} ${labels.hours(hours)}`
  if (hours > 0) return `${labels.hours(hours)} ${labels.minutes(minutes)}`
  if (minutes > 0) return `${labels.minutes(minutes)} ${labels.seconds(remainingSeconds)}`
  return labels.seconds(remainingSeconds)
}
