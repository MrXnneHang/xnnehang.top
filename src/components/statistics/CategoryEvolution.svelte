<script lang="ts">
  import type { StatisticsCategoryEvolution, StatisticsMonthlyOutput } from '@/types/statistics'
  import { compressQuietMonths, filterMonths, formatMonth, type TrailRange } from './writing-trail-utils'

  export let evolution: StatisticsCategoryEvolution = undefined!
  export let months: StatisticsMonthlyOutput[] = undefined!
  export let range: TrailRange = undefined!

  type Mode = 'count' | 'share'
  let mode: Mode = 'count'
  let activeMonth = ''
  let activeCategory = ''
  $: visibleMonths = filterMonths(months, range)
  $: visibleMonthSet = new Set(visibleMonths.map((item) => item.month))
  $: categoryMonths = evolution.months.filter((month) => visibleMonthSet.has(month.month))
  $: categoryByMonth = new Map(categoryMonths.map((month) => [month.month, month]))
  $: displayItems = range === 'all' ? compressQuietMonths(visibleMonths) : visibleMonths.map((item) => ({ kind: 'month' as const, item }))
  $: maxTotal = Math.max(1, ...categoryMonths.map((month) => month.total))
  $: activeValue = categoryByMonth.get(activeMonth)?.values.find((value) => value.category === activeCategory)
</script>

<section class="time-part category-viz" aria-labelledby="category-evolution-title">
  <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="part-kicker">主题构成</p>
      <h4 id="category-evolution-title" class="mt-1 text-base font-semibold text-black/85 dark:text-white/85">分类演化</h4>
      <p class="mt-1 text-xs text-black/45 dark:text-white/45">同一时间切片中，内容主题如何变化</p>
    </div>
    <div class="mode-controls" aria-label="分类统计方式">
      <button type="button" class:active={mode === 'count'} aria-pressed={mode === 'count'} onclick={() => mode = 'count'}>数量</button>
      <button type="button" class:active={mode === 'share'} aria-pressed={mode === 'share'} onclick={() => mode = 'share'}>占比</button>
    </div>
  </div>

  <ul class="legend mb-5" aria-label="分类图例">
    {#each evolution.categories as category, index}
      <li><span class="legend-mark" style={`--series-color: var(--series-${index})`}></span><span>{category}</span></li>
    {/each}
  </ul>

  <div class="chart-scroll">
    <div class="stacked-chart" role="img" aria-label={`每月分类${mode === 'count' ? '文章数量' : '占比'}堆叠柱状图`}>
      {#each displayItems as display, displayIndex}
        {#if display.kind === 'quiet'}
          <div class="quiet-gap" aria-label={`${display.start} 至 ${display.end}，沉寂 ${display.count} 个月`} title={`${display.start} — ${display.end}\n沉寂 ${display.count} 个月`}>
            <span>···</span><small>沉寂 {display.count} 个月</small>
          </div>
        {:else}
          {@const month = categoryByMonth.get(display.item.month)}
          {#if month}
            <div class="stack-column" aria-label={`${formatMonth(month.month)}共 ${month.total} 篇`}>
              <div class="stack" style={`height: ${mode === 'count' ? Math.max(1, month.total / maxTotal * 100) : (month.total ? 100 : 1)}%`}>
                {#each month.values as value, categoryIndex}
                  {#if value.count > 0}
                    <button
                      type="button"
                      class="segment"
                      class:data-end={categoryIndex === month.values.findLastIndex((item) => item.count > 0)}
                      style={`height: ${mode === 'share' ? value.share : value.count / month.total * 100}%; --series-color: var(--series-${categoryIndex})`}
                      aria-label={`${formatMonth(month.month)}，${value.category}：${value.count} 篇，占 ${value.share}%`}
                      title={`${formatMonth(month.month)} · ${value.category}\n${value.count} 篇 · ${value.share}%`}
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
    <p class="mt-3 text-sm text-black/60 dark:text-white/60" aria-live="polite"><strong>{formatMonth(activeMonth)} · {activeValue.category}</strong>：{activeValue.count} 篇，占 {activeValue.share}%</p>
  {/if}
</section>

<style>
  .part-kicker { color: var(--primary); font-size: .65rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .category-viz { --series-0: #2a78d6; --series-1: #eb6834; --series-2: #1baf7a; --series-3: #eda100; --series-4: #e87ba4; --series-5: #008300; --series-6: #4a3aa7; --series-7: #e34948; }
  :global(.dark) .category-viz { --series-0: #3987e5; --series-1: #d95926; --series-2: #199e70; --series-3: #c98500; --series-4: #d55181; --series-5: #008300; --series-6: #9085e9; --series-7: #e66767; }
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
  button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  @media (max-width: 640px) {
    .axis-label { display: none; }
    .stacked-chart { height: 8rem; }
    .quiet-gap small { writing-mode: vertical-rl; top: calc(100% + .25rem); }
  }
  @media (prefers-reduced-motion: reduce) { .segment, .mode-controls button { transition: none; } }
  @media (forced-colors: active) { .segment, .legend-mark { border: 1px solid CanvasText; background: Canvas; background-image: repeating-linear-gradient(45deg, transparent 0 3px, CanvasText 3px 5px); } }
</style>
