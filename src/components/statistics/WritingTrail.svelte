<script lang="ts">
  import Icon from '@iconify/svelte'
  import type { StatisticsContentTotals } from '@/types/statistics'
  import CategoryEvolution from './CategoryEvolution.svelte'
  import PublicationPulse from './PublicationPulse.svelte'
  import PublicationCalendar from './PublicationCalendar.svelte'
  import SeriesLifelines from './SeriesLifelines.svelte'
  import { formatDate, formatNumber, rangeStartMonth, trailRanges, type TrailRange } from './writing-trail-utils'

  export let content: StatisticsContentTotals

  let range: TrailRange = '12m'
  $: rangeStart = rangeStartMonth(content.monthlyOutput, range)

  $: rhythm = content.rhythm
  $: spanLabel = rhythm.firstPublished && rhythm.lastPublished
    ? `${formatDate(rhythm.firstPublished)} — ${formatDate(rhythm.lastPublished)}`
    : '等待首次发布'
  $: medianLabel = rhythm.publishingDays > 1 ? `${formatNumber(rhythm.medianIntervalDays)} 天` : '—'
  $: densestLabel = rhythm.densest30Days.start
    ? `${rhythm.densest30Days.count} 篇`
    : '—'
</script>

<section class="mt-4 flex flex-col gap-4" aria-labelledby="writing-trail-heading">
  <header class="card-base relative overflow-hidden p-6 md:p-8">
    <div class="absolute -top-20 -left-14 h-52 w-52 rounded-full bg-[var(--primary)] opacity-[0.07] blur-2xl"></div>
    <div class="relative">
      <p class="mb-2 text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">Writing trail</p>
      <h2 id="writing-trail-heading" class="text-3xl font-bold tracking-tight text-black/90 md:text-4xl dark:text-white/90">这些文字，是怎样一点点积累起来的</h2>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-black/50 dark:text-white/50">从发布日期回望内容的节奏、主题与系列延伸。它记录的是作品出现的轨迹，而不是每天真实发生的写作过程。</p>
    </div>
  </header>

  <section class="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="创作轨迹概览">
    {#each [
      ['累计跨度', rhythm.spanDays ? `${formatNumber(rhythm.spanDays)} 天` : '—', spanLabel, 'material-symbols:date-range-outline-rounded'],
      ['有作品发布的天数', formatNumber(rhythm.publishingDays), '按自然日去重', 'material-symbols:calendar-month-outline-rounded'],
      ['发布日间隔中位数', medianLabel, `最长间隔 ${formatNumber(rhythm.longestGapDays)} 天`, 'material-symbols:timeline-rounded'],
      ['最密集 30 天', densestLabel, rhythm.densest30Days.start ? `${rhythm.densest30Days.start} 起` : '等待数据', 'material-symbols:bolt-outline-rounded'],
    ] as summary}
      <article class="card-base p-4 md:p-5">
        <Icon icon={summary[3]} class="mb-4 text-2xl text-[var(--primary)] opacity-70" />
        <p class="text-xs text-black/45 dark:text-white/45">{summary[0]}</p>
        <p class="mt-1 text-xl font-semibold text-black/85 dark:text-white/85">{summary[1]}</p>
        <p class="mt-1 text-[0.65rem] text-black/35 dark:text-white/35">{summary[2]}</p>
      </article>
    {/each}
  </section>

  <PublicationCalendar days={content.dailyPublications} />

  <section class="card-base p-4 md:p-6" aria-labelledby="time-slice-title">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h3 id="time-slice-title" class="text-lg font-semibold text-black/85 dark:text-white/85">时间切片</h3>
        <p class="mt-1 text-xs text-black/45 dark:text-white/45">在同一段时间里，对照发布强度、分类变化与系列延伸</p>
      </div>
      <div class="trail-range-controls" aria-label="创作轨迹时间范围">
        {#each trailRanges as item}
          <button type="button" class:active={range === item.value} aria-pressed={range === item.value} onclick={() => range = item.value}>{item.label}</button>
        {/each}
      </div>
    </div>

    <div class="time-parts">
      <div class="chart-pair">
        <PublicationPulse months={content.monthlyOutput} {range} />
        <CategoryEvolution evolution={content.categoryEvolution} months={content.monthlyOutput} {range} />
      </div>
      <SeriesLifelines lifelines={content.seriesLifelines} {range} {rangeStart} />
    </div>
  </section>
</section>

<style>
  .trail-range-controls { display: flex; flex-wrap: wrap; gap: .25rem; }
  .trail-range-controls button { border-radius: .65rem; padding: .45rem .75rem; color: color-mix(in oklab, black 55%, transparent); font-size: .75rem; transition: 150ms ease; }
  :global(.dark) .trail-range-controls button { color: color-mix(in oklab, white 55%, transparent); }
  .trail-range-controls button:hover { background: var(--btn-plain-bg-hover); color: var(--primary); }
  .trail-range-controls button.active { background: color-mix(in oklab, var(--primary) 13%, transparent); color: var(--primary) !important; font-weight: 600; }
  .time-parts { display: flex; flex-direction: column; }
  .chart-pair { display: grid; grid-template-columns: minmax(0, 1fr); }
  .chart-pair > :global(section) { min-width: 0; padding-bottom: 1.25rem; }
  .chart-pair > :global(section + section) { border-top: 1px solid var(--line-divider); padding-top: 1.25rem; }
  .time-parts > :global(section) { border-top: 1px solid var(--line-divider); border-radius: 0; background: transparent; padding: 1.5rem 0 0; }
  @media (min-width: 1024px) {
    .chart-pair { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
    .chart-pair > :global(section) { padding-bottom: 1.25rem; }
    .chart-pair > :global(section + section) { border-top: 0; border-left: 1px solid var(--line-divider); padding-top: 0; padding-left: 1.5rem; }
  }
  @media (prefers-reduced-motion: reduce) { .trail-range-controls button { transition: none; } }
</style>
