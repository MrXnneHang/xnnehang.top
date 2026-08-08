import type { StatisticsMonthlyOutput, StatisticsTrailPost } from '@/types/statistics'

export type TrailRange = '6m' | '12m' | 'all'
export type MonthDisplayItem =
  | { kind: 'month'; item: StatisticsMonthlyOutput }
  | { kind: 'quiet'; count: number; start: string; end: string }

export const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('zh-CN')
export const compactFormat: Intl.NumberFormat = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
export const trailRanges: Array<{ value: TrailRange; label: string }> = [
  { value: '6m', label: '近半年' },
  { value: '12m', label: '近一年' },
  { value: 'all', label: '全部' },
]

export function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value))
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export function formatMonth(value: string): string {
  const [year, month] = value.split('-')
  return `${year} 年 ${Number(month)} 月`
}

export function postDetails(posts: StatisticsTrailPost[]): string {
  return posts.map((post) => post.title).join('、')
}

export function monthlyValue(item: StatisticsMonthlyOutput, metric: 'posts' | 'words' | 'minutes'): number {
  if (metric === 'words') return item.words
  if (metric === 'minutes') return item.estimatedMinutes
  return item.postCount
}

export function rangeStartMonth(months: StatisticsMonthlyOutput[], range: TrailRange): string {
  if (range === 'all') return months[0]?.month ?? ''
  const count = range === '6m' ? 6 : 12
  return months.at(-count)?.month ?? months[0]?.month ?? ''
}

export function filterMonths(months: StatisticsMonthlyOutput[], range: TrailRange): StatisticsMonthlyOutput[] {
  const start = rangeStartMonth(months, range)
  return months.filter((item) => item.month >= start)
}

export function compressQuietMonths(months: StatisticsMonthlyOutput[], threshold = 3): MonthDisplayItem[] {
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
      for (let cursor = index; cursor < end; cursor += 1) result.push({ kind: 'month', item: months[cursor] })
    }
    index = end
  }
  return result
}

export function seriesUrl(name: string): string {
  return `/series/${encodeURIComponent(name.trim())}/`
}
