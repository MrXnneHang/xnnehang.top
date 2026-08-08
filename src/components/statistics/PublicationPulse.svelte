<script lang="ts">
  import type { StatisticsMonthlyOutput } from '@/types/statistics'
  import {
    compactFormat,
    compressQuietMonths,
    filterMonths,
    formatMonth,
    formatNumber,
    monthlyValue,
    type TrailRange,
  } from './writing-trail-utils'

  export let months: StatisticsMonthlyOutput[]
  export let range: TrailRange

  type Metric = 'posts' | 'words' | 'minutes'
  const metrics: Array<{ value: Metric; label: string; unit: string }> = [
    { value: 'posts', label: '文章', unit: '篇' },
    { value: 'words', label: '字数', unit: '字' },
    { value: 'minutes', label: '预计阅读', unit: '分钟' },
  ]
  let metric: Metric = 'posts'
  let activeMonth = ''
  $: visibleMonths = filterMonths(months, range)
  $: displayItems = range === 'all' ? compressQuietMonths(visibleMonths) : visibleMonths.map((item) => ({ kind: 'month' as const, item }))
  $: selectedMetric = metrics.find((item) => item.value === metric) ?? metrics[0]
  $: maxValue = Math.max(1, ...visibleMonths.map((item) => monthlyValue(item, metric)))
  $: activeItem = visibleMonths.find((item) => item.month === activeMonth)

  function valueLabel(item: StatisticsMonthlyOutput) {
    return `${formatNumber(monthlyValue(item, metric))} ${selectedMetric.unit}`
  }
</script>

<section class="time-part" aria-labelledby="publication-pulse-title">
  <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="part-kicker">发布强度</p>
      <h4 id="publication-pulse-title" class="mt-1 text-base font-semibold text-black/85 dark:text-white/85">发布脉冲</h4>
      <p class="mt-1 text-xs text-black/45 dark:text-white/45">作品发布的密度、体量与安静时段</p>
    </div>
    <div class="metric-controls" aria-label="发布脉冲指标">
      {#each metrics as item}
        <button type="button" class:active={metric === item.value} aria-pressed={metric === item.value} onclick={() => metric = item.value}>{item.label}</button>
      {/each}
    </div>
  </div>

  <div class="chart-scroll">
    <div class="bar-chart" role="img" aria-label={`每月${selectedMetric.label}柱状图`}>
      {#each displayItems as display, index}
        {#if display.kind === 'quiet'}
          <div class="quiet-gap" aria-label={`${display.start} 至 ${display.end}，沉寂 ${display.count} 个月`} title={`${display.start} — ${display.end}\n沉寂 ${display.count} 个月`}>
            <span class="quiet-dots">···</span>
            <span class="quiet-label">沉寂 {display.count} 个月</span>
          </div>
        {:else}
          {@const item = display.item}
          {@const value = monthlyValue(item, metric)}
          <button
            type="button"
            class="bar-hit"
            aria-label={`${formatMonth(item.month)}：${valueLabel(item)}`}
            title={`${formatMonth(item.month)} · ${valueLabel(item)}`}
            onmouseenter={() => activeMonth = item.month}
            onfocus={() => activeMonth = item.month}
            onclick={() => activeMonth = item.month}
          >
            <span class="value-hint">{value > 0 ? compactFormat.format(value) : ''}</span>
            <span class="bar" class:zero={value === 0} style={`height: ${value === 0 ? 2 : Math.max(5, value / maxValue * 100)}%`}></span>
            {#if index % Math.max(1, Math.ceil(displayItems.length / 8)) === 0 || index === displayItems.length - 1}<span class="axis-label">{item.month}</span>{/if}
          </button>
        {/if}
      {/each}
    </div>
  </div>

  {#if activeItem}
    <p class="mt-3 text-sm text-black/60 dark:text-white/60" aria-live="polite"><strong>{formatMonth(activeItem.month)}</strong> · {valueLabel(activeItem)}</p>
  {/if}
</section>

<style>
  .part-kicker { color: var(--primary); font-size: .65rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .metric-controls { display: flex; flex-wrap: wrap; gap: .25rem; }
  .metric-controls button { border-radius: .65rem; padding: .45rem .75rem; color: color-mix(in oklab, black 55%, transparent); font-size: .75rem; transition: 150ms ease; }
  :global(.dark) .metric-controls button { color: color-mix(in oklab, white 55%, transparent); }
  .metric-controls button:hover { background: var(--btn-plain-bg-hover); color: var(--primary); }
  .metric-controls button.active { background: color-mix(in oklab, var(--primary) 13%, transparent); color: var(--primary) !important; font-weight: 600; }
  .chart-scroll { overflow: hidden; padding: .75rem .2rem 1.65rem; }
  .bar-chart { display: flex; align-items: end; gap: 2px; width: 100%; height: 9.5rem; border-bottom: 1px solid var(--line-divider); }
  .bar-hit { position: relative; display: flex; flex: 1 1 0; min-width: 0; height: 100%; align-items: end; justify-content: center; padding: 0 1px; }
  .bar { width: min(100%, 24px); min-height: 2px; border-radius: 4px 4px 0 0; background: var(--primary); transition: filter 150ms ease, transform 150ms ease; }
  .bar.zero { background: color-mix(in oklab, black 10%, transparent); }
  :global(.dark) .bar.zero { background: color-mix(in oklab, white 12%, transparent); }
  .bar-hit:hover .bar, .bar-hit:focus-visible .bar { filter: saturate(1.15) brightness(1.05); transform: translateY(-2px); }
  .value-hint { position: absolute; bottom: calc(100% + .3rem); display: none; color: color-mix(in oklab, black 65%, transparent); font-size: .625rem; }
  :global(.dark) .value-hint { color: color-mix(in oklab, white 65%, transparent); }
  .bar-hit:hover .value-hint, .bar-hit:focus-visible .value-hint { display: block; }
  .axis-label { position: absolute; top: calc(100% + .45rem); left: 50%; max-width: 4.5rem; transform: translateX(-50%); overflow: hidden; white-space: nowrap; color: color-mix(in oklab, black 35%, transparent); font-size: .6rem; text-overflow: clip; }
  :global(.dark) .axis-label { color: color-mix(in oklab, white 35%, transparent); }
  .quiet-gap { position: relative; display: flex; flex: 1 1 3rem; min-width: 2.25rem; max-width: 5rem; align-items: end; justify-content: center; height: 100%; color: color-mix(in oklab, black 35%, transparent); }
  :global(.dark) .quiet-gap { color: color-mix(in oklab, white 35%, transparent); }
  .quiet-dots { padding-bottom: .35rem; font-size: 1.1rem; letter-spacing: .2rem; }
  .quiet-label { position: absolute; top: calc(100% + .45rem); white-space: nowrap; font-size: .6rem; }
  button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  @media (max-width: 640px) {
    .axis-label { display: none; }
    .bar-chart { height: 8rem; }
    .quiet-label { writing-mode: vertical-rl; top: calc(100% + .25rem); }
  }
  @media (prefers-reduced-motion: reduce) { .bar, .metric-controls button { transition: none; } }
  @media (forced-colors: active) { .bar { background: CanvasText; background-image: repeating-linear-gradient(45deg, transparent 0 3px, Canvas 3px 5px); } }
</style>
