<script lang="ts">
  import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales'
  import type { StatisticsCategoryEvolution, StatisticsMonthlyOutput } from '@/types/statistics'
  import { getStatisticsLabels } from '@/utils/statistics-locale'
  import { getCategoryLabel, type PostCategory } from '@/utils/post-taxonomy'
  import { compressQuietMonths, filterMonths, formatMonth, type TrailRange } from './writing-trail-utils'

  export let evolution: StatisticsCategoryEvolution = undefined!
  export let months: StatisticsMonthlyOutput[] = undefined!
  export let range: TrailRange = undefined!
  export let locale: Locale = DEFAULT_LOCALE

  type Mode = 'count' | 'share'
  $: labels = getStatisticsLabels(locale)
  let mode: Mode = 'count'
  let activeMonth = ''
  let activeCategory: PostCategory | '' = ''
  let showTable = false
  $: visibleMonths = filterMonths(months, range)
  $: visibleMonthSet = new Set(visibleMonths.map((item) => item.month))
  $: categoryMonths = evolution.months.filter((month) => visibleMonthSet.has(month.month))
  $: categoryByMonth = new Map(categoryMonths.map((month) => [month.month, month]))
  $: displayItems = range === 'all' ? compressQuietMonths(visibleMonths) : visibleMonths.map((item) => ({ kind: 'month' as const, item }))
  $: maxTotal = Math.max(1, ...categoryMonths.map((month) => month.total))
  $: activeValue = activeCategory
    ? categoryByMonth.get(activeMonth)?.values.find((value) => value.category === activeCategory)
    : undefined

  function categoryColor(category: PostCategory): string {
    return `var(--category-${category})`
  }
</script>

<section class="time-part category-viz" aria-labelledby="category-evolution-title">
  <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="part-kicker">{labels.categoryKicker}</p>
      <h4 id="category-evolution-title" class="mt-1 text-base font-semibold text-black/85 dark:text-white/85">{labels.categoryTitle}</h4>
      <p class="mt-1 text-xs text-black/45 dark:text-white/45">{labels.categoryDescription}</p>
    </div>
    <div class="mode-controls" aria-label={labels.categoryModeAria}>
      <button type="button" class:active={mode === 'count'} aria-pressed={mode === 'count'} onclick={() => mode = 'count'}>{labels.count}</button>
      <button type="button" class:active={mode === 'share'} aria-pressed={mode === 'share'} onclick={() => mode = 'share'}>{labels.share}</button>
    </div>
  </div>

  <ul class="legend mb-5" aria-label={labels.categoryLegendAria}>
    {#each evolution.categories as category, index}
      <li><span class="legend-mark" style={`--series-color: ${categoryColor(category)}`}></span><span>{getCategoryLabel(category, locale)}</span></li>
    {/each}
  </ul>

  <div class="chart-scroll">
    <div class="stacked-chart" role="img" aria-label={labels.categoryChart(mode)}>
      {#each displayItems as display, displayIndex}
        {#if display.kind === 'quiet'}
          <div class="quiet-gap" aria-label={`${display.start} — ${display.end}, ${labels.quietMonths(display.count)}`} title={`${display.start} — ${display.end}\n${labels.quietMonths(display.count)}`}>
            <span>···</span><small>{labels.quietMonths(display.count)}</small>
          </div>
        {:else}
          {@const month = categoryByMonth.get(display.item.month)}
          {#if month}
            <div class="stack-column" aria-label={labels.monthCategoryTotal(formatMonth(month.month, locale), month.total)}>
              <div class="stack" style={`height: ${mode === 'count' ? Math.max(1, month.total / maxTotal * 100) : (month.total ? 100 : 1)}%`}>
                {#each month.values as value, categoryIndex}
                  {#if value.count > 0}
                    <button
                      type="button"
                      class="segment"
                      class:data-end={categoryIndex === month.values.findLastIndex((item) => item.count > 0)}
                      style={`height: ${mode === 'share' ? value.share : value.count / month.total * 100}%; --series-color: ${categoryColor(value.category)}`}
                      aria-label={labels.categoryValue(formatMonth(month.month, locale), getCategoryLabel(value.category, locale), value.count, value.share)}
                      title={`${formatMonth(month.month, locale)} · ${getCategoryLabel(value.category, locale)}\n${labels.postUnit(value.count)} · ${value.share}%`}
                      onmouseenter={() => { activeMonth = month.month; activeCategory = value.category }}
                      onfocus={() => { activeMonth = month.month; activeCategory = value.category }}
                      onclick={() => { activeMonth = month.month; activeCategory = value.category }}
                    ></button>
                  {/if}
                {/each}
              </div>
              {#if displayIndex % Math.max(1, Math.ceil(displayItems.length / 8)) === 0 || displayIndex === displayItems.length - 1}<span class="axis-label">{month.month}</span>{/if}
            </div>
          {/if}
        {/if}
      {/each}
    </div>
  </div>

  {#if activeValue}
    <p class="mt-3 text-sm text-black/60 dark:text-white/60" aria-live="polite"><strong>{formatMonth(activeMonth, locale)} · {getCategoryLabel(activeValue.category, locale)}</strong>: {labels.postUnit(activeValue.count)}, {activeValue.share}%</p>
  {/if}

  <button type="button" class="table-toggle mt-3" aria-expanded={showTable} onclick={() => showTable = !showTable}>
    {locale === 'en' ? (showTable ? 'Hide data table' : 'Show data table') : (showTable ? '收起数据表' : '查看数据表')}
  </button>
  {#if showTable}
    <div class="mt-3 overflow-x-auto">
      <table class="w-full min-w-[28rem] border-collapse text-xs">
        <thead><tr><th>{locale === 'en' ? 'Month' : '月份'}</th>{#each evolution.categories as category}<th>{getCategoryLabel(category, locale)}</th>{/each}</tr></thead>
        <tbody>{#each categoryMonths as month}<tr><th>{month.month}</th>{#each month.values as value}<td>{value.count} · {value.share}%</td>{/each}</tr>{/each}</tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  .part-kicker { color: var(--primary); font-size: .65rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .category-viz { --category-technology: #2a78d6; --category-culture: #eda100; --category-thought: #e87ba4; --category-life: #008300; }
  :global(.dark) .category-viz { --category-technology: #3987e5; --category-culture: #c98500; --category-thought: #d55181; --category-life: #008300; }
  .mode-controls { display: flex; gap: .25rem; }
  .mode-controls button { border-radius: .65rem; padding: .45rem .75rem; color: color-mix(in oklab, black 55%, transparent); font-size: .75rem; transition: 150ms ease; }
  :global(.dark) .mode-controls button { color: color-mix(in oklab, white 55%, transparent); }
  .mode-controls button:hover { background: var(--btn-plain-bg-hover); color: var(--primary); }
  .mode-controls button.active { background: color-mix(in oklab, var(--primary) 13%, transparent); color: var(--primary) !important; font-weight: 600; }
  .legend { display: flex; flex-wrap: wrap; gap: .45rem 1rem; color: color-mix(in oklab, black 55%, transparent); font-size: .7rem; }
  :global(.dark) .legend { color: color-mix(in oklab, white 55%, transparent); }
  .legend li { display: flex; align-items: center; gap: .4rem; }
  .legend-mark { width: .75rem; height: .5rem; border-radius: 2px; background: var(--series-color); }
  .chart-scroll { overflow: hidden; padding: 0 0 1.65rem; }
  .stacked-chart { display: flex; align-items: end; gap: 2px; width: 100%; height: 9.5rem; border-bottom: 1px solid var(--line-divider); }
  .stack-column { position: relative; display: flex; flex: 1 1 0; min-width: 0; height: 100%; align-items: end; justify-content: center; }
  .stack { display: flex; width: min(100%, 24px); min-height: 2px; flex-direction: column-reverse; gap: 2px; }
  .segment { position: relative; min-height: 2px; border-radius: 0; background: var(--series-color); transition: filter 150ms ease; }
  .segment.data-end { border-radius: 4px 4px 0 0; }
  .segment::after { position: absolute; inset: 50% -6px auto; min-height: 24px; transform: translateY(-50%); content: ''; }
  .segment:hover, .segment:focus-visible { z-index: 2; filter: saturate(1.2) brightness(1.08); outline: 2px solid var(--card-bg); outline-offset: 0; }
  .axis-label { position: absolute; top: calc(100% + .45rem); left: 50%; max-width: 4.5rem; transform: translateX(-50%); overflow: hidden; white-space: nowrap; color: color-mix(in oklab, black 35%, transparent); font-size: .6rem; text-overflow: clip; }
  :global(.dark) .axis-label { color: color-mix(in oklab, white 35%, transparent); }
  .quiet-gap { position: relative; display: flex; flex: 1 1 3rem; min-width: 2.25rem; max-width: 5rem; align-items: end; justify-content: center; height: 100%; color: color-mix(in oklab, black 35%, transparent); }
  :global(.dark) .quiet-gap { color: color-mix(in oklab, white 35%, transparent); }
  .quiet-gap span { padding-bottom: .35rem; font-size: 1.1rem; letter-spacing: .2rem; }
  .quiet-gap small { position: absolute; top: calc(100% + .45rem); white-space: nowrap; font-size: .6rem; }
  .table-toggle { border-radius: .55rem; padding: .35rem .6rem; color: var(--primary); font-size: .7rem; transition: 150ms ease; }
  .table-toggle:hover { background: var(--btn-plain-bg-hover); }
  table th, table td { border-bottom: 1px solid var(--line-divider); padding: .5rem .6rem; text-align: right; color: color-mix(in oklab, currentColor 55%, transparent); }
  table th:first-child { text-align: left; }
  table thead th { font-weight: 650; color: color-mix(in oklab, currentColor 75%, transparent); }
  button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  @media (max-width: 640px) {
    .axis-label { display: none; }
    .stacked-chart { height: 8rem; }
    .quiet-gap small { writing-mode: vertical-rl; top: calc(100% + .25rem); }
  }
  @media (prefers-reduced-motion: reduce) { .segment, .mode-controls button, .table-toggle { transition: none; } }
  @media (forced-colors: active) { .segment, .legend-mark { border: 1px solid CanvasText; background: Canvas; background-image: repeating-linear-gradient(45deg, transparent 0 3px, CanvasText 3px 5px); } }
</style>
