export type StatisticsRange = '7d' | '30d' | '90d' | 'all'

export type StatisticsStatus = 'empty' | 'live' | 'fallback'

export interface StatisticsSiteTotals {
  activeUsers: number
  screenPageViews: number
  engagementSeconds: number
  engagementSecondsPerUser: number
}

export interface StatisticsPost {
  title: string
  path: string
  published: string
  words: number
  estimatedMinutes: number
  activeUsers: number
  screenPageViews: number
  engagementSeconds: number
  engagementSecondsPerView: number
}

export interface StatisticsPublicationMonth {
  month: string
  count: number
}

export interface StatisticsContentTotals {
  postCount: number
  totalWords: number
  publications: StatisticsPublicationMonth[]
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

export interface StatisticsContentPost {
  title: string
  path: string
  published: string
  words: number
  estimatedMinutes: number
}

export interface StatisticsContentCatalog {
  posts: StatisticsContentPost[]
  totals: StatisticsContentTotals
}
