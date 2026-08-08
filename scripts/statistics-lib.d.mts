import type {
  StatisticsContentPost,
  StatisticsContentTotals,
  StatisticsData,
} from '../src/types/statistics'

export const STATISTICS_RANGES: Record<string, string>

export function normalizePagePath(value: unknown): string
export function average(numerator: number, denominator: number): number
export function buildContentTotals(posts?: StatisticsContentPost[]): StatisticsContentTotals
export function mergeAnalyticsRows(rows?: unknown[]): Map<
  string,
  {
    activeUsers: number
    screenPageViews: number
    engagementSeconds: number
  }
>
export function createEmptyStatistics(content?: {
  posts?: StatisticsContentPost[]
  totals?: Partial<StatisticsContentTotals>
}): StatisticsData
export function isStatisticsData(value: unknown): value is StatisticsData
export function buildStatistics(
  content: { posts: StatisticsContentPost[]; totals: StatisticsContentTotals },
  rangeRows: Record<string, unknown[]>,
  siteMetrics: { activeUsers: number; screenPageViews: number; engagementSeconds: number }
): StatisticsData
