<script lang="ts">
  import { onMount } from 'svelte'
  import Icon from '@iconify/svelte'
  import type {
    StatisticsData,
    StatisticsPost,
    StatisticsRange,
  } from '@/types/statistics'

  type SortKey = 'screenPageViews' | 'activeUsers' | 'engagementSecondsPerView'

  const ranges: Array<{ value: StatisticsRange; label: string }> = [
    { value: '7d', label: '7 天' },
    { value: '30d', label: '30 天' },
    { value: '90d', label: '90 天' },
    { value: 'all', label: '全部' },
  ]
  const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: 'screenPageViews', label: '访问量' },
    { value: 'activeUsers', label: '访客数' },
    { value: 'engagementSecondsPerView', label: '平均阅读时长' },
  ]
  const minimumUsers = 5

  let data: StatisticsData | null = null
  let loading = true
  let error = ''
  let range: StatisticsRange = '90d'
  let sortKey: SortKey = 'screenPageViews'

  const numberFormat = new Intl.NumberFormat('zh-CN')
  const compactFormat = new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 })

  function formatNumber(value: number) {
    return numberFormat.format(Math.round(value))
  }

  function formatDuration(totalSeconds: number) {
    const seconds = Math.max(0, Math.round(totalSeconds))
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (days > 0) return `${days} 天 ${hours} 小时`
    if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
    if (minutes > 0) return `${minutes} 分 ${remainingSeconds} 秒`
    return `${remainingSeconds} 秒`
  }

  function formatUpdated(value: string | null) {
    if (!value) return '等待首次统计'
    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Shanghai',
    }).format(new Date(value))
  }

  function rankingValue(post: StatisticsPost, key: SortKey) {
    if (key === 'engagementSecondsPerView' && post.activeUsers < minimumUsers) return -1
    return post[key]
  }

  $: posts = data
    ? [...data.ranges[range]].sort((a, b) => rankingValue(b, sortKey) - rankingValue(a, sortKey))
    : []
  $: maxPublications = data
    ? Math.max(1, ...data.content.publications.map((item) => item.count))
    : 1
  $: latestPublications = data?.content.publications.slice(-24) ?? []
  $: statusLabel = data?.status === 'fallback'
    ? '使用上一份可用数据'
    : data?.status === 'empty'
      ? '等待数据积累'
      : 'GA4 汇总数据'

  const summaryCards = (statistics: StatisticsData) => [
    ['文章', formatNumber(statistics.content.postCount), 'material-symbols:article-outline-rounded'],
    ['总字数', compactFormat.format(statistics.content.totalWords), 'material-symbols:notes-rounded'],
    ['访客', formatNumber(statistics.site.activeUsers), 'material-symbols:group-outline-rounded'],
    ['访问', formatNumber(statistics.site.screenPageViews), 'material-symbols:visibility-outline-rounded'],
    ['总阅读时长', formatDuration(statistics.site.engagementSeconds), 'material-symbols:hourglass-outline-rounded'],
    ['人均阅读', formatDuration(statistics.site.engagementSecondsPerUser), 'material-symbols:timer-outline-rounded'],
  ] as const

  onMount(async () => {
    try {
      const response = await fetch('/statistics.json', { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data = await response.json()
    } catch (reason) {
      console.error('Failed to load statistics:', reason)
      error = '统计数据暂时无法加载，请稍后再试。'
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <section class="card-base flex min-h-72 items-center justify-center p-8" aria-live="polite">
    <div class="flex items-center gap-3 text-black/50 dark:text-white/50">
      <Icon icon="material-symbols:progress-activity" class="animate-spin text-2xl" />
      正在读取统计数据
    </div>
  </section>
{:else if error || !data}
  <section class="card-base flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center" role="alert">
    <Icon icon="material-symbols:cloud-off-outline-rounded" class="text-4xl text-[var(--primary)]" />
    <h1 class="text-xl font-semibold text-black/80 dark:text-white/80">数据暂时离线</h1>
    <p class="max-w-md text-sm text-black/50 dark:text-white/50">{error}</p>
  </section>
{:else}
  <div class="flex flex-col gap-4">
    <section class="card-base relative overflow-hidden p-6 md:p-8">
      <div class="absolute -top-20 -right-14 h-52 w-52 rounded-full bg-[var(--primary)] opacity-[0.08] blur-2xl"></div>
      <div class="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-2 text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">Reading pulse</p>
          <h1 class="text-3xl font-bold tracking-tight text-black/90 md:text-4xl dark:text-white/90">这里的文字，正在被怎样读过</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-black/50 dark:text-white/50">
            从发布节奏到真实参与时长，这是一份会随阅读缓慢生长的站点切片。
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2 rounded-xl bg-black/[0.035] px-3 py-2 text-xs text-black/50 dark:bg-white/[0.06] dark:text-white/50">
          <span class:animate-pulse={data.status === 'live'} class="h-2 w-2 rounded-full bg-[var(--primary)]"></span>
          {statusLabel} · {formatUpdated(data.generatedAt)}
        </div>
      </div>
    </section>

    <section class="grid grid-cols-2 gap-3 lg:grid-cols-6" aria-label="全站统计概览">
      {#each summaryCards(data) as [label, value, icon]}
        <article class="card-base group p-4 md:p-5">
          <Icon {icon} class="mb-5 text-2xl text-[var(--primary)] opacity-70 transition group-hover:opacity-100" />
          <p class="text-xs text-black/45 dark:text-white/45">{label}</p>
          <p class="mt-1 text-xl font-semibold text-black/85 dark:text-white/85">{value}</p>
        </article>
      {/each}
    </section>

    <div class="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section class="card-base p-4 md:p-6">
        <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-lg font-semibold text-black/85 dark:text-white/85">文章阅读排行</p>
            <p class="mt-1 text-xs text-black/45 dark:text-white/45">同一时间范围内的访客、访问与参与时长</p>
          </div>
          <div class="flex flex-wrap gap-2" aria-label="统计范围">
            {#each ranges as item}
              <button
                type="button"
                class:active={range === item.value}
                class="range-button"
                aria-pressed={range === item.value}
                onclick={() => range = item.value}
              >{item.label}</button>
            {/each}
          </div>
        </div>

        <div class="mb-4 flex flex-wrap items-center gap-2 text-xs text-black/45 dark:text-white/45">
          <span>排序：</span>
          {#each sortOptions as item}
            <button
              type="button"
              class:active={sortKey === item.value}
              class="sort-button"
              aria-pressed={sortKey === item.value}
              onclick={() => sortKey = item.value}
            >{item.label}</button>
          {/each}
        </div>

        {#if posts.length === 0}
          <div class="flex min-h-64 flex-col items-center justify-center text-center">
            <Icon icon="material-symbols:hourglass-empty-rounded" class="mb-3 text-4xl text-[var(--primary)] opacity-60" />
            <p class="font-medium text-black/70 dark:text-white/70">这个时间范围还没有阅读记录</p>
            <p class="mt-1 text-sm text-black/40 dark:text-white/40">数据会在埋点上线后开始积累，并约每六小时更新。</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr class="border-b border-black/[0.07] text-xs text-black/40 dark:border-white/[0.09] dark:text-white/40">
                  <th class="w-12 px-2 py-3 font-medium">#</th>
                  <th class="px-2 py-3 font-medium">文章</th>
                  <th class="px-2 py-3 text-right font-medium">访客</th>
                  <th class="px-2 py-3 text-right font-medium">访问</th>
                  <th class="px-2 py-3 text-right font-medium">平均阅读</th>
                </tr>
              </thead>
              <tbody>
                {#each posts as post, index}
                  <tr class="border-b border-black/[0.045] transition last:border-0 hover:bg-black/[0.018] dark:border-white/[0.06] dark:hover:bg-white/[0.025]">
                    <td class="px-2 py-4 text-sm tabular-nums text-black/35 dark:text-white/35">{index + 1}</td>
                    <td class="px-2 py-4">
                      <a href={post.path} class="link font-medium text-black/80 dark:text-white/80">{post.title}</a>
                      <p class="mt-1 text-xs text-black/35 dark:text-white/35">预计 {post.estimatedMinutes} 分钟 · {formatNumber(post.words)} 字</p>
                    </td>
                    <td class="px-2 py-4 text-right text-sm tabular-nums text-black/65 dark:text-white/65">{formatNumber(post.activeUsers)}</td>
                    <td class="px-2 py-4 text-right text-sm tabular-nums text-black/65 dark:text-white/65">{formatNumber(post.screenPageViews)}</td>
                    <td class="px-2 py-4 text-right text-sm tabular-nums text-black/65 dark:text-white/65">
                      {#if post.activeUsers < minimumUsers}
                        <span title={`少于 ${minimumUsers} 位访客，暂不参与时长排名`} class="rounded-md bg-black/[0.04] px-2 py-1 text-xs text-black/40 dark:bg-white/[0.06] dark:text-white/40">样本不足</span>
                      {:else}
                        {formatDuration(post.engagementSecondsPerView)}
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>

      <aside class="card-base p-5 md:p-6">
        <div class="mb-5">
          <p class="text-lg font-semibold text-black/85 dark:text-white/85">发布脉冲</p>
          <p class="mt-1 text-xs text-black/45 dark:text-white/45">最近 24 个有文章发布的月份</p>
        </div>

        {#if latestPublications.length > 0}
          <div class="publication-chart" role="img" aria-label="每月发布文章数量柱状图">
            {#each latestPublications as item}
              <button
                type="button"
                class="bar-hit-area"
                title={`${item.month}：${item.count} 篇`}
                aria-label={`${item.month} 发布 ${item.count} 篇文章`}
              >
                <span class="bar" style={`height: ${Math.max(8, item.count / maxPublications * 100)}%`}></span>
              </button>
            {/each}
          </div>
          <div class="mt-3 flex justify-between text-[0.65rem] text-black/35 dark:text-white/35">
            <span>{latestPublications[0]?.month}</span>
            <span>{latestPublications.at(-1)?.month}</span>
          </div>
          <details class="mt-5 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
            <summary class="cursor-pointer text-xs font-medium text-black/50 dark:text-white/50">查看数据表</summary>
            <div class="mt-3 max-h-52 overflow-y-auto text-xs">
              {#each [...latestPublications].reverse() as item}
                <div class="flex justify-between border-b border-black/[0.04] py-2 last:border-0 dark:border-white/[0.05]">
                  <span class="text-black/45 dark:text-white/45">{item.month}</span>
                  <span class="tabular-nums text-black/70 dark:text-white/70">{item.count} 篇</span>
                </div>
              {/each}
            </div>
          </details>
        {/if}

        <div class="mt-6 rounded-xl bg-black/[0.025] p-4 text-xs leading-5 text-black/45 dark:bg-white/[0.045] dark:text-white/45">
          <p class="font-medium text-black/65 dark:text-white/65">数据如何理解</p>
          <p class="mt-2">阅读时长是 GA4 记录的参与时长，不代表访客始终在认真阅读。预计阅读时间则由文章字数计算。</p>
          <a href="/privacy/" class="link mt-3 inline-block text-[var(--primary)]">隐私与统计说明 →</a>
        </div>
      </aside>
    </div>
  </div>
{/if}

<style>
  .range-button,
  .sort-button {
    border-radius: 0.65rem;
    padding: 0.45rem 0.75rem;
    color: color-mix(in oklab, currentColor 55%, transparent);
    transition: 150ms ease;
  }

  .range-button:hover,
  .sort-button:hover {
    background: var(--btn-plain-bg-hover);
    color: var(--primary);
  }

  .range-button.active,
  .sort-button.active {
    background: color-mix(in oklab, var(--primary) 13%, transparent);
    color: var(--primary);
    font-weight: 600;
  }

  .publication-chart {
    display: flex;
    align-items: end;
    gap: 2px;
    height: 11rem;
    border-bottom: 1px solid color-mix(in oklab, currentColor 10%, transparent);
  }

  .bar-hit-area {
    display: flex;
    flex: 1;
    align-items: end;
    justify-content: center;
    height: 100%;
    min-width: 8px;
    padding: 0 1px;
  }

  .bar {
    width: min(100%, 24px);
    min-height: 8px;
    border-radius: 4px 4px 0 0;
    background: color-mix(in oklab, var(--primary) 72%, white 28%);
    transition: filter 150ms ease, transform 150ms ease;
  }

  .bar-hit-area:hover .bar,
  .bar-hit-area:focus-visible .bar {
    filter: saturate(1.2) brightness(1.05);
    transform: translateY(-2px);
  }

  .bar-hit-area:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .bar,
    .range-button,
    .sort-button {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .bar {
      background: CanvasText;
      background-image: repeating-linear-gradient(45deg, transparent 0 3px, Canvas 3px 5px);
    }
  }
</style>
