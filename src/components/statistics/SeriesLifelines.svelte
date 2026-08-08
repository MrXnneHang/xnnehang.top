<script lang="ts">
  import type { StatisticsSeriesLifeline } from '@/types/statistics'
  import { formatDate, formatNumber, seriesUrl, type TrailRange } from './writing-trail-utils'

  export let lifelines: StatisticsSeriesLifeline[] = undefined!
  export let range: TrailRange = undefined!
  export let rangeStart: string = undefined!

  type Sort = 'recent' | 'duration' | 'activity'
  let sort: Sort = 'recent'
  let activeSeries = ''
  let activePath = ''
  $: filtered = lifelines
    .map((series) => {
      const posts = series.posts.filter((post) => range === 'all' || post.published.slice(0, 7) >= rangeStart)
      if (posts.length === 0) return null
      return {
        ...series,
        firstPublished: posts[0].published,
        lastPublished: posts.at(-1)!.published,
        postCount: posts.length,
        totalWords: posts.reduce((sum, post) => sum + post.words, 0),
        posts,
      }
    })
    .filter((series): series is StatisticsSeriesLifeline => series !== null)
  $: sorted = [...filtered].sort((a, b) => {
    if (sort === 'duration') return duration(b) - duration(a) || b.lastPublished.localeCompare(a.lastPublished)
    if (sort === 'activity') return b.postCount - a.postCount || b.lastPublished.localeCompare(a.lastPublished)
    return b.lastPublished.localeCompare(a.lastPublished) || b.postCount - a.postCount
  })
  $: allDates = filtered.flatMap((series) => series.posts.map((post) => post.published)).sort()
  $: firstDate = allDates[0] ?? ''
  $: lastDate = allDates.at(-1) ?? ''
  $: totalSpan = firstDate && lastDate ? Math.max(1, durationBetween(firstDate, lastDate)) : 1
  $: maxWords = Math.max(1, ...filtered.flatMap((series) => series.posts.map((post) => post.words)))
  $: activePost = filtered.find((series) => series.name === activeSeries)?.posts.find((post) => post.path === activePath)

  function durationBetween(first: string, last: string) {
    return Math.round((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / 86400000)
  }
  function duration(series: StatisticsSeriesLifeline) {
    return durationBetween(series.firstPublished, series.lastPublished)
  }
  function position(date: string) {
    return durationBetween(firstDate, date) / totalSpan * 100
  }
  function dotSize(words: number) {
    return 8 + Math.sqrt(words / maxWords) * 8
  }
</script>

<section class="time-part" aria-labelledby="series-lifelines-title">
  <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="part-kicker">系列延伸</p>
      <h4 id="series-lifelines-title" class="mt-1 text-base font-semibold text-black/85 dark:text-white/85">系列生命线</h4>
      <p class="mt-1 text-xs text-black/45 dark:text-white/45">同一时间切片中，系列何时延续或停顿</p>
    </div>
    <div class="sort-controls" aria-label="系列排序">
      {#each [{ value: 'recent', label: '最近活跃' }, { value: 'duration', label: '跨度' }, { value: 'activity', label: '文章数' }] as item}
        <button type="button" class:active={sort === item.value} aria-pressed={sort === item.value} onclick={() => sort = item.value as Sort}>{item.label}</button>
      {/each}
    </div>
  </div>

  <p class="mb-5 rounded-xl bg-black/[0.025] p-3 text-xs leading-5 text-black/45 dark:bg-white/[0.045] dark:text-white/45">同一篇文章可以属于多个系列，因此各系列文章数会重叠，不能相加为全站文章总数。Git 提交次数只代表文件历史触达，不等于语义重写次数。</p>

  {#if sorted.length === 0}
    <p class="py-12 text-center text-sm text-black/40 dark:text-white/40">这个时间范围还没有系列更新</p>
  {:else}
    <div class="timeline-scroll">
      <div class="timeline">
        <div class="timeline-axis"><span>{firstDate}</span><span>{lastDate}</span></div>
        {#each sorted as series}
          <div class="series-row">
            <div class="series-label">
              <a class="link font-medium text-black/75 dark:text-white/75" href={seriesUrl(series.name)}>{series.name}</a>
              <span>{series.postCount} 篇 · {formatNumber(series.totalWords)} 字</span>
            </div>
            <div class="series-track" aria-label={`${series.name}，${series.postCount} 篇，从 ${series.firstPublished} 到 ${series.lastPublished}`}>
              <span class="lifeline" style={`left: ${position(series.firstPublished)}%; width: ${Math.max(.5, position(series.lastPublished) - position(series.firstPublished))}%`}></span>
              {#each series.posts as post}
                <a
                  href={post.path}
                  class="point-hit"
                  style={`left: ${position(post.published)}%`}
                  aria-label={`${post.title}，${formatDate(post.published)}，${formatNumber(post.words)} 字`}
                  title={`${post.title}\n${formatDate(post.published)} · ${formatNumber(post.words)} 字`}
                  onmouseenter={() => { activeSeries = series.name; activePath = post.path }}
                  onfocus={() => { activeSeries = series.name; activePath = post.path }}
                ><span class="point" style={`width: ${dotSize(post.words)}px; height: ${dotSize(post.words)}px`}></span></a>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if activePost}
    <p class="mt-4 text-sm text-black/60 dark:text-white/60" aria-live="polite"><a class="link font-semibold" href={activePost.path}>{activePost.title}</a> · {formatDate(activePost.published)} · {formatNumber(activePost.words)} 字</p>
  {/if}
</section>

<style>
  .part-kicker { color: var(--primary); font-size: .65rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .sort-controls { display: flex; flex-wrap: wrap; gap: .25rem; }
  .sort-controls button { border-radius: .65rem; padding: .45rem .75rem; color: color-mix(in oklab, black 55%, transparent); font-size: .75rem; transition: 150ms ease; }
  :global(.dark) .sort-controls button { color: color-mix(in oklab, white 55%, transparent); }
  .sort-controls button:hover { background: var(--btn-plain-bg-hover); color: var(--primary); }
  .sort-controls button.active { background: color-mix(in oklab, var(--primary) 13%, transparent); color: var(--primary) !important; font-weight: 600; }
  .timeline-scroll { overflow: hidden; padding-bottom: .5rem; }
  .timeline { width: 100%; }
  .timeline-axis { display: flex; justify-content: space-between; margin-left: clamp(6rem, 18vw, 11rem); padding-bottom: .5rem; color: color-mix(in oklab, black 35%, transparent); font-size: .625rem; }
  :global(.dark) .timeline-axis { color: color-mix(in oklab, white 35%, transparent); }
  .series-row { display: grid; grid-template-columns: minmax(5.5rem, 10rem) minmax(0, 1fr); min-height: 3.25rem; align-items: center; gap: clamp(.5rem, 2vw, 1rem); border-top: 1px solid var(--line-divider); }
  .series-label { display: flex; min-width: 0; flex-direction: column; gap: .2rem; font-size: .8rem; }
  .series-label a { overflow-wrap: anywhere; }
  .series-label span { color: color-mix(in oklab, black 38%, transparent); font-size: .65rem; }
  :global(.dark) .series-label span { color: color-mix(in oklab, white 38%, transparent); }
  .series-track { position: relative; height: 2rem; margin-inline: 12px; }
  .lifeline { position: absolute; top: calc(50% - 1px); height: 2px; border-radius: 999px; background: color-mix(in oklab, var(--primary) 55%, var(--line-divider)); }
  .point-hit { position: absolute; top: 50%; display: grid; width: 24px; height: 24px; place-items: center; transform: translate(-50%, -50%); border-radius: 999px; }
  .point { display: block; border: 2px solid var(--card-bg); border-radius: 999px; background: var(--primary); transition: filter 150ms ease, transform 150ms ease; }
  .point-hit:hover .point, .point-hit:focus-visible .point { filter: saturate(1.2) brightness(1.08); transform: scale(1.12); }
  a:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  @media (max-width: 640px) {
    .timeline-axis { margin-left: 6rem; }
    .series-row { grid-template-columns: 5.5rem minmax(0, 1fr); }
    .series-label { font-size: .7rem; }
    .series-label span { font-size: .58rem; }
  }
  @media (prefers-reduced-motion: reduce) { .point, .sort-controls button { transition: none; } }
  @media (forced-colors: active) { .lifeline, .point { border-color: Canvas; background: CanvasText; } }
</style>
