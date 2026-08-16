import type { Locale } from '@/i18n/locales'
import type { StatisticsMonthlyOutput, StatisticsTrailPost } from '@/types/statistics'
import {
  formatStatisticsCompact,
  formatStatisticsDate,
  formatStatisticsMonth,
  formatStatisticsNumber,
  getStatisticsLabels,
  type StatisticsTrailRange,
} from '@/utils/statistics-locale'
import { getSeriesUrl } from '@/utils/url-utils'

export type TrailRange = StatisticsTrailRange
export type MonthDisplayItem =
  | { kind: 'month'; item: StatisticsMonthlyOutput }
  | { kind: 'quiet'; count: number; start: string; end: string }

export function trailRanges(locale: Locale): Array<{ value: TrailRange; label: string }> {
  const labels = getStatisticsLabels(locale)
  return (['6m', '12m', 'all'] as TrailRange[]).map((value) => ({
    value,
    label: labels.trailRanges[value],
  }))
}

export const formatNumber = formatStatisticsNumber
export const formatDate = formatStatisticsDate
export const formatMonth = formatStatisticsMonth
export const compactFormat = formatStatisticsCompact

export function postDetails(posts: StatisticsTrailPost[], locale: Locale): string {
  return posts.map((post) => post.title).join(locale === 'en' ? ', ' : '、')
}

export function monthlyValue(
  item: StatisticsMonthlyOutput,
  metric: 'posts' | 'words' | 'minutes'
): number {
  if (metric === 'words') return item.words
  if (metric === 'minutes') return item.estimatedMinutes
  return item.postCount
}

export function rangeStartMonth(months: StatisticsMonthlyOutput[], range: TrailRange): string {
  if (range === 'all') return months[0]?.month ?? ''
  const count = range === '6m' ? 6 : 12
  return months.at(-count)?.month ?? months[0]?.month ?? ''
}

export function filterMonths(
  months: StatisticsMonthlyOutput[],
  range: TrailRange
): StatisticsMonthlyOutput[] {
  const start = rangeStartMonth(months, range)
  return months.filter((item) => item.month >= start)
}

export function compressQuietMonths(
  months: StatisticsMonthlyOutput[],
  threshold = 3
): MonthDisplayItem[] {
  const result: MonthDisplayItem[] = []
  for (let index = 0; index < months.length;) {
    if (months[index].postCount > 0) {
      result.push({ kind: 'month', item: months[index] })
      index += 1
      continue
    }
    let end = index
    while (end < months.length && months[end].postCount === 0) end += 1
    const count = end - index
    if (count >= threshold) {
      result.push({ kind: 'quiet', count, start: months[index].month, end: months[end - 1].month })
    } else {
      for (let cursor = index; cursor < end; cursor += 1)
        result.push({ kind: 'month', item: months[cursor] })
    }
    index = end
  }
  return result
}

export function seriesUrl(name: string, locale: Locale): string {
  return getSeriesUrl(name, locale)
}
