<script lang="ts">
  import Icon from '@iconify/svelte'
  import { onMount, tick } from 'svelte'
  import type { StatisticsPublicationDay } from '@/types/statistics'
  import { formatDate, postDetails } from './writing-trail-utils'

  export let days: StatisticsPublicationDay[] = undefined!

  let activeDate = ''
  let selectedYear = 0
  let calendarScroll: HTMLDivElement
  let calendarScrollLeft = 0
  let calendarScrollWidth = 0
  let calendarClientWidth = 0
  $: years = [...new Set(days.map((day) => Number(day.date.slice(0, 4))))].sort((a, b) => a - b)
  $: calendarYear = selectedYear || (years.at(-1) ?? new Date().getFullYear())
  $: yearDays = days.filter((day) => day.date.startsWith(`${calendarYear}-`))
  $: dayMap = new Map(yearDays.map((day) => [day.date, day]))
  $: maxCount = Math.max(1, ...yearDays.map((day) => day.count))
  $: calendar = buildCalendar(calendarYear)
  $: monthMarkers = buildMonthMarkers(calendar)
  $: activeDay = activeDate ? dayMap.get(activeDate) : undefined
  $: canPageCalendarBack = calendarScrollLeft > 0
  $: canPageCalendarForward = calendarScrollLeft < calendarScrollWidth - calendarClientWidth - 1

  function buildCalendar(year: number) {
    const start = new Date(Date.UTC(year, 0, 1))
    const end = new Date(Date.UTC(year, 11, 31))
    const mondayOffset = (start.getUTCDay() + 6) % 7
    const dates: Array<{ date: string; inYear: boolean }> = []
    const gridStart = new Date(start)
    gridStart.setUTCDate(start.getUTCDate() - mondayOffset)

    for (let cursor = gridStart; cursor <= end || dates.length % 7 !== 0; cursor = new Date(cursor.getTime() + 86400000)) {
      dates.push({
        date: cursor.toISOString().slice(0, 10),
        inYear: cursor.getUTCFullYear() === year,
      })
    }
    return dates
  }

  function buildMonthMarkers(cells: Array<{ date: string; inYear: boolean }>) {
    const markers: Array<{ week: number; label: string }> = []
    let previousMonth = ''
    for (let week = 0; week < cells.length / 7; week += 1) {
      const inYearCell = cells.slice(week * 7, week * 7 + 7).find((cell) => cell.inYear)
      const month = inYearCell?.date.slice(0, 7) ?? ''
      if (month && month !== previousMonth) {
        markers.push({ week, label: `${Number(month.slice(5))} 月` })
        previousMonth = month
      }
    }
    return markers
  }

  async function selectYear(year: number) {
    selectedYear = year
    activeDate = ''
    await tick()
    resetCalendarViewport()
  }

  function updateCalendarViewport() {
    calendarScrollLeft = calendarScroll.scrollLeft
    calendarScrollWidth = calendarScroll.scrollWidth
    calendarClientWidth = calendarScroll.clientWidth
  }

  function resetCalendarViewport() {
    calendarScroll.scrollLeft = 0
    updateCalendarViewport()
  }

  function pageCalendar(direction: -1 | 1) {
    const maxScrollLeft = calendarScrollWidth - calendarClientWidth
    const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, calendarScrollLeft + direction * calendarClientWidth))
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    calendarScroll.scrollTo({ left: nextScrollLeft, behavior })
    calendarScrollLeft = nextScrollLeft
  }

  onMount(() => {
    updateCalendarViewport()
    const observer = new ResizeObserver(updateCalendarViewport)
    observer.observe(calendarScroll)
    return () => observer.disconnect()
  })

  function level(count: number) {
    if (count === 0) return 0
    return Math.max(1, Math.ceil(count / maxCount * 4))
  }
</script>

<section class="card-base p-4 md:p-6" aria-labelledby="publication-calendar-title">
  <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h3 id="publication-calendar-title" class="text-lg font-semibold text-black/85 dark:text-white/85">发布日历</h3>
      <p class="mt-1 text-xs text-black/45 dark:text-white/45">记录作品发布的日期，不等同于实际写作日</p>
    </div>
    <div class="calendar-controls" aria-label="日历视图">
      <button class="year-button" type="button" disabled={!canPageCalendarBack} aria-label="查看更早月份" onclick={() => pageCalendar(-1)}>
        <Icon icon="material-symbols:chevron-left-rounded" />
      </button>
      <button class="year-button" type="button" disabled={!canPageCalendarForward} aria-label="查看更晚月份" onclick={() => pageCalendar(1)}>
        <Icon icon="material-symbols:chevron-right-rounded" />
      </button>
    </div>
  </div>

  <div class="calendar-layout">
    <div class="calendar-scroll" bind:this={calendarScroll} onscroll={updateCalendarViewport}>
      <div class="calendar-shell" style={`--week-count: ${calendar.length / 7}`}>
        <div class="month-spacer"></div>
        <div class="month-labels" aria-hidden="true">
          {#each monthMarkers as marker}<span style={`grid-column: ${marker.week + 1}`}>{marker.label}</span>{/each}
        </div>
        <div class="weekday-labels" aria-hidden="true">
          <span>一</span><span></span><span>三</span><span></span><span>五</span><span></span><span>日</span>
        </div>
        <div class="calendar-grid" role="grid" aria-label={`${calendarYear} 年发布日历`}>
          {#each calendar as cell}
            {@const day = dayMap.get(cell.date)}
            {#if cell.inYear && day}
              <button
                type="button"
                class="calendar-hit"
                class:selected={activeDate === cell.date}
                aria-label={`${formatDate(day.date)}发布 ${day.count} 篇：${postDetails(day.posts)}`}
                title={`${formatDate(day.date)} · ${day.count} 篇\n${postDetails(day.posts)}`}
                onmouseenter={() => activeDate = day.date}
                onfocus={() => activeDate = day.date}
                onclick={() => activeDate = day.date}
              ><span class="calendar-mark" data-level={level(day.count)}></span></button>
            {:else}
              <span class="calendar-hit" aria-hidden="true"><span class="calendar-mark" class:outside={!cell.inYear}></span></span>
            {/if}
          {/each}
        </div>
      </div>
    </div>
    {#if years.length > 1}
      <div class="year-tabs" aria-label="日历年份">
        {#each years as year}
          <button type="button" aria-pressed={calendarYear === year} class:active={calendarYear === year} onclick={() => selectYear(year)}>{year}</button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="mt-3 flex items-center justify-end gap-2 text-[0.65rem] text-black/35 dark:text-white/35" aria-label="发布数量色阶">
    <span>少</span>
    {#each [0, 1, 2, 3, 4] as item}<span class="legend-cell" data-level={item}></span>{/each}
    <span>多</span>
  </div>

  {#if activeDay}
    <div class="active-detail mt-4" aria-live="polite">
      <p class="text-sm font-semibold text-black/75 dark:text-white/75">{formatDate(activeDay.date)} · {activeDay.count} 篇</p>
      <ul class="mt-2 space-y-1 text-sm">
        {#each activeDay.posts as post}
          <li><a class="link text-black/65 dark:text-white/65" href={post.path}>{post.title}</a></li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  .year-button { display: grid; width: 2rem; height: 2rem; place-items: center; border-radius: .65rem; color: color-mix(in oklab, black 55%, transparent); }
  :global(.dark) .year-button { color: color-mix(in oklab, white 55%, transparent); }
  .year-button:hover:not(:disabled) { background: var(--btn-plain-bg-hover); color: var(--primary); }
  .year-button:disabled { opacity: .25; }
  .calendar-controls { display: flex; gap: .125rem; }
  .calendar-layout { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .75rem; align-items: start; }
  .calendar-scroll { min-width: 0; overflow-x: auto; scrollbar-width: none; }
  .calendar-scroll::-webkit-scrollbar { display: none; }
  .year-tabs { display: flex; flex-direction: column; gap: .25rem; align-items: stretch; }
  .year-tabs button { min-width: 3.5rem; border-radius: .65rem; padding: .45rem .65rem; color: color-mix(in oklab, black 55%, transparent); font-size: .75rem; font-variant-numeric: tabular-nums; transition: 150ms ease; }
  :global(.dark) .year-tabs button { color: color-mix(in oklab, white 55%, transparent); }
  .year-tabs button:hover { background: var(--btn-plain-bg-hover); color: var(--primary); }
  .year-tabs button.active { background: color-mix(in oklab, var(--primary) 13%, transparent); color: var(--primary); font-weight: 600; }
  .calendar-shell { display: grid; grid-template-columns: 1rem max-content; grid-template-rows: 1.2rem auto; gap: .25rem .55rem; min-width: max-content; }
  .month-labels { display: grid; grid-template-columns: repeat(var(--week-count), 24px); gap: 2px; color: color-mix(in oklab, black 38%, transparent); font-size: .625rem; }
  :global(.dark) .month-labels { color: color-mix(in oklab, white 38%, transparent); }
  .month-labels span { white-space: nowrap; }
  .weekday-labels { display: grid; grid-template-rows: repeat(7, 24px); width: 1rem; align-items: center; color: color-mix(in oklab, black 35%, transparent); font-size: .625rem; }
  :global(.dark) .weekday-labels { color: color-mix(in oklab, white 35%, transparent); }
  .calendar-grid { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 24px); grid-auto-columns: 24px; gap: 2px; }
  .calendar-hit { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 4px; }
  .calendar-mark, .legend-cell { width: 18px; height: 18px; border-radius: 4px; background: color-mix(in oklab, black 6%, transparent); }
  .legend-cell { width: 12px; height: 12px; border-radius: 3px; }
  :global(.dark) .calendar-mark, :global(.dark) .legend-cell { background: color-mix(in oklab, white 8%, transparent); }
  .calendar-mark.outside { background: transparent; }
  .calendar-mark[data-level="1"], .legend-cell[data-level="1"] { background: color-mix(in oklab, var(--primary) 28%, var(--card-bg)); }
  .calendar-mark[data-level="2"], .legend-cell[data-level="2"] { background: color-mix(in oklab, var(--primary) 48%, var(--card-bg)); }
  .calendar-mark[data-level="3"], .legend-cell[data-level="3"] { background: color-mix(in oklab, var(--primary) 70%, var(--card-bg)); }
  .calendar-mark[data-level="4"], .legend-cell[data-level="4"] { background: var(--primary); }
  button.calendar-hit .calendar-mark { transition: filter 150ms ease, transform 150ms ease; }
  button.calendar-hit:hover .calendar-mark, button.calendar-hit:focus-visible .calendar-mark, .calendar-hit.selected .calendar-mark { filter: saturate(1.15) brightness(1.04); transform: scale(1.2); }
  .active-detail { min-height: 4.25rem; border-radius: .8rem; background: color-mix(in oklab, var(--primary) 6%, transparent); padding: .8rem 1rem; }
  button:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
  @media (prefers-reduced-motion: reduce) { button.calendar-hit .calendar-mark { transition: none; } }
  @media (forced-colors: active) { button.calendar-hit .calendar-mark { border: 1px solid CanvasText; background: Canvas; background-image: repeating-linear-gradient(45deg, transparent 0 3px, CanvasText 3px 5px); } }
</style>
