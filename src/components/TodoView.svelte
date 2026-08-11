<script lang="ts">
  import '@fontsource-variable/jetbrains-mono'
  import '@fontsource-variable/jetbrains-mono/wght-italic.css'
  import { onMount } from 'svelte'
  import Icon from '@iconify/svelte'

  type TodoTag = { id: number; name: string; color: string }
  type TodoTask = {
    number: number
    title: string
    descriptionHtml: string
    issueUrl: string
    state: 'open' | 'closed'
    tags: TodoTag[]
    createdAt: string
    updatedAt: string
    closedAt: string | null
  }
  type TodoSnapshot = {
    version: 1
    generatedAt: string
    status: 'live' | 'fallback'
    source: 'github-issues'
    counts: { active: number; completed: number }
    tasks: TodoTask[]
  }
  type PriorityKey = 'p0' | 'p1' | 'p2' | 'p3'
  type PriorityFilter = {
    key: PriorityKey
    label: string
    description: string
    fallbackColor: string
  }
  type View = 'all' | 'completed' | `priority:${PriorityKey}` | `tag:${number}`

  const recentCompletedLimit = 3
  const priorityFilters: readonly PriorityFilter[] = [
    { key: 'p0', label: 'P0', description: '立即处理', fallbackColor: 'B60205' },
    { key: 'p1', label: 'P1', description: '尽快处理', fallbackColor: 'D93F0B' },
    { key: 'p2', label: 'P2', description: '正常推进', fallbackColor: 'FBCA04' },
    { key: 'p3', label: 'P3', description: '有空再做', fallbackColor: '0E8A16' },
  ]
  let data: TodoSnapshot | null = $state(null)
  let loading = $state(true)
  let error = $state('')
  let view: View = $state('all')
  let query = $state('')
  let selectedNumber: number | null = $state(null)
  let prioritiesCollapsed = $state(false)
  let tagsCollapsed = $state(false)

  function isTag(value: unknown): value is TodoTag {
    if (!value || typeof value !== 'object') return false
    const tag = value as Partial<TodoTag>
    return Number.isSafeInteger(tag.id) && typeof tag.name === 'string' && /^[0-9a-f]{6}$/.test(tag.color ?? '')
  }

  function isTask(value: unknown): value is TodoTask {
    if (!value || typeof value !== 'object') return false
    const task = value as Partial<TodoTask>
    if (!Number.isSafeInteger(task.number) || Number(task.number) <= 0) return false
    if (typeof task.title !== 'string' || typeof task.descriptionHtml !== 'string') return false
    if (task.issueUrl !== `https://github.com/MrXnneHang/xnnehang.top/issues/${task.number}`) return false
    if (task.state !== 'open' && task.state !== 'closed') return false
    if (!Array.isArray(task.tags) || !task.tags.every(isTag)) return false
    if (typeof task.createdAt !== 'string' || typeof task.updatedAt !== 'string') return false
    if (task.closedAt !== null && typeof task.closedAt !== 'string') return false
    if ((task.state === 'open' && task.closedAt !== null) || (task.state === 'closed' && !task.closedAt)) return false
    return [task.createdAt, task.updatedAt, task.closedAt].filter(Boolean).every((date) => Number.isFinite(Date.parse(date as string)))
  }

  function isSnapshot(value: unknown): value is TodoSnapshot {
    if (!value || typeof value !== 'object') return false
    const candidate = value as Partial<TodoSnapshot>
    if (candidate.version !== 1 || candidate.source !== 'github-issues') return false
    if (candidate.status !== 'live' && candidate.status !== 'fallback') return false
    if (typeof candidate.generatedAt !== 'string' || !Number.isFinite(Date.parse(candidate.generatedAt))) return false
    if (!candidate.counts || !Array.isArray(candidate.tasks)) return false
    if (!Number.isSafeInteger(candidate.counts.active) || !Number.isSafeInteger(candidate.counts.completed)) return false
    return candidate.tasks.every(isTask)
  }

  function plainText(html: string) {
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').toLowerCase()
  }

  function matchesQuery(task: TodoTask) {
    const needle = query.trim().toLowerCase()
    return !needle || `${task.title} ${plainText(task.descriptionHtml)} ${task.tags.map((tag) => tag.name).join(' ')}`.toLowerCase().includes(needle)
  }

  function formatDate(value: string | null) {
    if (!value) return ''
    return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeZone: 'Asia/Shanghai' }).format(new Date(value))
  }

  function tagStyle(tag: Pick<TodoTag, 'color'>) {
    return `--tag-color: #${tag.color}`
  }

  function priorityKey(name: string): PriorityKey | null {
    const normalized = name.trim().toLowerCase()
    return priorityFilters.some((priority) => priority.key === normalized) ? normalized as PriorityKey : null
  }

  function taskHasPriority(task: TodoTask, key: PriorityKey) {
    return task.tags.some((tag) => priorityKey(tag.name) === key)
  }

  let priorities = $derived(priorityFilters.map((priority) => {
    const label = data?.tasks.flatMap((task) => task.tags).find((tag) => priorityKey(tag.name) === priority.key)
    const activeCount = data?.tasks.filter((task) => task.state === 'open' && taskHasPriority(task, priority.key)).length ?? 0
    return { ...priority, color: label?.color ?? priority.fallbackColor, activeCount }
  }))

  let tags = $derived.by(() => {
    if (!data) return []
    const tagMap = new Map<number, TodoTag & { activeCount: number }>()
    for (const task of data.tasks) {
      if (task.state !== 'open') continue
      for (const tag of task.tags) {
        if (priorityKey(tag.name)) continue
        const entry = tagMap.get(tag.id) ?? { ...tag, activeCount: 0 }
        entry.activeCount += 1
        tagMap.set(tag.id, entry)
      }
    }
    return Array.from(tagMap.values()).sort((left, right) => right.activeCount - left.activeCount || left.name.localeCompare(right.name))
  })

  let selectedPriorityKey = $derived(view.startsWith('priority:') ? view.slice(9) as PriorityKey : null)
  let activePriority = $derived(priorities.find((priority) => priority.key === selectedPriorityKey) ?? null)
  let selectedTagId = $derived(view.startsWith('tag:') ? Number(view.slice(4)) : null)
  let activeTag = $derived(tags.find((tag) => tag.id === selectedTagId) ?? null)
  let visibleTasks = $derived.by(() => {
    if (!data) return []
    if (view === 'completed') return data.tasks.filter((task) => task.state === 'closed' && matchesQuery(task))
    if (selectedPriorityKey) {
      const matching = data.tasks.filter((task) => taskHasPriority(task, selectedPriorityKey) && matchesQuery(task))
      const active = matching.filter((task) => task.state === 'open')
      const recentCompleted = matching.filter((task) => task.state === 'closed').slice(0, recentCompletedLimit)
      return [...active, ...recentCompleted]
    }
    if (selectedTagId !== null) {
      const matching = data.tasks.filter((task) => task.tags.some((tag) => tag.id === selectedTagId) && matchesQuery(task))
      const active = matching.filter((task) => task.state === 'open')
      const recentCompleted = matching.filter((task) => task.state === 'closed').slice(0, recentCompletedLimit)
      return [...active, ...recentCompleted]
    }
    return data.tasks.filter((task) => task.state === 'open' && matchesQuery(task))
  })
  let selectedTask = $derived(visibleTasks.find((task) => task.number === selectedNumber) ?? visibleTasks[0] ?? null)
  let viewTitle = $derived(view === 'completed' ? '结晶' : activePriority ? `${activePriority.label} · ${activePriority.description}` : activeTag?.name ?? '坩埚')
  let viewCount = $derived(visibleTasks.filter((task) => task.state === 'open' || view === 'completed').length)

  function selectView(next: View) {
    view = next
    selectedNumber = null
  }

  onMount(async () => {
    try {
      const response = await fetch('/todo.json', { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const snapshot = await response.json()
      if (!isSnapshot(snapshot)) throw new Error('Invalid Todo data')
      data = snapshot
    } catch (reason) {
      console.error('Failed to load Todo snapshot:', reason)
      error = '在途数据暂时无法加载，请稍后再试。'
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <section class="card-base loading-state" aria-live="polite">
    <Icon icon="material-symbols:progress-activity" class="animate-spin" />
    正在整理工作台
  </section>
{:else if error || !data}
  <section class="card-base error-state" role="alert">
    <Icon icon="material-symbols:cloud-off-outline-rounded" />
    <h1>工作台暂时离线</h1>
    <p>{error}</p>
  </section>
{:else}
  <section class="workspace card-base" data-pagefind-body aria-label="在途工作台">
    <aside class="workspace-nav" aria-label="在途视图">
      <header>
        <p>Workspace</p>
        <h1>炼金</h1>
        <span class="workspace-note">把散落的想法混合熔炼</span>
        <span>{data.status === 'fallback' ? '上一份快照' : formatDate(data.generatedAt)}</span>
      </header>

      <nav class="primary-nav">
        <button class:active={view === 'all'} aria-pressed={view === 'all'} onclick={() => selectView('all')}>
          <Icon icon="material-symbols:inbox-rounded" />
          <span>坩埚</span>
          <strong>{data.counts.active}</strong>
        </button>
        <button class:active={view === 'completed'} aria-pressed={view === 'completed'} onclick={() => selectView('completed')}>
          <Icon icon="material-symbols:check-circle-outline-rounded" />
          <span>结晶</span>
          <strong>{data.counts.completed}</strong>
        </button>
      </nav>

      <button class="group-heading" aria-expanded={!prioritiesCollapsed} aria-controls="priority-filters" onclick={() => prioritiesCollapsed = !prioritiesCollapsed}>
        <Icon icon="material-symbols:keyboard-arrow-down-rounded" />
        <span>优先级</span>
      </button>
      {#if !prioritiesCollapsed}
        <nav id="priority-filters" class="priority-nav" aria-label="优先级">
          {#each priorities as priority (priority.key)}
            <button
              class:active={selectedPriorityKey === priority.key}
              aria-pressed={selectedPriorityKey === priority.key}
              style={tagStyle(priority)}
              onclick={() => selectView(`priority:${priority.key}`)}
            >
              <span class="priority-dot" aria-hidden="true"></span>
              <span class="priority-copy"><span class="priority-code">{priority.label}</span><span class="priority-description">{priority.description}</span></span>
              <strong>{priority.activeCount}</strong>
            </button>
          {/each}
        </nav>
      {/if}

      {#if tags.length > 0}
        <button class="group-heading" aria-expanded={!tagsCollapsed} aria-controls="tag-filters" onclick={() => tagsCollapsed = !tagsCollapsed}>
          <Icon icon="material-symbols:keyboard-arrow-down-rounded" />
          <span>标签</span>
        </button>
        {#if !tagsCollapsed}
          <nav id="tag-filters" class="tag-nav" aria-label="标签">
            {#each tags as tag (tag.id)}
              <button class:active={selectedTagId === tag.id} aria-pressed={selectedTagId === tag.id} onclick={() => selectView(`tag:${tag.id}`)}>
                <span class="tag-dot" style={tagStyle(tag)}></span>
                <span>{tag.name}</span>
                <strong>{tag.activeCount}</strong>
              </button>
            {/each}
          </nav>
        {/if}
      {/if}
    </aside>

    <div class="task-pane">
      <header class="task-toolbar">
        <div>
          <h2>{viewTitle}</h2>
          <span>{viewCount} 项</span>
        </div>
        <label>
          <Icon icon="material-symbols:search-rounded" aria-hidden="true" />
          <input bind:value={query} type="search" aria-label="搜索在途事项" placeholder="搜索" />
        </label>
      </header>

      <div class="task-list" aria-live="polite">
        {#if visibleTasks.length === 0}
          <div class="empty-state">
            <Icon icon="material-symbols:checklist-rounded" />
            <p>{query ? '没有匹配的在途事项' : view === 'completed' ? '还没有结晶' : activePriority ? `${activePriority.label} 暂无待处理事项` : '坩埚暂时是空的'}</p>
          </div>
        {:else}
          {#each visibleTasks as task (task.number)}
            <button
              type="button"
              class="task-row"
              class:selected={selectedTask?.number === task.number}
              class:completed={task.state === 'closed'}
              aria-pressed={selectedTask?.number === task.number}
              onclick={() => selectedNumber = task.number}
            >
              <span class="task-check" aria-label={task.state === 'closed' ? '已结晶' : '炼制中'}>
                <Icon icon={task.state === 'closed' ? 'material-symbols:check-rounded' : 'material-symbols:circle-outline'} />
              </span>
              <span class="task-copy">
                <span class="task-title">{task.title}</span>
                {#if task.descriptionHtml}<span class="task-excerpt">{plainText(task.descriptionHtml).trim()}</span>{/if}
              </span>
              <span class="task-tags" aria-label="标签">
                {#each task.tags as tag (tag.id)}<span class="tag-pill" style={tagStyle(tag)}>{tag.name}</span>{/each}
              </span>
              <Icon icon="material-symbols:chevron-right-rounded" class="row-arrow" aria-hidden="true" />
            </button>
            {#if selectedTask?.number === task.number}
              <div class="mobile-detail">{@render TaskDetail(task)}</div>
            {/if}
          {/each}
        {/if}
      </div>
    </div>

    <aside class="detail-pane" aria-live="polite">
      {#if selectedTask}{@render TaskDetail(selectedTask)}{:else}<div class="detail-empty"><Icon icon="material-symbols:select-check-box-outline-rounded" /><p>选择一项查看详情</p></div>{/if}
    </aside>
  </section>
{/if}

{#snippet TaskDetail(task: TodoTask)}
  <article class="task-detail">
    <header>
      <span class:done={task.state === 'closed'} class="detail-state"><Icon icon={task.state === 'closed' ? 'material-symbols:check-rounded' : 'material-symbols:circle-outline'} />{task.state === 'closed' ? '已结晶' : '炼制中'}</span>
      <a href={task.issueUrl} target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 中打开"><Icon icon="material-symbols:open-in-new-rounded" /></a>
    </header>
    <h2 class:completed={task.state === 'closed'}>{task.title}</h2>
    {#if task.tags.length > 0}<div class="detail-tags">{#each task.tags as tag (tag.id)}<span class="tag-pill" style={tagStyle(tag)}><span class="tag-dot" style={tagStyle(tag)}></span>{tag.name}</span>{/each}</div>{/if}
    <div class="detail-rule"></div>
    {#if task.descriptionHtml}<div class="detail-body prose dark:prose-invert custom-md !max-w-none">{@html task.descriptionHtml}</div>{:else}<p class="no-description">没有补充详情。</p>{/if}
    <footer>
      <span>创建于 {formatDate(task.createdAt)}</span>
      <span>{task.state === 'closed' ? `结晶于 ${formatDate(task.closedAt)}` : `更新于 ${formatDate(task.updatedAt)}`}</span>
      <a href={task.issueUrl} target="_blank" rel="noopener noreferrer">在 GitHub 中{task.state === 'closed' ? '查看' : '编辑'} <Icon icon="material-symbols:arrow-outward-rounded" /></a>
    </footer>
  </article>
{/snippet}

<style>
  .workspace { display: grid; min-height: calc(100svh - 5.5rem); overflow: hidden; grid-template-columns: 13rem minmax(18rem, 1fr) minmax(20rem, 1.1fr); }
  .workspace-nav, .task-pane { border-right: 1px solid var(--line-divider); }
  .workspace-nav { padding: 1.15rem .75rem; background: color-mix(in oklab, var(--card-bg) 94%, var(--primary)); }
  .workspace-nav header { padding: .1rem .6rem 1.1rem; }
  .workspace-nav header p { margin: 0; color: var(--primary); font-size: .62rem; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; }
  .workspace-nav header h1 { margin: .15rem 0 0; color: rgba(0,0,0,.86); font-size: 1.3rem; letter-spacing: -.04em; }
  .workspace-nav header span { display: block; margin-top: .3rem; color: rgba(0,0,0,.4); font-size: .66rem; }
  .workspace-nav header .workspace-note { max-width: 10rem; margin-top: .35rem; color: rgba(0,0,0,.56); font-size: .68rem; line-height: 1.45; }
  .primary-nav, .priority-nav, .tag-nav { display: flex; flex-direction: column; gap: .2rem; }
  .primary-nav button, .priority-nav button, .tag-nav button { display: grid; min-width: 0; grid-template-columns: 1rem minmax(0,1fr) auto; align-items: center; gap: .55rem; border-radius: .55rem; padding: .55rem .6rem; color: rgba(0,0,0,.62); text-align: left; transition: 120ms ease; }
  .primary-nav button:hover, .priority-nav button:hover, .tag-nav button:hover { background: var(--btn-plain-bg-hover); }
  .primary-nav button.active, .tag-nav button.active { color: var(--primary); background: color-mix(in oklab, var(--primary) 12%, transparent); }
  .priority-nav button.active { background: color-mix(in oklab, var(--primary) 12%, transparent); }
  .primary-nav button span, .tag-nav button span:nth-child(2) { overflow: hidden; font-size: .78rem; font-weight: 560; text-overflow: ellipsis; white-space: nowrap; }
  .primary-nav button strong, .priority-nav button strong, .tag-nav button strong { color: rgba(0,0,0,.38); font-size: .66rem; font-weight: 500; }
  .priority-dot { width: .52rem; height: .52rem; border: 2px solid color-mix(in srgb, var(--tag-color) 72%, Canvas); border-radius: 50%; background: var(--tag-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--tag-color) 9%, transparent); }
  .priority-nav button.active .priority-dot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--tag-color) 15%, transparent); }
  .priority-copy { display: flex; min-width: 0; align-items: baseline; gap: .42rem; overflow: hidden; font-size: .76rem; font-weight: 560; white-space: nowrap; }
  .priority-code { color: inherit; font-variant-numeric: tabular-nums; letter-spacing: .01em; transition: color 120ms ease, text-shadow 120ms ease; }
  .priority-nav button.active .priority-code, .priority-nav button.active .priority-description { color: var(--primary); text-shadow: 0 0 .42rem color-mix(in srgb, var(--primary) 34%, transparent); }
  .priority-description { overflow: hidden; color: rgba(0,0,0,.5); text-overflow: ellipsis; transition: color 120ms ease, text-shadow 120ms ease; }
  .group-heading { display: flex; width: 100%; align-items: center; gap: .2rem; margin: 1rem 0 .3rem; border-radius: .45rem; padding: .25rem .35rem; color: rgba(0,0,0,.35); font-size: .62rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; transition: 120ms ease; }
  .group-heading:hover { background: var(--btn-plain-bg-hover); color: rgba(0,0,0,.52); }
  .group-heading :global(svg) { font-size: .95rem; transition: transform 160ms ease; }
  .group-heading[aria-expanded='false'] :global(svg) { transform: rotate(-90deg); }
  .tag-dot { display: inline-block; width: .5rem; height: .5rem; flex-shrink: 0; border-radius: 50%; background: var(--tag-color); }
  .task-pane { min-width: 0; background: var(--card-bg); }
  .task-toolbar { display: flex; min-height: 4.6rem; align-items: center; justify-content: space-between; gap: .8rem; border-bottom: 1px solid var(--line-divider); padding: .85rem 1rem; }
  .task-toolbar h2 { margin: 0; color: rgba(0,0,0,.84); font-size: 1.05rem; letter-spacing: -.025em; }
  .task-toolbar > div > span { color: rgba(0,0,0,.4); font-size: .67rem; }
  .task-toolbar label { display: flex; width: 7rem; align-items: center; gap: .35rem; border-radius: .5rem; background: rgba(0,0,0,.035); padding: .42rem .55rem; color: rgba(0,0,0,.35); }
  .task-toolbar input { min-width: 0; width: 100%; outline: none; background: transparent; color: rgba(0,0,0,.75); font-size: .72rem; }
  .task-list { min-height: 28rem; }
  .task-row { display: grid; width: 100%; min-width: 0; grid-template-columns: 1.25rem minmax(0,1fr) auto .8rem; align-items: center; gap: .55rem; border-bottom: 1px solid var(--line-divider); padding: .72rem .85rem; text-align: left; transition: background 100ms ease; }
  .task-row:hover { background: var(--btn-plain-bg-hover); }
  .task-row.selected { background: color-mix(in oklab, var(--primary) 8%, transparent); box-shadow: inset 2px 0 var(--primary); }
  .task-check { display: grid; place-items: center; color: rgba(0,0,0,.35); font-size: 1.05rem; }
  .task-row.completed .task-check { color: var(--primary); }
  .task-copy { min-width: 0; }
  .task-title { display: block; overflow: hidden; color: rgba(0,0,0,.8); font-size: .82rem; font-weight: 570; text-overflow: ellipsis; white-space: nowrap; }
  .task-row.completed .task-title { color: rgba(0,0,0,.42); text-decoration: line-through; text-decoration-thickness: 1px; }
  .task-excerpt { display: block; overflow: hidden; margin-top: .12rem; color: rgba(0,0,0,.4); font-size: .67rem; text-overflow: ellipsis; white-space: nowrap; }
  .task-tags { display: flex; max-width: 11rem; justify-content: flex-end; gap: .25rem; overflow: hidden; }
  .tag-pill { display: inline-flex; max-width: 8rem; align-items: center; gap: .3rem; overflow: hidden; border: 1px solid color-mix(in srgb, var(--tag-color) 30%, transparent); border-radius: 999px; background: color-mix(in srgb, var(--tag-color) 12%, transparent); padding: .16rem .42rem; color: color-mix(in srgb, var(--tag-color) 72%, CanvasText); font-size: .61rem; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
  .row-arrow { color: rgba(0,0,0,.25); font-size: .9rem; }
  .detail-pane { min-width: 0; background: color-mix(in oklab, var(--card-bg) 97%, var(--primary)); }
  .task-detail { display: flex; min-height: 100%; flex-direction: column; padding: 1.35rem 1.5rem; }
  .task-detail > header { display: flex; align-items: center; justify-content: space-between; }
  .task-detail > header > a { color: rgba(0,0,0,.38); }
  .detail-state { display: inline-flex; align-items: center; gap: .35rem; color: rgba(0,0,0,.45); font-size: .68rem; }
  .detail-state.done { color: var(--primary); }
  .task-detail > h2 { margin: 1.15rem 0 .75rem; color: rgba(0,0,0,.88); font-size: clamp(1.25rem, 2.2vw, 1.75rem); line-height: 1.25; letter-spacing: -.045em; }
  .task-detail > h2.completed { color: rgba(0,0,0,.48); text-decoration: line-through; }
  .detail-tags { display: flex; flex-wrap: wrap; gap: .35rem; }
  .detail-rule { height: 1px; margin: 1.2rem 0; background: var(--line-divider); }
  .detail-body { min-width: 0; color: rgba(0,0,0,.64); font-size: .82rem; line-height: 1.75; overflow-wrap: anywhere; }
  .detail-body :global(> :first-child) { margin-top: 0; }
  .detail-body :global(> :last-child) { margin-bottom: 0; }
  .detail-body :global(h1) { font-size: 1.35rem; }
  .detail-body :global(h2) { font-size: 1.08rem; }
  .detail-body :global(h3) { font-size: .98rem; }
  .detail-body :global(h4) { font-size: .9rem; }
  .detail-body :global(h5), .detail-body :global(h6) { font-size: .82rem; }
  .detail-body :global(h1), .detail-body :global(h2), .detail-body :global(h3), .detail-body :global(h4), .detail-body :global(h5), .detail-body :global(h6) { scroll-margin-top: 6rem; letter-spacing: -.025em; }
  .detail-body :global(pre), .detail-body :global(markdown-accessiblity-table) { max-width: 100%; overflow-x: auto; }
  .detail-body :global(img) { max-width: 100%; height: auto; }
  .detail-body :global(a), .task-detail footer a { color: var(--primary); }
  .no-description { color: rgba(0,0,0,.36); font-size: .8rem; }
  .task-detail footer { display: flex; flex-wrap: wrap; gap: .35rem 1rem; margin-top: auto; padding-top: 2rem; color: rgba(0,0,0,.36); font-size: .65rem; }
  .task-detail footer a { display: flex; width: 100%; align-items: center; justify-content: flex-end; gap: .25rem; margin-top: .45rem; font-size: .7rem; font-weight: 650; }
  .detail-empty, .empty-state, .loading-state, .error-state { display: flex; min-height: 28rem; flex-direction: column; align-items: center; justify-content: center; color: rgba(0,0,0,.36); text-align: center; }
  .detail-empty :global(svg), .empty-state :global(svg), .error-state > :global(svg) { color: var(--primary); font-size: 2rem; opacity: .55; }
  .detail-empty p, .empty-state p { margin: .5rem 0 0; font-size: .75rem; }
  .loading-state { flex-direction: row; gap: .55rem; font-size: .82rem; }
  .error-state { padding: 2rem; } .error-state h1 { margin: .7rem 0 .2rem; color: rgba(0,0,0,.78); font-size: 1rem; } .error-state p { margin: 0; font-size: .75rem; }
  .mobile-detail { display: none; }
  button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  :global(.dark) .workspace-nav header h1, :global(.dark) .task-toolbar h2, :global(.dark) .task-title, :global(.dark) .task-detail > h2, :global(.dark) .error-state h1 { color: rgba(255,255,255,.88); }
  :global(.dark) .group-heading { color: rgba(255,255,255,.35); }
  :global(.dark) .group-heading:hover { color: rgba(255,255,255,.52); }
  :global(.dark) .workspace-nav header span, :global(.dark) .workspace-nav header .workspace-note, :global(.dark) .primary-nav button strong, :global(.dark) .priority-nav button strong, :global(.dark) .tag-nav button strong, :global(.dark) .task-toolbar > div > span, :global(.dark) .task-excerpt, :global(.dark) .task-detail footer, :global(.dark) .no-description { color: rgba(255,255,255,.38); }
  :global(.dark) .primary-nav button, :global(.dark) .priority-nav button, :global(.dark) .tag-nav button, :global(.dark) .detail-state { color: rgba(255,255,255,.62); }
  :global(.dark) .detail-body { color: rgba(255,255,255,.62); }
  :global(.dark) .priority-nav button.active .priority-code, :global(.dark) .priority-nav button.active .priority-description { color: color-mix(in srgb, var(--primary) 72%, white); text-shadow: 0 0 .5rem color-mix(in srgb, var(--primary) 48%, transparent); }
  :global(.dark) .priority-description { color: rgba(255,255,255,.5); }
  :global(.dark) .task-toolbar label { background: rgba(255,255,255,.06); color: rgba(255,255,255,.35); } :global(.dark) .task-toolbar input { color: rgba(255,255,255,.76); }
  :global(.dark) .task-check, :global(.dark) .row-arrow, :global(.dark) .task-detail > header > a { color: rgba(255,255,255,.3); }
  :global(.dark) .task-row.completed .task-title, :global(.dark) .task-detail > h2.completed { color: rgba(255,255,255,.42); }
  @media (max-width: 900px) { .workspace { grid-template-columns: 11rem minmax(18rem,1fr); } .detail-pane { display: none; } .mobile-detail { display: block; border-bottom: 1px solid var(--line-divider); background: color-mix(in oklab, var(--card-bg) 97%, var(--primary)); } .mobile-detail .task-detail { min-height: 0; padding: 1rem 1.2rem 1.2rem; } .mobile-detail .task-detail > h2, .mobile-detail .task-detail > header { display: none; } .mobile-detail .task-detail footer { padding-top: 1rem; } }
  @media (max-width: 640px) { .workspace { display: block; min-height: 0; } .workspace-nav { border-right: 0; border-bottom: 1px solid var(--line-divider); padding: .8rem; } .workspace-nav header { display: grid; grid-template-columns: auto 1fr auto; align-items: baseline; gap: .2rem .6rem; padding: 0 .2rem .65rem; } .workspace-nav header p { display: none; } .workspace-nav header h1 { font-size: 1.05rem; } .workspace-nav header .workspace-note { grid-column: 1 / -1; grid-row: 2; max-width: none; margin: 0; } .workspace-nav header span:not(.workspace-note) { grid-column: 3; grid-row: 1; margin: 0; } .primary-nav, .priority-nav, .tag-nav { flex-direction: row; overflow-x: auto; } .primary-nav { margin-bottom: .55rem; } .primary-nav button, .priority-nav button, .tag-nav button { min-width: max-content; grid-template-columns: 1rem auto auto; padding: .45rem .55rem; } .priority-description { display: none; } .group-heading { margin-top: .65rem; } .task-pane { border-right: 0; } .task-toolbar { min-height: 3.8rem; } .task-row { grid-template-columns: 1.2rem minmax(0,1fr) auto; } .task-tags { max-width: 7.5rem; } .row-arrow { display: none; } .task-excerpt { display: none; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  @media (forced-colors: active) { .workspace, .task-row, .tag-pill { border: 1px solid CanvasText; } }
</style>
