<script lang="ts">
  import ContinueReading from './ContinueReading.svelte'
  import type { CurrentShelfItem, ShelfItem } from '../types/shelf'

  interface Props {
    items: ShelfItem[]
    currentItems: CurrentShelfItem[]
  }

  const categoryOrder = ['书籍', '漫画', '游戏', '电影', '电视剧', '动漫', '论文']

  let { items = [], currentItems = [] }: Props = $props()
  let availableCategories = $derived(categoryOrder.filter(category => items.some(item => item.shelf === category)))
  let activeCategory: string = $state(categoryOrder.find(category => items.some(item => item.shelf === category)) ?? '')
  let activeSubCategory: string = $state('')
  let categoryItems = $derived(items.filter(item => item.shelf === activeCategory))
  let availableSubCategories = $derived.by(() => {
    const subCategories = new Set<string>()
    for (const item of categoryItems) {
      for (const subCategory of item.subCategory) subCategories.add(subCategory)
    }
    return Array.from(subCategories).sort()
  })
  let filteredItems = $derived(
    activeSubCategory
      ? categoryItems.filter(item => item.subCategory.includes(activeSubCategory))
      : categoryItems
  )

  function categoryId(category: string) {
    return `shelf-category-${categoryOrder.indexOf(category)}`
  }

  function selectCategory(category: string) {
    activeCategory = category
    activeSubCategory = ''
  }

  function selectSubCategory(subCategory: string) {
    activeSubCategory = activeSubCategory === subCategory ? '' : subCategory
  }

  function coverImageState(node: HTMLImageElement) {
    const frame = node.parentElement
    const reveal = () => {
      node.classList.remove('loading')
      frame?.classList.remove('loading')
      frame?.classList.add('loaded')
    }
    const fail = () => {
      node.classList.remove('loading')
      node.classList.add('failed')
      frame?.classList.remove('loading')
      frame?.classList.add('failed')
    }

    if (node.complete) {
      if (node.naturalWidth > 0) reveal()
      else fail()
    } else {
      node.classList.add('loading')
      frame?.classList.add('loading')
      node.addEventListener('load', reveal)
      node.addEventListener('error', fail)
    }

    return {
      destroy() {
        node.removeEventListener('load', reveal)
        node.removeEventListener('error', fail)
      },
    }
  }

  function onCategoryKeydown(event: KeyboardEvent, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()

    let nextIndex = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % availableCategories.length
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + availableCategories.length) % availableCategories.length
    }
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = availableCategories.length - 1

    const nextCategory = availableCategories[nextIndex]
    selectCategory(nextCategory)
    requestAnimationFrame(() => document.getElementById(categoryId(nextCategory))?.focus())
  }
</script>

<div class="shelf-view">
  {#if currentItems.length > 0}
    <ContinueReading items={currentItems} />
  {/if}

  <section class="library" aria-labelledby="library-title">
    <header class="library-heading">
      <div>
        <p class="eyebrow">Library</p>
        <h2 id="library-title">完整收藏</h2>
      </div>
      <p>{items.length} 部作品</p>
    </header>

    <div class="library-layout">
      <nav class="category-nav" aria-label="收藏分类">
        <div class="category-tabs hide-scrollbar" role="tablist" aria-label="收藏分类">
          {#each availableCategories as category, index}
            <button
              id={categoryId(category)}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              aria-controls="shelf-category-panel"
              tabindex={activeCategory === category ? 0 : -1}
              class:active={activeCategory === category}
              onclick={() => selectCategory(category)}
              onkeydown={(event) => onCategoryKeydown(event, index)}
            >
              <span>{category}</span>
              <span class="category-count">{items.filter(item => item.shelf === category).length}</span>
            </button>
          {/each}
        </div>
      </nav>

      <div
        id="shelf-category-panel"
        class="collection-panel"
        role="tabpanel"
        aria-labelledby={categoryId(activeCategory)}
      >
        <header class="collection-heading">
          <div>
            <h3>{activeCategory}</h3>
            <p aria-live="polite">{filteredItems.length} 部作品</p>
          </div>

          {#if availableSubCategories.length > 0}
            <div class="subcategory-filters" aria-label={`${activeCategory}二级分类`}>
              <button
                type="button"
                aria-pressed={activeSubCategory === ''}
                class:active={activeSubCategory === ''}
                onclick={() => activeSubCategory = ''}
              >全部</button>
              {#each availableSubCategories as subCategory}
                <button
                  type="button"
                  aria-pressed={activeSubCategory === subCategory}
                  class:active={activeSubCategory === subCategory}
                  onclick={() => selectSubCategory(subCategory)}
                >{subCategory}</button>
              {/each}
            </div>
          {/if}
        </header>

        {#if activeCategory === '论文'}
          <div class="paper-list">
            {#each filteredItems as item, index}
              <article class="paper-row">
                <div class="paper-main">
                  <span class="paper-index">[{String(index + 1).padStart(2, '0')}]</span>
                  <div class="paper-copy">
                    <a class="paper-title" href={item.url}>{item.title}</a>
                    {#if item.subCategory.length > 0}
                      <div class="paper-tags">
                        {#each item.subCategory as subCategory}<span>{subCategory}</span>{/each}
                      </div>
                    {/if}
                    {#if item.blurb}<p>{item.blurb}</p>{/if}
                  </div>
                </div>
                <div class="paper-footer">
                  <time datetime={item.published}>{item.published}</time>
                  <a href={item.url}>阅读笔记 <span aria-hidden="true">→</span></a>
                  {#if item.arxiv}
                    <a href={item.arxiv} target="_blank" rel="noopener noreferrer">arXiv <span aria-hidden="true">↗</span></a>
                  {/if}
                </div>
              </article>
            {/each}
          </div>
        {:else}
          <div class="cover-grid">
            {#each filteredItems as item (item.id)}
              <a href={item.url} class="shelf-card">
                <div class="cover-frame">
                  <div class="cover-fallback" aria-hidden="true"><span>{item.title}</span></div>
                  {#if item.cover}
                    <img
                      src={item.cover}
                      alt=""
                      loading="lazy"
                      use:coverImageState
                    />
                  {:else}
                    <span class="cover-missing" aria-hidden="true"></span>
                  {/if}
                </div>
                <div class="shelf-card-copy">
                  <span class="shelf-card-title">{item.title}</span>
                  {#if item.blurb}<span class="shelf-card-blurb">{item.blurb}</span>{/if}
                </div>
              </a>
            {/each}
          </div>
        {/if}

        {#if filteredItems.length === 0}
          <div class="empty-state">这个分类下还没有内容。</div>
        {/if}
      </div>
    </div>
  </section>
</div>

<style>
  .shelf-view { display: flex; flex-direction: column; gap: 2rem; }
  .library-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }
  .eyebrow {
    margin-bottom: .2rem;
    color: var(--primary);
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  .library-heading h2 {
    color: rgba(0, 0, 0, .9);
    font-size: 1.55rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -.02em;
  }
  :global(.dark) .library-heading h2 { color: rgba(255, 255, 255, .92); }
  .library-heading > p { color: rgba(0, 0, 0, .4); font-size: .75rem; }
  :global(.dark) .library-heading > p { color: rgba(255, 255, 255, .4); }
  .library-layout { display: flex; width: 100%; flex-direction: column; gap: 1.5rem; }
  .category-nav { min-width: 0; flex-shrink: 0; }
  .category-tabs { display: flex; gap: .4rem; overflow-x: auto; padding: .15rem; }
  .category-tabs button {
    display: flex;
    min-height: 2.65rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: .65rem;
    border-radius: .65rem;
    padding: .55rem .75rem;
    color: rgba(0, 0, 0, .58);
    font-size: .82rem;
    font-weight: 600;
    white-space: nowrap;
    transition: 150ms ease;
  }
  :global(.dark) .category-tabs button { color: rgba(255, 255, 255, .62); }
  .category-tabs button:hover { color: var(--primary); background: var(--btn-plain-bg-hover); }
  .category-tabs button.active {
    color: var(--primary);
    background: color-mix(in oklab, var(--primary) 12%, transparent);
    box-shadow: inset 3px 0 0 var(--primary);
  }
  .category-count {
    min-width: 1.35rem;
    border-radius: 999px;
    padding: .05rem .35rem;
    color: inherit;
    background: color-mix(in oklab, currentColor 8%, transparent);
    font-size: .65rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    opacity: .7;
  }
  .collection-panel { min-width: 0; flex: 1; }
  .collection-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.15rem;
  }
  .collection-heading h3 {
    color: rgba(0, 0, 0, .86);
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.2;
  }
  :global(.dark) .collection-heading h3 { color: rgba(255, 255, 255, .88); }
  .collection-heading p { margin-top: .25rem; color: rgba(0, 0, 0, .4); font-size: .72rem; }
  :global(.dark) .collection-heading p { color: rgba(255, 255, 255, .4); }
  .subcategory-filters { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .35rem; }
  .subcategory-filters button {
    min-height: 2rem;
    border-radius: 999px;
    padding: .35rem .7rem;
    color: rgba(0, 0, 0, .53);
    background: var(--btn-plain-bg-hover);
    font-size: .68rem;
    font-weight: 600;
    transition: 150ms ease;
  }
  :global(.dark) .subcategory-filters button { color: rgba(255, 255, 255, .56); }
  .subcategory-filters button:hover { color: var(--primary); }
  .subcategory-filters button.active {
    color: var(--primary);
    background: color-mix(in oklab, var(--primary) 12%, transparent);
  }
  .cover-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
  .shelf-card { display: flex; min-width: 0; flex-direction: column; gap: .55rem; border-radius: .75rem; }
  .cover-frame {
    position: relative;
    aspect-ratio: 3 / 4;
    width: 100%;
    overflow: hidden;
    border-radius: .72rem;
    background: color-mix(in oklab, var(--primary) 9%, var(--card-bg));
    box-shadow: 0 3px 12px rgba(10, 30, 45, .1);
    transition: 180ms ease;
  }
  .cover-frame::after {
    position: absolute;
    inset: 0;
    content: '';
    background: linear-gradient(
      105deg,
      transparent 25%,
      color-mix(in oklab, var(--primary) 10%, transparent) 45%,
      transparent 65%
    );
    opacity: 0;
    transform: translateX(-100%);
    pointer-events: none;
  }
  .cover-frame.loading::after {
    opacity: 1;
    animation: cover-loading 1.35s ease-in-out infinite;
  }
  .cover-frame img {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 1;
    transition: opacity 160ms ease, transform 240ms ease;
  }
  .cover-frame img.loading { opacity: 0; }
  .cover-frame img.failed { display: none; }
  .cover-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    color: var(--primary);
    font-size: .9rem;
    font-weight: 700;
    line-height: 1.4;
    text-align: center;
  }
  .cover-fallback span { opacity: 0; transition: opacity 160ms ease; }
  .cover-frame.failed .cover-fallback span, .cover-frame:has(.cover-missing) .cover-fallback span { opacity: 1; }
  .cover-missing { display: none; }
  @keyframes cover-loading { to { transform: translateX(100%); } }
  .shelf-card:hover .cover-frame, .shelf-card:focus-visible .cover-frame { box-shadow: 0 8px 22px rgba(10, 30, 45, .18); }
  .shelf-card:hover .cover-frame img, .shelf-card:focus-visible .cover-frame img { transform: scale(1.035); }
  .shelf-card-copy { display: flex; min-width: 0; flex-direction: column; gap: .18rem; padding: 0 .2rem; }
  .shelf-card-title {
    display: -webkit-box;
    overflow: hidden;
    color: rgba(0, 0, 0, .8);
    font-size: .82rem;
    font-weight: 700;
    line-height: 1.3;
    transition: color 150ms ease;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  :global(.dark) .shelf-card-title { color: rgba(255, 255, 255, .84); }
  .shelf-card:hover .shelf-card-title, .shelf-card:focus-visible .shelf-card-title { color: var(--primary); }
  .shelf-card-blurb {
    display: -webkit-box;
    overflow: hidden;
    color: rgba(0, 0, 0, .44);
    font-size: .68rem;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  :global(.dark) .shelf-card-blurb { color: rgba(255, 255, 255, .44); }
  .paper-list { display: flex; flex-direction: column; gap: .6rem; }
  .paper-row {
    display: flex;
    flex-direction: column;
    gap: .7rem;
    border: 1px solid var(--line-divider);
    border-radius: .75rem;
    padding: .9rem 1rem;
    background: color-mix(in oklab, var(--card-bg) 94%, var(--primary));
  }
  .paper-main { display: flex; align-items: flex-start; gap: .6rem; }
  .paper-index { flex-shrink: 0; padding-top: .1rem; color: rgba(0, 0, 0, .3); font-size: .68rem; font-weight: 600; }
  :global(.dark) .paper-index { color: rgba(255, 255, 255, .3); }
  .paper-copy { min-width: 0; }
  .paper-title { color: rgba(0, 0, 0, .84); font-size: .88rem; font-weight: 700; line-height: 1.4; }
  :global(.dark) .paper-title { color: rgba(255, 255, 255, .86); }
  .paper-title:hover { color: var(--primary); }
  .paper-tags { display: flex; flex-wrap: wrap; gap: .25rem; margin-top: .35rem; }
  .paper-tags span { border-radius: .3rem; padding: .15rem .35rem; color: rgba(0, 0, 0, .43); background: var(--btn-plain-bg-hover); font-size: .62rem; }
  :global(.dark) .paper-tags span { color: rgba(255, 255, 255, .46); }
  .paper-copy p { margin-top: .5rem; color: rgba(0, 0, 0, .53); font-size: .75rem; line-height: 1.6; }
  :global(.dark) .paper-copy p { color: rgba(255, 255, 255, .54); }
  .paper-footer { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1rem; padding-left: 2.15rem; font-size: .68rem; }
  .paper-footer time { color: rgba(0, 0, 0, .32); }
  :global(.dark) .paper-footer time { color: rgba(255, 255, 255, .32); }
  .paper-footer a { color: rgba(0, 0, 0, .46); }
  :global(.dark) .paper-footer a { color: rgba(255, 255, 255, .46); }
  .paper-footer a:hover { color: var(--primary); }
  .empty-state { display: grid; min-height: 10rem; place-items: center; color: rgba(0, 0, 0, .34); font-size: .78rem; }
  :global(.dark) .empty-state { color: rgba(255, 255, 255, .34); }
  button:focus-visible, a:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }

  @media (min-width: 40rem) { .cover-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 48rem) { .cover-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.1rem; } }
  @media (min-width: 64rem) {
    .library-layout { flex-direction: row; gap: 2rem; }
    .category-nav { width: 10rem; }
    .category-tabs { flex-direction: column; overflow: visible; }
    .category-tabs button { width: 100%; }
    .cover-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (min-width: 80rem) { .cover-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  @media (max-width: 47.999rem) {
    .collection-heading { align-items: start; flex-direction: column; }
    .subcategory-filters { justify-content: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .category-tabs button, .subcategory-filters button, .cover-frame, .cover-frame img, .cover-fallback span, .shelf-card-title { transition: none; }
    .cover-frame::after { animation: none; }
    .shelf-card:hover .cover-frame img, .shelf-card:focus-visible .cover-frame img { transform: none; }
  }
  @media (forced-colors: active) {
    .category-tabs button.active, .subcategory-filters button.active { border: 1px solid SelectedItem; }
  }
</style>
