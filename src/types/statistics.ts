export type StatisticsRange = '7d' | '30d' | '90d' | 'all'

export type StatisticsStatus = 'empty' | 'live' | 'fallback'

export interface StatisticsSiteTotals {
  activeUsers: number
  screenPageViews: number
  engagementSeconds: number
  engagementSecondsPerUser: number
}

export interface StatisticsPost extends StatisticsContentPost {
  activeUsers: number
  screenPageViews: number
  engagementSeconds: number
  engagementSecondsPerView: number
}

export interface StatisticsPublicationMonth {
  month: string
  count: number
}

export interface StatisticsTrailPost {
  title: string
  path: string
  published: string
  words: number
}

export interface StatisticsPublicationDay {
  date: string
  count: number
  posts: StatisticsTrailPost[]
}

export interface StatisticsMonthlyOutput {
  month: string
  postCount: number
  words: number
  estimatedMinutes: number
}

export interface StatisticsCategoryValue {
  category: string
  count: number
  share: number
}

export interface StatisticsCategoryMonth {
  month: string
  total: number
  values: StatisticsCategoryValue[]
}

export interface StatisticsCategoryEvolution {
  categories: string[]
  months: StatisticsCategoryMonth[]
}

export interface StatisticsSeriesLifeline {
  name: string
  firstPublished: string
  lastPublished: string
  postCount: number
  totalWords: number
  posts: StatisticsTrailPost[]
}

export interface StatisticsDensestWindow {
  start: string | null
  end: string | null
  count: number
}

export interface StatisticsRhythmSummary {
  firstPublished: string | null
  lastPublished: string | null
  spanDays: number
  publishingDays: number
  medianIntervalDays: number
  densest30Days: StatisticsDensestWindow
  longestGapDays: number
}

export interface StatisticsContentTotals {
  postCount: number
  totalWords: number
  publications: StatisticsPublicationMonth[]
  dailyPublications: StatisticsPublicationDay[]
  monthlyOutput: StatisticsMonthlyOutput[]
  categoryEvolution: StatisticsCategoryEvolution
  seriesLifelines: StatisticsSeriesLifeline[]
  rhythm: StatisticsRhythmSummary
}

export interface StatisticsData {
  version: 1
  generatedAt: string | null
  status: StatisticsStatus
  source: 'ga4'
  site: StatisticsSiteTotals
  content: StatisticsContentTotals
  ranges: Record<StatisticsRange, StatisticsPost[]>
}

export interface StatisticsContentPost extends StatisticsTrailPost {
  estimatedMinutes: number
  category: string
  series: string[]
  editCount: number
  lastModified: string | null
}

export interface StatisticsContentCatalog {
  posts: StatisticsContentPost[]
  totals: StatisticsContentTotals
}
