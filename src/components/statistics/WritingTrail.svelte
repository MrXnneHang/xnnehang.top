<script lang="ts">
  import Icon from '@iconify/svelte'
  import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales'
  import type { StatisticsContentTotals } from '@/types/statistics'
  import { getStatisticsLabels } from '@/utils/statistics-locale'
  import CategoryEvolution from './CategoryEvolution.svelte'
  import PublicationPulse from './PublicationPulse.svelte'
  import PublicationCalendar from './PublicationCalendar.svelte'
  import SeriesLifelines from './SeriesLifelines.svelte'
  import { formatDate, formatNumber, rangeStartMonth, trailRanges, type TrailRange } from './writing-trail-utils'

  export let content: StatisticsContentTotals = undefined!
  export let locale: Locale = DEFAULT_LOCALE

  let range: TrailRange = '12m'
  $: labels = getStatisticsLabels(locale)
  $: ranges = trailRanges(locale)
  $: rangeStart = rangeStartMonth(content.monthlyOutput, range)
  $: rhythm = content.rhythm
  $: spanLabel = rhythm.firstPublished && rhythm.lastPublished ? `${formatDate(rhythm.firstPublished, locale)} — ${formatDate(rhythm.lastPublished, locale)}` : labels.waitingForFirstPublication
  $: medianLabel = rhythm.publishingDays > 1 ? labels.days(rhythm.medianIntervalDays) : '—'
  $: densestLabel = rhythm.densest30Days.start ? labels.postUnit(rhythm.densest30Days.count) : '—'
</script>

<section class="mt-4 flex flex-col gap-4" aria-labelledby="writing-trail-heading">
  <header class="card-base relative overflow-hidden p-6 md:p-8"><div class="absolute -top-20 -left-14 h-52 w-52 rounded-full bg-[var(--primary)] opacity-[0.07] blur-2xl"></div><div class="relative"><p class="mb-2 text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">{labels.writingKicker}</p><h2 id="writing-trail-heading" class="text-3xl font-bold tracking-tight text-black/90 md:text-4xl dark:text-white/90">{labels.writingTitle}</h2><p class="mt-3 max-w-2xl text-sm leading-6 text-black/50 dark:text-white/50">{labels.writingDescription}</p></div></header>

  <section class="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={labels.writingOverviewAria}>
    {#each [
      [labels.span, rhythm.spanDays ? labels.days(rhythm.spanDays) : '—', spanLabel, 'material-symbols:date-range-outline-rounded'],
      [labels.publishingDays, formatNumber(rhythm.publishingDays, locale), labels.distinctDays, 'material-symbols:calendar-month-outline-rounded'],
      [labels.medianInterval, medianLabel, labels.longestGap(formatNumber(rhythm.longestGapDays, locale)), 'material-symbols:timeline-rounded'],
      [labels.densestThirtyDays, densestLabel, rhythm.densest30Days.start ? labels.startingAt(rhythm.densest30Days.start) : labels.waitingForData, 'material-symbols:bolt-outline-rounded'],
    ] as summary}<article class="card-base p-4 md:p-5"><Icon icon={summary[3]} class="mb-4 text-2xl text-[var(--primary)] opacity-70" /><p class="text-xs text-black/45 dark:text-white/45">{summary[0]}</p><p class="mt-1 text-xl font-semibold text-black/85 dark:text-white/85">{summary[1]}</p><p class="mt-1 text-[0.65rem] text-black/35 dark:text-white/35">{summary[2]}</p></article>{/each}
  </section>

  <PublicationCalendar days={content.dailyPublications} {locale} />

  <section class="card-base p-4 md:p-6" aria-labelledby="time-slice-title"><div class="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h3 id="time-slice-title" class="text-lg font-semibold text-black/85 dark:text-white/85">{labels.timeSlice}</h3><p class="mt-1 text-xs text-black/45 dark:text-white/45">{labels.timeSliceDescription}</p></div><div class="trail-range-controls" aria-label={labels.trailRangeAria}>{#each ranges as item}<button type="button" class:active={range === item.value} aria-pressed={range === item.value} onclick={() => range = item.value}>{item.label}</button>{/each}</div></div>
    <div class="time-parts"><div class="chart-pair"><PublicationPulse months={content.monthlyOutput} {range} {locale} /><CategoryEvolution evolution={content.categoryEvolution} months={content.monthlyOutput} {range} {locale} /></div><SeriesLifelines lifelines={content.seriesLifelines} {range} {rangeStart} {locale} /></div>
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
  @media (min-width: 1024px) { .chart-pair { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; } .chart-pair > :global(section) { padding-bottom: 1.25rem; } .chart-pair > :global(section + section) { border-top: 0; border-left: 1px solid var(--line-divider); padding-top: 0; padding-left: 1.5rem; } }
  @media (prefers-reduced-motion: reduce) { .trail-range-controls button { transition: none; } }
</style>
