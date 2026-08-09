<script lang="ts">
  import { onMount } from 'svelte'
  import Icon from '@iconify/svelte'
  import GraphView from '@/components/GraphView.svelte'
  import StatisticsView from '@/components/StatisticsView.svelte'

  type InsightsView = 'overview' | 'graph'

  const tabs: Array<{ value: InsightsView; label: string; description: string; icon: string }> = [
    {
      value: 'overview',
      label: '统计概览',
      description: '发布轨迹与阅读回声',
      icon: 'material-symbols:query-stats-rounded',
    },
    {
      value: 'graph',
      label: '关系图谱',
      description: '文章之间的引用脉络',
      icon: 'material-symbols:hub-outline-rounded',
    },
  ]

  let view: InsightsView = 'overview'
  let mounted = false

  function viewFromUrl(): InsightsView {
    return new URL(window.location.href).searchParams.get('view') === 'graph' ? 'graph' : 'overview'
  }

  function selectView(nextView: InsightsView) {
    view = nextView
    if (!mounted) return
    const url = new URL(window.location.href)
    if (nextView === 'graph') url.searchParams.set('view', 'graph')
    else url.searchParams.delete('view')
    window.history.pushState({ ...window.history.state, insightsView: nextView }, '', url)
  }

  function onTabKeydown(event: KeyboardEvent, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    selectView(tabs[nextIndex].value)
    requestAnimationFrame(() => document.getElementById(`insights-tab-${tabs[nextIndex].value}`)?.focus())
  }

  onMount(() => {
    view = viewFromUrl()
    mounted = true
    const onPopState = () => view = viewFromUrl()
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  })
</script>

<div class="flex flex-col gap-4">
  <nav class="card-base p-2" aria-label="统计与图谱视图">
    <div class="grid grid-cols-2 gap-1" role="tablist" aria-label="数据视图">
      {#each tabs as tab, index}
        <button
          id={`insights-tab-${tab.value}`}
          type="button"
          role="tab"
          aria-selected={view === tab.value}
          aria-controls={`insights-panel-${tab.value}`}
          tabindex={view === tab.value ? 0 : -1}
          class:active={view === tab.value}
          class="insights-tab"
          onclick={() => selectView(tab.value)}
          onkeydown={(event) => onTabKeydown(event, index)}
        >
          <span class="insights-icon"><Icon icon={tab.icon} /></span>
          <span class="min-w-0 text-left">
            <span class="block text-sm font-semibold">{tab.label}</span>
            <span class="mt-0.5 hidden text-[0.65rem] opacity-60 sm:block">{tab.description}</span>
          </span>
        </button>
      {/each}
    </div>
  </nav>

  {#if view === 'overview'}
    <section id="insights-panel-overview" role="tabpanel" aria-labelledby="insights-tab-overview">
      <StatisticsView />
    </section>
  {:else}
    <section id="insights-panel-graph" role="tabpanel" aria-labelledby="insights-tab-graph">
      <GraphView mode="full" />
    </section>
  {/if}
</div>

<style>
  .insights-tab {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
    gap: .65rem;
    border-radius: calc(var(--radius-large) - .35rem);
    padding: .7rem .8rem;
    color: rgba(0, 0, 0, .58);
    transition: 160ms ease;
  }
  :global(.dark) .insights-tab { color: rgba(255, 255, 255, .62); }
  .insights-tab:hover { color: var(--primary); background: var(--btn-plain-bg-hover); }
  .insights-tab.active { color: var(--primary); background: color-mix(in oklab, var(--primary) 11%, transparent); }
  :global(.dark) .insights-tab.active { color: var(--primary); }
  .insights-icon { display: grid; flex-shrink: 0; place-items: center; font-size: 1.35rem; }
  @media (prefers-reduced-motion: reduce) { .insights-tab { transition: none; } }
</style>
