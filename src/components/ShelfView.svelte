<script lang="ts">
import { onMount } from 'svelte'

interface ShelfItem {
  id: string
  title: string
  shelf: string
  tags: string[]
  blurb: string
  cover: string
  url: string
  published: string
}

interface Props {
  items: ShelfItem[]
}

let { items = [] }: Props = $props()

// --- State ---
let activeCategory: string = $state('')
let activeTag: string = $state('')

// --- Derived ---
const categories = ['电影', '电视剧', '动漫', '书籍', '漫画', '游戏', '论文']

let availableCategories = $derived(
  categories.filter(c => items.some(item => item.shelf === c))
)

// Set initial active category
$effect(() => {
  if (!activeCategory && availableCategories.length > 0) {
    activeCategory = availableCategories[0]
  }
})

let categoryItems = $derived(
  items.filter(item => item.shelf === activeCategory)
)

// Collect all unique tags for current category
let availableTags = $derived(() => {
  const tagSet = new Set<string>()
  for (const item of categoryItems) {
    for (const tag of item.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
})

let filteredItems = $derived(
  activeTag
    ? categoryItems.filter(item => item.tags.includes(activeTag))
    : categoryItems
)

function selectCategory(cat: string) {
  activeCategory = cat
  activeTag = ''
}

function selectTag(tag: string) {
  activeTag = activeTag === tag ? '' : tag
}
</script>

<div class="flex w-full flex-col gap-6 lg:flex-row lg:gap-8">
  <!-- Left sidebar nav -->
  <nav class="shrink-0 lg:w-[160px]">
    <div class="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
      {#each availableCategories as cat}
        <button
          class="rounded-lg px-4 py-2 text-left text-sm font-medium whitespace-nowrap transition
            {activeCategory === cat
              ? 'bg-[oklch(0.55_0.16_55)] text-white shadow-sm'
              : 'hover:bg-black/5 dark:hover:bg-white/5 text-black/70 dark:text-white/70'}"
          onclick={() => selectCategory(cat)}
        >
          <span>{cat}</span>
          <span class="ml-1 opacity-60">{items.filter(i => i.shelf === cat).length}</span>
        </button>
      {/each}
    </div>
  </nav>

  <!-- Main content -->
  <div class="min-w-0 flex-1">
    <!-- Category header -->
    <div class="mb-4">
      <p class="text-30 mb-1 text-xs font-medium tracking-wider uppercase">Collection</p>
      <h2 class="text-2xl font-bold">{activeCategory}</h2>
      <p class="text-50 mt-1 text-sm">{categoryItems.length} 部作品</p>
    </div>

    <!-- Tag filters -->
    {#if availableTags().length > 0}
      <div class="mb-5 flex flex-wrap gap-2">
        <button
          class="rounded-full px-3 py-1 text-xs font-medium transition
            {activeTag === ''
              ? 'bg-[oklch(0.55_0.16_55)] text-white'
              : 'bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'}"
          onclick={() => activeTag = ''}
        >
          全部
        </button>
        {#each availableTags() as tag}
          <button
            class="rounded-full px-3 py-1 text-xs font-medium transition
              {activeTag === tag
                ? 'bg-[oklch(0.55_0.16_55)] text-white'
                : 'bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'}"
            onclick={() => selectTag(tag)}
          >
            {tag}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Grid of items -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
      {#each filteredItems as item}
        <a
          href={item.url}
          class="group flex flex-col gap-2 overflow-hidden rounded-xl transition active:scale-[0.97]"
        >
          <!-- Cover -->
          <div class="aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 shadow-sm transition group-hover:shadow-md dark:bg-neutral-800">
            {#if item.cover}
              <img
                src={item.cover}
                alt={item.title}
                class="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
            {:else}
              <div class="flex h-full w-full items-center justify-center p-3">
                <span class="text-center text-sm font-bold leading-snug text-black/40 dark:text-white/40">
                  {item.title}
                </span>
              </div>
            {/if}
          </div>
          <!-- Title & blurb -->
          <div class="flex flex-col gap-0.5 px-1">
            <span class="line-clamp-2 text-sm font-semibold leading-tight transition group-hover:text-[oklch(0.55_0.16_55)]">
              {item.title}
            </span>
            {#if item.blurb}
              <span class="text-50 line-clamp-2 text-xs leading-snug">{item.blurb}</span>
            {/if}
          </div>
        </a>
      {/each}
    </div>

    {#if filteredItems.length === 0}
      <div class="flex h-40 items-center justify-center text-sm text-black/30 dark:text-white/30">
        暂无内容
      </div>
    {/if}
  </div>
</div>
