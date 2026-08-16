<script lang="ts">
  import { onMount } from 'svelte'
  import Icon from '@iconify/svelte'
  import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force'
  import type { GraphNode, SerializedGraph } from '@/types/graph'
  import { getGraphCategoryOrder, getGraphLabels } from '@/utils/graph-locale'
  import { getPostUrlBySlug } from '@/utils/url-utils'
  import { getStatisticsGraphPath } from '@/utils/statistics-locale'
  import {
    countGraph,
    getNodeRelations,
    getOneHopGraph,
    searchGraphNodes,
    withoutIsolatedNodes,
  } from '@/utils/graph-view'

  interface Props {
    mode?: 'full' | 'mini'
    currentSlug?: string
    graphData?: SerializedGraph | null
    locale?: 'zh-CN' | 'en'
  }

  interface SimNode extends GraphNode {
    x: number
    y: number
    vx: number
    vy: number
  }

  interface SimLink {
    source: SimNode
    target: SimNode
  }

  const categoryColors: Record<string, [string, string]> = {
    观后: ['#2a78d6', '#3987e5'], Reviews: ['#2a78d6', '#3987e5'],
    思考: ['#eb6834', '#d95926'], Reflections: ['#eb6834', '#d95926'],
    边写边学: ['#1baf7a', '#199e70'], 'Learning as I Build': ['#1baf7a', '#199e70'],
    教程: ['#4a3aa7', '#9085e9'], Tutorials: ['#4a3aa7', '#9085e9'],
    资源: ['#e87ba4', '#d55181'], Resources: ['#e87ba4', '#d55181'],
  }
  const fallbackCategoryColor = ['#64748b', '#94a3b8'] as const

  let { mode = 'full', currentSlug = '', graphData = null, locale = 'zh-CN' }: Props = $props()
  let labels = $derived(getGraphLabels(locale))
  let categoryOrder = $derived(getGraphCategoryOrder(locale))

  let explorer: HTMLElement | undefined = $state(undefined)
  let container: HTMLDivElement | undefined = $state(undefined)
  let width = $state(800)
  let height = $state(mode === 'mini' ? 300 : 560)
  let dark = $state(false)
  let loading = $state(mode === 'full')
  let error = $state('')
  let showIsolated = $state(false)
  let rawGraph: SerializedGraph | null = $state(graphData)
  let simNodes: SimNode[] = $state([])
  let simLinks: SimLink[] = $state([])
  let scale = $state(1)
  let translateX = $state(0)
  let translateY = $state(0)
  let isPanning = $state(false)
  let panStart = { x: 0, y: 0 }
  let hoveredNodeId: string | null = $state(null)
  let selectedNodeId: string | null = $state(currentSlug || null)
  let focusedNodeId: string | null = $state(null)
  let query = $state('')
  let searchExpanded = $state(false)
  let fullscreen = $state(false)
  let mounted = false
  let resizeObserver: ResizeObserver | undefined

  let selectedNode = $derived(rawGraph?.nodes.find((node) => node.id === selectedNodeId) ?? null)
  let selectedRelations = $derived(
    rawGraph && selectedNodeId
      ? getNodeRelations(rawGraph, selectedNodeId)
      : { outgoing: [], incoming: [] }
  )
  let graphCounts = $derived(rawGraph ? countGraph(rawGraph) : { total: 0, connected: 0, isolated: 0, links: 0 })
  let searchResults = $derived(rawGraph ? searchGraphNodes(rawGraph.nodes, query) : [])
  let maxLinks = $derived(Math.max(...(simNodes.length ? simNodes.map((node) => node.linkCount) : [1]), 1))
  let visibleCategories = $derived(
    categoryOrder.filter((category) => rawGraph?.nodes.some((node) => node.category === category))
  )

  function categoryColor(category: string): string {
    const colors = categoryColors[category] ?? fallbackCategoryColor
    return colors[dark ? 1 : 0]
  }

  function categoryStroke(category: string): string {
    return `color-mix(in oklab, ${categoryColor(category)} 78%, ${dark ? 'white' : 'black'})`
  }

  function getRadius(node: GraphNode, maximum: number): number {
    const minRadius = mode === 'mini' ? 5 : 7
    const maxRadius = mode === 'mini' ? 12 : 17
    if (maximum <= 0) return minRadius
    return minRadius + (node.linkCount / maximum) * (maxRadius - minRadius)
  }

  function getPostUrl(slug: string): string {
    return getPostUrlBySlug(slug, locale)
  }

  function formatPublished(value: string): string {
    if (!value) return labels.unavailableDate
    return new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`))
  }

  function visibleGraph(): SerializedGraph | null {
    if (!rawGraph) return null
    if (mode === 'mini') return rawGraph
    if (focusedNodeId) return getOneHopGraph(rawGraph, focusedNodeId)
    if (showIsolated) return rawGraph
    return withoutIsolatedNodes(rawGraph)
  }

  function runSimulation(graph: SerializedGraph, fit = false) {
    if (graph.nodes.length === 0) {
      simNodes = []
      simLinks = []
      return
    }

    const columns = Math.max(1, Math.ceil(Math.sqrt(graph.nodes.length)))
    const spacing = mode === 'mini' ? 52 : 72
    const nodes: SimNode[] = graph.nodes.map((node, index) => ({
      ...node,
      x: width / 2 + (index % columns - (columns - 1) / 2) * spacing,
      y: height / 2 + (Math.floor(index / columns) - (Math.ceil(graph.nodes.length / columns) - 1) / 2) * spacing,
      vx: 0,
      vy: 0,
    }))
    const links = graph.links.map((link) => ({ source: link.source, target: link.target }))
    const maximum = Math.max(...nodes.map((node) => node.linkCount), 1)

    const simulation = forceSimulation(nodes)
      .force('link', forceLink(links).id((node: any) => node.id).distance(mode === 'mini' ? 65 : 92))
      .force('charge', forceManyBody().strength(mode === 'mini' ? -110 : -230))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide().radius((node: any) => getRadius(node, maximum) + (mode === 'mini' ? 12 : 22)))
      .alphaDecay(0.025)
      .stop()

    simulation.tick(mode === 'mini' ? 220 : 320)
    simNodes = nodes
    simLinks = simulation.force<any>('link')!.links() as SimLink[]
    if (fit && mode === 'full') fitGraph(nodes)
  }

  function refreshGraph(fit = false) {
    const graph = visibleGraph()
    if (graph) runSimulation(graph, fit)
  }

  function fitGraph(nodes = simNodes) {
    if (!nodes.length || mode !== 'full') return
    const xs = nodes.map((node) => node.x)
    const ys = nodes.map((node) => node.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const graphWidth = Math.max(maxX - minX, 80)
    const graphHeight = Math.max(maxY - minY, 80)
    const padding = width < 640 ? 44 : 80
    const minimumScale = 0.3
    const maximumScale = focusedNodeId ? 1.3 : 1.8
    const nextScale = Math.min(
      Math.max(Math.min((width - padding) / graphWidth, (height - padding) / graphHeight), minimumScale),
      maximumScale
    )
    scale = nextScale
    translateX = width / 2 - ((minX + maxX) / 2) * nextScale
    translateY = height / 2 - ((minY + maxY) / 2) * nextScale
  }

  function selectNode(nodeId: string, fromSearch = false) {
    selectedNodeId = nodeId
    focusedNodeId = nodeId
    searchExpanded = false
    refreshGraph(true)
    if (fromSearch) query = rawGraph?.nodes.find((node) => node.id === nodeId)?.title ?? query
  }

  function returnToFullGraph() {
    focusedNodeId = null
    selectedNodeId = null
    query = ''
    searchExpanded = false
    refreshGraph(true)
  }

  function onExplorerKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    if (searchExpanded) {
      searchExpanded = false
      return
    }
    if (focusedNodeId) returnToFullGraph()
  }

  function zoomBy(factor: number) {
    const nextScale = Math.min(Math.max(scale * factor, 0.25), 3)
    translateX = width / 2 - (width / 2 - translateX) * (nextScale / scale)
    translateY = height / 2 - (height / 2 - translateY) * (nextScale / scale)
    scale = nextScale
  }

  function resetView() {
    scale = 1
    translateX = 0
    translateY = 0
  }

  async function toggleFullscreen() {
    if (!explorer) return
    if (document.fullscreenElement === explorer) await document.exitFullscreen()
    else await explorer.requestFullscreen()
  }

  function isConnectedToActive(nodeId: string): boolean {
    const active = hoveredNodeId || selectedNodeId
    if (!active) return true
    if (nodeId === active) return true
    return simLinks.some((link) =>
      (link.source.id === active && link.target.id === nodeId)
      || (link.target.id === active && link.source.id === nodeId)
    )
  }

  function isLinkConnectedToActive(link: SimLink): boolean {
    const active = hoveredNodeId || selectedNodeId
    if (!active) return true
    return link.source.id === active || link.target.id === active
  }

  function markerId() {
    return dark ? 'graph-arrow-dark' : 'graph-arrow-light'
  }

  function linkEndX(link: SimLink): number {
    const radius = getRadius(link.target, maxLinks) + 5
    const dx = link.target.x - link.source.x
    const dy = link.target.y - link.source.y
    const distance = Math.hypot(dx, dy) || 1
    return link.target.x - (dx / distance) * radius
  }

  function linkEndY(link: SimLink): number {
    const radius = getRadius(link.target, maxLinks) + 5
    const dx = link.target.x - link.source.x
    const dy = link.target.y - link.source.y
    const distance = Math.hypot(dx, dy) || 1
    return link.target.y - (dy / distance) * radius
  }

  function onWheel(event: WheelEvent) {
    if (mode !== 'full') return
    event.preventDefault()
    const factor = event.deltaY > 0 ? 0.9 : 1.1
    const nextScale = Math.min(Math.max(scale * factor, 0.25), 3)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const cursorX = event.clientX - rect.left
    const cursorY = event.clientY - rect.top
    translateX = cursorX - (cursorX - translateX) * (nextScale / scale)
    translateY = cursorY - (cursorY - translateY) * (nextScale / scale)
    scale = nextScale
  }

  function onPointerDown(event: PointerEvent) {
    if (mode !== 'full' || (event.target as Element).closest('[data-graph-node]')) return
    isPanning = true
    panStart = { x: event.clientX - translateX, y: event.clientY - translateY }
    ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent) {
    if (!isPanning) return
    translateX = event.clientX - panStart.x
    translateY = event.clientY - panStart.y
  }

  function onPointerUp(event: PointerEvent) {
    isPanning = false
    const target = event.currentTarget as Element
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
  }

  function onNodeKeydown(event: KeyboardEvent, nodeId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectNode(nodeId)
    }
  }

  async function loadFullGraph() {
    loading = true
    error = ''
    try {
      const response = await fetch(getStatisticsGraphPath(locale))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      rawGraph = await response.json()
      refreshGraph(true)
    } catch (reason) {
      console.error('Failed to load graph data:', reason)
      error = labels.loadError
    } finally {
      loading = false
    }
  }

  onMount(() => {
    dark = document.documentElement.classList.contains('dark')
    const themeObserver = new MutationObserver(() => {
      dark = document.documentElement.classList.contains('dark')
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const onFullscreenChange = () => {
      fullscreen = document.fullscreenElement === explorer
      requestAnimationFrame(() => {
        if (!container) return
        width = container.clientWidth
        height = Math.max(container.clientHeight, fullscreen ? window.innerHeight - 120 : 520)
        refreshGraph(true)
      })
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)

    if (container) {
      width = container.clientWidth || width
      height = mode === 'mini' ? 280 : Math.max(container.clientHeight, 520)
      resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry) return
        const previousWidth = width
        width = entry.contentRect.width
        if (mode === 'full') height = Math.max(entry.contentRect.height, 520)
        if (Math.abs(previousWidth - width) > 80) refreshGraph(true)
      })
      resizeObserver.observe(container)
    }

    if (mode === 'mini' && graphData) runSimulation(graphData)
    else if (mode === 'full') loadFullGraph()

    mounted = true
    return () => {
      mounted = false
      themeObserver.disconnect()
      resizeObserver?.disconnect()
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  })

  $effect(() => {
    const isolated = showIsolated
    if (mounted && mode === 'full' && rawGraph && !focusedNodeId) refreshGraph(true)
  })
</script>

{#if mode === 'mini'}
  <div
    bind:this={container}
    class="graph-container relative h-[280px] w-full overflow-hidden rounded-xl {dark ? 'bg-white/[0.04] ring-1 ring-white/[0.06]' : 'bg-neutral-50 shadow-inner'}"
  >
    {#if simNodes.length === 0}
      <div class="flex h-full items-center justify-center text-sm text-black/40 dark:text-white/40">
        {labels.noLinkedPosts}
      </div>
    {:else}
      <svg
        {width}
        {height}
        viewBox="0 0 {width} {height}"
        class="block w-full"
        aria-label={labels.miniGraphAria}
      >
        <g>
          {#each simLinks as link}
            <line x1={link.source.x} y1={link.source.y} x2={link.target.x} y2={link.target.y} stroke={dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'} stroke-width="0.8" />
          {/each}
          {#each simNodes as node}
            {@const radius = getRadius(node, maxLinks)}
            <a href={getPostUrl(node.id)} onmouseenter={() => hoveredNodeId = node.id} onmouseleave={() => hoveredNodeId = null}>
              <circle cx={node.x} cy={node.y} r={hoveredNodeId === node.id ? radius + 2 : radius} fill={node.id === currentSlug ? 'var(--primary)' : categoryColor(node.category)} stroke={node.id === currentSlug ? 'var(--primary)' : categoryStroke(node.category)} stroke-width={hoveredNodeId === node.id || node.id === currentSlug ? 2.5 : 1.5} />
              <text x={node.x} y={node.y + radius + 14} text-anchor="middle" font-size={hoveredNodeId === node.id ? 13 : 11} font-weight={hoveredNodeId === node.id || node.id === currentSlug ? 600 : 500} fill={dark ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.85)'} opacity={hoveredNodeId === node.id || node.id === currentSlug ? 1 : .45} class="pointer-events-none select-none">
                {hoveredNodeId === node.id || node.id === currentSlug ? node.title : (node.title.length > 10 ? `${node.title.slice(0, 10)}…` : node.title)}
              </text>
            </a>
          {/each}
        </g>
      </svg>
    {/if}
  </div>
{:else}
  <section bind:this={explorer} class="graph-explorer flex min-h-0 flex-col gap-3" aria-labelledby="graph-explorer-title" onkeydown={onExplorerKeydown}>
    <header class="card-base p-5 md:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div class="max-w-2xl">
          <p class="mb-2 text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">Connection atlas</p>
          <h2 id="graph-explorer-title" class="text-2xl font-bold tracking-tight text-black/90 md:text-3xl dark:text-white/90">{labels.title}</h2>
          <p class="mt-2 text-sm leading-6 text-black/50 dark:text-white/50">{labels.description}</p>
        </div>
        <dl class="grid grid-cols-4 gap-2 text-center xl:min-w-[27rem]">
          {#each [
            [labels.posts, graphCounts.total],
            [labels.connected, graphCounts.connected],
            [labels.isolated, graphCounts.isolated],
            [labels.references, graphCounts.links],
          ] as item}
            <div class="rounded-xl bg-black/[0.035] px-2 py-3 dark:bg-white/[0.055]">
              <dt class="text-[0.65rem] text-black/40 dark:text-white/40">{item[0]}</dt>
              <dd class="mt-1 text-lg font-semibold tabular-nums text-black/80 dark:text-white/80">{item[1]}</dd>
            </div>
          {/each}
        </dl>
      </div>
    </header>

    <div class="card-base flex min-h-0 flex-1 flex-col overflow-visible" class:fullscreen-shell={fullscreen}>
      <div class="flex flex-col gap-3 border-b border-black/[0.07] p-3 md:flex-row md:items-center md:justify-between md:p-4 dark:border-white/[0.08]">
        <div class="relative min-w-0 flex-1 md:max-w-md">
          <Icon icon="material-symbols:search-rounded" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xl text-black/35 dark:text-white/35" />
          <input
            type="search"
            bind:value={query}
            onfocus={() => searchExpanded = true}
            oninput={() => searchExpanded = true}
            onkeydown={(event) => {
              if (event.key === 'Escape') searchExpanded = false
              if (event.key === 'Enter' && searchResults[0]) selectNode(searchResults[0].id, true)
            }}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchAria}
            aria-expanded={searchExpanded && query.trim().length > 0}
            class="h-10 w-full rounded-xl bg-black/[0.04] pr-3 pl-10 text-sm text-black/75 outline-none ring-[var(--primary)]/30 transition focus:ring-2 dark:bg-white/[0.06] dark:text-white/75"
          />
          {#if searchExpanded && query.trim()}
            <div class="absolute top-12 right-0 left-0 z-30 max-h-72 overflow-y-auto rounded-xl bg-[var(--float-panel-bg)] p-1.5 shadow-xl ring-1 ring-black/[0.06] dark:ring-white/[0.08]" role="listbox" aria-label={labels.searchResultsAria}>
              {#if searchResults.length}
                {#each searchResults as node}
                  <button type="button" role="option" class="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--btn-plain-bg-hover)]" onclick={() => selectNode(node.id, true)}>
                    <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]"></span>
                    <span class="min-w-0">
                      <span class="block truncate text-sm font-medium text-black/80 dark:text-white/80">{node.title}</span>
                      <span class="mt-0.5 block truncate text-xs text-black/40 dark:text-white/40">{node.category} · {node.linkCount ? labels.relationshipCount(node.linkCount) : labels.noRelationships}</span>
                    </span>
                  </button>
                {/each}
              {:else}
                <p class="px-3 py-5 text-center text-sm text-black/45 dark:text-white/45">{labels.noMatches}</p>
              {/if}
            </div>
          {/if}
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <label class="graph-action graph-toggle cursor-pointer text-black/65 dark:text-white/75">
            <input type="checkbox" bind:checked={showIsolated} class="accent-[var(--primary)]" disabled={Boolean(focusedNodeId)} />
            {labels.showIsolated}
          </label>
        </div>
      </div>

      <div class="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="relative min-h-[32rem] overflow-hidden bg-black/[0.018] dark:bg-white/[0.018]" bind:this={container}>
          {#if loading}
            <div class="absolute inset-0 flex items-center justify-center text-sm text-black/45 dark:text-white/45" aria-live="polite">
              <Icon icon="material-symbols:progress-activity" class="mr-2 animate-spin text-xl" />{labels.loading}
            </div>
          {:else if error}
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
              <Icon icon="material-symbols:cloud-off-outline-rounded" class="text-4xl text-[var(--primary)]" />
              <p class="text-sm text-black/55 dark:text-white/55">{error}</p>
              <button type="button" class="graph-action" onclick={loadFullGraph}>{labels.retry}</button>
            </div>
          {:else if simNodes.length === 0}
            <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-black/45 dark:text-white/45">
              <Icon icon="material-symbols:hub-outline-rounded" class="mb-3 text-4xl text-[var(--primary)] opacity-70" />
              <p class="font-medium">{labels.emptyTitle}</p>
              <p class="mt-1 text-xs">{labels.emptyDescription}</p>
            </div>
          {:else}
            {#if focusedNodeId}
              <button type="button" class="absolute top-3 left-3 z-20 flex min-h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110" onclick={returnToFullGraph}>
                <Icon icon="material-symbols:arrow-back-rounded" /> {labels.backToGraph}
              </button>
            {:else if visibleCategories.length}
              <ul class="absolute top-3 left-3 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-x-3 gap-y-1.5 rounded-xl bg-[var(--card-bg)]/88 px-3 py-2 text-[0.65rem] text-black/55 shadow-sm ring-1 ring-black/[0.05] backdrop-blur dark:text-white/55 dark:ring-white/[0.07]" aria-label={labels.categoryLegendAria}>
                {#each visibleCategories as category}
                  <li class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full ring-2 ring-[var(--card-bg)]" style={`background: ${categoryColor(category)}`}></span>{category}</li>
                {/each}
              </ul>
            {/if}
            <div class="graph-controls absolute top-3 right-3 z-20 flex flex-col gap-1 rounded-xl bg-[var(--card-bg)]/90 p-1 shadow-lg ring-1 ring-black/[0.06] backdrop-blur dark:ring-white/[0.08]" aria-label={labels.controlsAria}>
              <button type="button" class="graph-icon-button" aria-label={labels.zoomIn} title={labels.zoomIn} onclick={() => zoomBy(1.2)}><Icon icon="material-symbols:add-rounded" /></button>
              <button type="button" class="graph-icon-button" aria-label={labels.zoomOut} title={labels.zoomOut} onclick={() => zoomBy(1 / 1.2)}><Icon icon="material-symbols:remove-rounded" /></button>
              <button type="button" class="graph-icon-button" aria-label={labels.fit} title={labels.fit} onclick={() => fitGraph()}><Icon icon="material-symbols:fit-screen-outline-rounded" /></button>
              <button type="button" class="graph-icon-button" aria-label={labels.reset} title={labels.reset} onclick={resetView}><Icon icon="material-symbols:center-focus-strong-outline-rounded" /></button>
              <button type="button" class="graph-icon-button" aria-label={fullscreen ? labels.exitFullscreen : labels.enterFullscreen} title={fullscreen ? labels.exitFullscreen : labels.enterFullscreen} onclick={toggleFullscreen}><Icon icon={fullscreen ? 'material-symbols:fullscreen-exit-rounded' : 'material-symbols:fullscreen-rounded'} /></button>
            </div>

            <div class="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-[var(--card-bg)]/80 px-2.5 py-1.5 text-[0.65rem] text-black/40 backdrop-blur dark:text-white/40">{focusedNodeId ? labels.focusedHint : labels.graphHint}</div>

            <svg
              {width}
              {height}
              viewBox="0 0 {width} {height}"
              class="block h-full w-full touch-none {isPanning ? 'cursor-grabbing' : 'cursor-grab'}"
              aria-label={labels.graphAria}
              onwheel={onWheel}
              onpointerdown={onPointerDown}
              onpointermove={onPointerMove}
              onpointerup={onPointerUp}
              onpointercancel={onPointerUp}
            >
              <defs>
                <marker id="graph-arrow-light" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(0,0,0,.28)" /></marker>
                <marker id="graph-arrow-dark" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(255,255,255,.35)" /></marker>
              </defs>
              <g transform="translate({translateX},{translateY}) scale({scale})">
                {#each simLinks as link}
                  <line
                    x1={link.source.x}
                    y1={link.source.y}
                    x2={linkEndX(link)}
                    y2={linkEndY(link)}
                    stroke={dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.18)'}
                    stroke-width={isLinkConnectedToActive(link) && (hoveredNodeId || selectedNodeId) ? 1.8 : 1}
                    opacity={isLinkConnectedToActive(link) ? 1 : .12}
                    marker-end="url(#{markerId()})"
                    class="transition-opacity duration-150"
                  />
                {/each}
                {#each simNodes as node}
                  {@const radius = getRadius(node, maxLinks)}
                  {@const active = node.id === selectedNodeId}
                  {@const connected = isConnectedToActive(node.id)}
                  {@const visualScale = Math.min(1 / scale, focusedNodeId ? 1.15 : 1.9)}
                  <g
                    data-graph-node
                    role="button"
                    tabindex="0"
                    aria-label={labels.nodeAria(node.title, node.linkCount)}
                    transform={`translate(${node.x},${node.y}) scale(${visualScale})`}
                    class="cursor-pointer outline-none"
                    onclick={() => selectNode(node.id)}
                    onkeydown={(event) => onNodeKeydown(event, node.id)}
                    onmouseenter={() => hoveredNodeId = node.id}
                    onmouseleave={() => hoveredNodeId = null}
                  >
                    <circle r={Math.max(radius + 9, 18)} fill="transparent" stroke="none" class="node-hit-area" />
                    {#if active}
                      <circle r={radius + 7} fill="none" stroke="var(--primary)" stroke-width="2" opacity=".4" class="node-pulse" />
                    {/if}
                    <circle
                      r={hoveredNodeId === node.id ? radius + 2 : radius}
                      fill={active ? 'var(--primary)' : categoryColor(node.category)}
                      opacity={connected ? 1 : .16}
                      stroke={active ? 'var(--primary)' : categoryStroke(node.category)}
                      stroke-width={active || hoveredNodeId === node.id ? 2.5 : 1.25}
                      class="transition-all duration-150"
                    />
                    {#if !focusedNodeId || scale > .35 || active || hoveredNodeId === node.id}
                      <text
                        y={radius + 15}
                        text-anchor="middle"
                        font-size={active || hoveredNodeId === node.id ? 12 : 10.5}
                        font-weight={active || hoveredNodeId === node.id ? 650 : 550}
                        fill={dark ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.82)'}
                        opacity={active || hoveredNodeId === node.id ? 1 : (connected ? .55 : .12)}
                        class="pointer-events-none select-none"
                      >{active || hoveredNodeId === node.id ? node.title : (node.title.length > 11 ? `${node.title.slice(0, 11)}…` : node.title)}</text>
                    {/if}
                  </g>
                {/each}
              </g>
            </svg>
          {/if}
        </div>

        <aside class="min-h-0 border-t border-black/[0.07] bg-[var(--card-bg)] lg:border-t-0 lg:border-l dark:border-white/[0.08]" aria-label={labels.detailsAria}>
          {#if selectedNode}
            <div class="flex h-full max-h-[38rem] flex-col p-5 lg:max-h-none">
              <div class="min-h-0 flex-1 overflow-y-auto pr-1">
                {#if selectedNode.cover}
                  <div class="mb-4 aspect-[16/9] overflow-hidden rounded-xl bg-black/[0.04] ring-1 ring-black/[0.06] dark:bg-white/[0.05] dark:ring-white/[0.07]">
                    <img src={selectedNode.cover} alt="" class="h-full w-full object-cover" loading="lazy" decoding="async" />
                  </div>
                {:else}
                  <div class="mb-4 flex aspect-[16/7] items-center justify-center rounded-xl bg-black/[0.035] text-black/20 ring-1 ring-black/[0.05] dark:bg-white/[0.045] dark:text-white/20 dark:ring-white/[0.06]" aria-hidden="true">
                    <Icon icon="material-symbols:image-outline-rounded" class="text-3xl" />
                  </div>
                {/if}
                <p class="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)]"><span class="h-2 w-2 rounded-full" style={`background: ${categoryColor(selectedNode.category)}`}></span>{selectedNode.category}</p>
                <h3 class="mt-2 text-xl font-semibold leading-snug text-black/85 dark:text-white/85">{selectedNode.title}</h3>
                <p class="mt-2 text-xs text-black/40 dark:text-white/40">{formatPublished(selectedNode.published)}</p>
                {#if selectedNode.description}
                  <p class="mt-4 text-sm leading-6 text-black/55 dark:text-white/55">{selectedNode.description}</p>
                {/if}
                {#if selectedNode.tags.length}
                  <div class="mt-4 flex flex-wrap gap-1.5">
                    {#each selectedNode.tags as tag}<span class="rounded-md bg-black/[0.04] px-2 py-1 text-[0.65rem] text-black/45 dark:bg-white/[0.06] dark:text-white/45">#{tag}</span>{/each}
                  </div>
                {/if}

                <div class="relation-group relation-group-out mt-6">
                  <h4 class="relation-heading"><span class="relation-heading-icon"><Icon icon="material-symbols:arrow-outward-rounded" /></span><span>{labels.outbound}</span><strong>{selectedRelations.outgoing.length}</strong></h4>
                  <p class="relation-caption">{labels.outboundCaption}</p>
                  {#if selectedRelations.outgoing.length}
                    <ul class="mt-2 space-y-1">
                      {#each selectedRelations.outgoing as node}<li><button type="button" class="relation-link" onclick={() => selectNode(node.id)}><Icon icon="material-symbols:arrow-outward-rounded" />{node.title}</button></li>{/each}
                    </ul>
                  {:else}<p class="mt-2 text-xs text-black/45 dark:text-white/50">{labels.noOutbound}</p>{/if}
                </div>

                <div class="relation-group relation-group-in mt-3">
                  <h4 class="relation-heading"><span class="relation-heading-icon"><Icon icon="material-symbols:call-received-rounded" /></span><span>{labels.inbound}</span><strong>{selectedRelations.incoming.length}</strong></h4>
                  <p class="relation-caption">{labels.inboundCaption}</p>
                  {#if selectedRelations.incoming.length}
                    <ul class="mt-2 space-y-1">
                      {#each selectedRelations.incoming as node}<li><button type="button" class="relation-link" onclick={() => selectNode(node.id)}><Icon icon="material-symbols:call-received-rounded" />{node.title}</button></li>{/each}
                    </ul>
                  {:else}<p class="mt-2 text-xs text-black/45 dark:text-white/50">{labels.noInbound}</p>{/if}
                </div>
              </div>
              <a href={getPostUrl(selectedNode.id)} class="mt-5 flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:brightness-110">
                {labels.readPost} <Icon icon="material-symbols:arrow-forward-rounded" />
              </a>
            </div>
          {:else}
            <div class="flex h-full min-h-64 flex-col items-center justify-center p-6 text-center">
              <Icon icon="material-symbols:touch-app-outline-rounded" class="text-4xl text-[var(--primary)] opacity-60" />
              <p class="mt-3 text-sm font-medium text-black/60 dark:text-white/60">{labels.selectPost}</p>
              <p class="mt-1 max-w-48 text-xs leading-5 text-black/35 dark:text-white/35">{labels.selectPostDescription}</p>
            </div>
          {/if}
        </aside>
      </div>
    </div>
  </section>
{/if}

<style>
  .graph-action {
    display: inline-flex;
    min-height: 2.5rem;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border-radius: 0.75rem;
    padding: 0 0.75rem;
    font-size: 0.75rem;
    color: color-mix(in oklab, currentColor 58%, transparent);
    background: color-mix(in oklab, currentColor 5%, transparent);
    transition: 150ms ease;
  }
  .graph-action:hover { color: var(--primary); background: var(--btn-plain-bg-hover); }
  :global(.dark) .graph-toggle { color: rgba(255, 255, 255, .78); background: rgba(255, 255, 255, .075); }
  :global(.dark) .graph-toggle input { color-scheme: dark; }
  .graph-action-primary { color: var(--primary); background: color-mix(in oklab, var(--primary) 12%, transparent); }
  .graph-action:disabled { cursor: not-allowed; opacity: .45; }
  .graph-icon-button { display: grid; width: 2.25rem; height: 2.25rem; place-items: center; border-radius: .6rem; color: rgba(0, 0, 0, .62); transition: 150ms ease; }
  :global(.dark) .graph-controls { background: color-mix(in oklab, var(--card-bg) 92%, black); }
  :global(.dark) .graph-icon-button { color: rgba(255, 255, 255, .82); }
  .graph-icon-button:hover { color: var(--primary); background: var(--btn-plain-bg-hover); }
  .relation-group { border: 1px solid transparent; border-radius: .85rem; padding: .8rem; }
  .relation-group-out { border-color: color-mix(in oklab, #eb6834 22%, transparent); background: color-mix(in oklab, #eb6834 7%, transparent); }
  .relation-group-in { border-color: color-mix(in oklab, #2a78d6 22%, transparent); background: color-mix(in oklab, #2a78d6 7%, transparent); }
  :global(.dark) .relation-group-out { border-color: color-mix(in oklab, #d95926 34%, transparent); background: color-mix(in oklab, #d95926 11%, transparent); }
  :global(.dark) .relation-group-in { border-color: color-mix(in oklab, #3987e5 34%, transparent); background: color-mix(in oklab, #3987e5 11%, transparent); }
  .relation-heading { display: flex; align-items: center; gap: .45rem; color: rgba(0, 0, 0, .78); font-size: .78rem; font-weight: 700; }
  :global(.dark) .relation-heading { color: rgba(255, 255, 255, .88); }
  .relation-heading strong { margin-left: auto; border-radius: 999px; padding: .1rem .45rem; background: color-mix(in oklab, currentColor 9%, transparent); font-size: .7rem; }
  .relation-heading-icon { display: grid; width: 1.55rem; height: 1.55rem; place-items: center; border-radius: .45rem; }
  .relation-group-out .relation-heading-icon { color: #c24f19; background: color-mix(in oklab, #eb6834 16%, transparent); }
  .relation-group-in .relation-heading-icon { color: #1b67ad; background: color-mix(in oklab, #2a78d6 15%, transparent); }
  :global(.dark) .relation-group-out .relation-heading-icon { color: #ff956d; }
  :global(.dark) .relation-group-in .relation-heading-icon { color: #77b4ff; }
  .relation-caption { margin: .2rem 0 0 2rem; color: rgba(0, 0, 0, .42); font-size: .65rem; }
  :global(.dark) .relation-caption { color: rgba(255, 255, 255, .5); }
  .relation-link { display: flex; width: 100%; align-items: flex-start; gap: .45rem; border-radius: .5rem; padding: .45rem .5rem; text-align: left; font-size: .75rem; font-weight: 550; line-height: 1.2rem; color: rgba(0, 0, 0, .7); transition: 150ms ease; }
  :global(.dark) .relation-link { color: rgba(255, 255, 255, .78); }
  .relation-link:hover { color: var(--primary); background: var(--btn-plain-bg-hover); }
  .relation-link :global(svg) { margin-top: .15rem; flex-shrink: 0; }
  .node-hit-area { pointer-events: all; }
  .fullscreen-shell { height: 100vh; border-radius: 0; background: var(--page-bg); }
  .fullscreen-shell > :global(div:last-child) { min-height: 0; }
  @keyframes node-pulse { 0%, 100% { opacity: .25; } 50% { opacity: .65; } }
  .node-pulse { animation: node-pulse 2s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .graph-action, .graph-icon-button, .relation-link { transition: none; }
    .node-pulse { animation: none; opacity: .45; }
  }
  @media (forced-colors: active) {
    [data-graph-node] circle { fill: Canvas; stroke: CanvasText; }
  }
</style>
