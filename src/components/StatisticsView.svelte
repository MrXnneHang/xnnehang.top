<script lang="ts">
  import { onMount } from 'svelte'
  import Icon from '@iconify/svelte'
  import WritingTrail from '@/components/statistics/WritingTrail.svelte'
  import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales'
  import type {
    StatisticsContentCatalog,
    StatisticsData,
    StatisticsPost,
    StatisticsRange,
  } from '@/types/statistics'
  import { url } from '@/utils/url-utils'
  import {
    formatStatisticsCompact,
    formatStatisticsDuration,
    formatStatisticsNumber,
    formatStatisticsUpdated,
    getStatisticsContentPath,
    getStatisticsDataPath,
    getStatisticsLabels,
  } from '@/utils/statistics-locale'

  type SortKey = 'screenPageViews' | 'activeUsers' | 'engagementSecondsPerUser'

  export let locale: Locale = DEFAULT_LOCALE
  $: labels = getStatisticsLabels(locale)
  $: ranges = (['7d', '30d', '90d', 'all'] as StatisticsRange[]).map((value) => ({ value, label: labels.readingRanges[value] }))
  $: sortOptions = [
    { value: 'screenPageViews' as const, label: labels.sortViews },
    { value: 'activeUsers' as const, label: labels.sortVisitors },
    { value: 'engagementSecondsPerUser' as const, label: labels.sortDuration },
  ]
  const minimumUsers = 5

  let data: StatisticsData | null = null
  let loading = true
  let error = ''
  let range: StatisticsRange = '90d'
  let sortKey: SortKey = 'engagementSecondsPerUser'

  function rankingValue(post: StatisticsPost, key: SortKey) {
    if (key === 'engagementSecondsPerUser' && post.activeUsers < minimumUsers) return -1
    return post[key]
  }

  $: posts = data ? [...data.ranges[range]].sort((a, b) => rankingValue(b, sortKey) - rankingValue(a, sortKey)) : []
  $: statusLabel = data?.status === 'fallback' ? labels.statusFallback : data?.status === 'empty' ? labels.statusEmpty : labels.statusLive

  const summaryCards = (statistics: StatisticsData) => [
    [labels.articles, formatStatisticsNumber(statistics.content.postCount, locale), 'material-symbols:article-outline-rounded'],
    [labels.totalWords, formatStatisticsCompact(statistics.content.totalWords, locale), 'material-symbols:notes-rounded'],
    [labels.visitors, formatStatisticsNumber(statistics.site.activeUsers, locale), 'material-symbols:group-outline-rounded'],
    [labels.views, formatStatisticsNumber(statistics.site.screenPageViews, locale), 'material-symbols:visibility-outline-rounded'],
    [labels.totalReadingTime, formatStatisticsDuration(statistics.site.engagementSeconds, locale), 'material-symbols:hourglass-outline-rounded'],
    [labels.readingPerVisitor, formatStatisticsDuration(statistics.site.engagementSecondsPerUser, locale), 'material-symbols:timer-outline-rounded'],
  ] as const

  onMount(async () => {
    try {
      const [statisticsResult, contentResult] = await Promise.allSettled([
        fetch(getStatisticsDataPath(locale), { cache: 'no-store' }).then(async (response) => {
          if (!response.ok) throw new Error(`Statistics snapshot returned HTTP ${response.status}`)
          return response.json() as Promise<StatisticsData>
        }),
        fetch(getStatisticsContentPath(locale), { cache: 'no-store' }).then(async (response) => {
          if (!response.ok) throw new Error(`Statistics catalog returned HTTP ${response.status}`)
          return response.json() as Promise<StatisticsContentCatalog>
        }),
      ])

      let nextData: StatisticsData | null = null
      let catalog: StatisticsContentCatalog | null = null

      if (statisticsResult.status === 'fulfilled' && statisticsResult.value.locale === locale) {
        nextData = statisticsResult.value
      }
      if (contentResult.status === 'fulfilled') catalog = contentResult.value

      if (!nextData && !catalog) throw new Error('Statistics snapshot and content catalog are unavailable')
      nextData ??= {
        version: 3,
        locale,
        generatedAt: null,
        status: 'empty',
        source: 'ga4',
        site: {
          activeUsers: 0,
          screenPageViews: 0,
          engagementSeconds: 0,
          engagementSecondsPerUser: 0,
        },
        content: catalog!.totals,
        ranges: { '7d': [], '30d': [], '90d': [], all: [] },
      }
      if (catalog) nextData.content = catalog.totals
      data = nextData
    } catch (reason) {
      console.error('Failed to load statistics:', reason)
      error = labels.loadError
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <section class="card-base flex min-h-72 items-center justify-center p-8" aria-live="polite"><div class="flex items-center gap-3 text-black/50 dark:text-white/50"><Icon icon="material-symbols:progress-activity" class="animate-spin text-2xl" />{labels.loading}</div></section>
{:else if error || !data}
  <section class="card-base flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center" role="alert"><Icon icon="material-symbols:cloud-off-outline-rounded" class="text-4xl text-[var(--primary)]" /><h1 class="text-xl font-semibold text-black/80 dark:text-white/80">{labels.offlineTitle}</h1><p class="max-w-md text-sm text-black/50 dark:text-white/50">{error}</p></section>
{:else}
  <div class="flex flex-col gap-4">
    <WritingTrail content={data.content} {locale} />

    <section class="card-base relative overflow-hidden p-6 md:p-8">
      <div class="absolute -top-20 -right-14 h-52 w-52 rounded-full bg-[var(--primary)] opacity-[0.08] blur-2xl"></div>
      <div class="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div><p class="mb-2 text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">{labels.readingKicker}</p><h1 class="text-3xl font-bold tracking-tight text-black/90 md:text-4xl dark:text-white/90">{labels.readingTitle}</h1><p class="mt-3 max-w-2xl text-sm leading-6 text-black/50 dark:text-white/50">{labels.readingDescription}</p></div>
        <div class="flex shrink-0 items-center gap-2 rounded-xl bg-black/[0.035] px-3 py-2 text-xs text-black/50 dark:bg-white/[0.06] dark:text-white/50"><span class:animate-pulse={data.status === 'live'} class="h-2 w-2 rounded-full bg-[var(--primary)]"></span>{statusLabel} · {formatStatisticsUpdated(data.generatedAt, locale)}</div>
      </div>
    </section>

    <section class="grid grid-cols-2 gap-3 lg:grid-cols-6" aria-label={labels.summaryAria}>
      {#each summaryCards(data) as [label, value, icon]}<article class="card-base group p-4 md:p-5"><Icon {icon} class="mb-5 text-2xl text-[var(--primary)] opacity-70 transition group-hover:opacity-100" /><p class="text-xs text-black/45 dark:text-white/45">{label}</p><p class="mt-1 text-xl font-semibold text-black/85 dark:text-white/85">{value}</p></article>{/each}
    </section>

    <section class="card-base p-4 md:p-6">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p class="text-lg font-semibold text-black/85 dark:text-white/85">{labels.rankingTitle}</p><p class="mt-1 text-xs text-black/45 dark:text-white/45">{labels.rankingDescription}</p></div><div class="flex flex-wrap gap-2" aria-label={labels.readingRangeAria}>{#each ranges as item}<button type="button" class:active={range === item.value} class="range-button" aria-pressed={range === item.value} onclick={() => range = item.value}>{item.label}</button>{/each}</div></div>
      <div class="mb-4 flex flex-wrap items-center gap-2 text-xs text-black/45 dark:text-white/45"><span>{labels.sort}</span>{#each sortOptions as item}<button type="button" class:active={sortKey === item.value} class="sort-button" aria-pressed={sortKey === item.value} onclick={() => sortKey = item.value}>{item.label}</button>{/each}</div>

      {#if posts.length === 0}
        <div class="flex min-h-64 flex-col items-center justify-center text-center"><Icon icon="material-symbols:hourglass-empty-rounded" class="mb-3 text-4xl text-[var(--primary)] opacity-60" /><p class="font-medium text-black/70 dark:text-white/70">{labels.noReading}</p><p class="mt-1 text-sm text-black/40 dark:text-white/40">{labels.noReadingDescription}</p></div>
      {:else}
        <div class="overflow-x-auto"><table class="w-full min-w-[42rem] border-collapse text-left"><thead><tr class="border-b border-black/[0.07] text-xs text-black/40 dark:border-white/[0.09] dark:text-white/40"><th class="w-12 px-2 py-3 font-medium">#</th><th class="px-2 py-3 font-medium">{labels.rankArticle}</th><th class="px-2 py-3 text-right font-medium">{labels.visitors}</th><th class="px-2 py-3 text-right font-medium">{labels.views}</th><th class="px-2 py-3 text-right font-medium">{labels.averageReading}</th></tr></thead><tbody>
          {#each posts as post, index}<tr class="border-b border-black/[0.045] transition last:border-0 hover:bg-black/[0.018] dark:border-white/[0.06] dark:hover:bg-white/[0.025]"><td class="px-2 py-4 text-sm tabular-nums text-black/35 dark:text-white/35">{index + 1}</td><td class="px-2 py-4"><a href={post.path} class="link font-medium text-black/80 dark:text-white/80">{post.title}</a><p class="mt-1 text-xs text-black/35 dark:text-white/35">{labels.estimatedReading(post.estimatedMinutes, formatStatisticsNumber(post.words, locale))}</p></td><td class="px-2 py-4 text-right text-sm tabular-nums text-black/65 dark:text-white/65">{formatStatisticsNumber(post.activeUsers, locale)}</td><td class="px-2 py-4 text-right text-sm tabular-nums text-black/65 dark:text-white/65">{formatStatisticsNumber(post.screenPageViews, locale)}</td><td class="px-2 py-4 text-right text-sm tabular-nums text-black/65 dark:text-white/65">{#if post.activeUsers < minimumUsers}<span title={labels.insufficientSampleTitle(minimumUsers)} class="rounded-md bg-black/[0.04] px-2 py-1 text-xs text-black/40 dark:bg-white/[0.06] dark:text-white/40">{labels.insufficientSample}</span>{:else}{formatStatisticsDuration(post.engagementSecondsPerUser, locale)}{/if}</td></tr>{/each}
        </tbody></table></div>
      {/if}
      <div class="mt-5 rounded-xl bg-black/[0.025] p-4 text-xs leading-5 text-black/45 dark:bg-white/[0.045] dark:text-white/45"><p class="font-medium text-black/65 dark:text-white/65">{labels.interpretationTitle}</p><p class="mt-2">{labels.interpretation}</p><a href={url('/privacy/', locale)} class="link mt-3 inline-block text-[var(--primary)]">{labels.privacyLink}</a></div>
    </section>
  </div>
{/if}

<style>
  .range-button, .sort-button { border-radius: 0.65rem; padding: 0.45rem 0.75rem; color: color-mix(in oklab, currentColor 55%, transparent); transition: 150ms ease; }
  .range-button:hover, .sort-button:hover { background: var(--btn-plain-bg-hover); color: var(--primary); }
  .range-button.active, .sort-button.active { background: color-mix(in oklab, var(--primary) 13%, transparent); color: var(--primary); font-weight: 600; }
  @media (prefers-reduced-motion: reduce) { .range-button, .sort-button { transition: none; } }
</style>
