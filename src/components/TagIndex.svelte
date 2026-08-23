<script lang="ts">
  import { getTagUrl } from '@/utils/url-utils'
  import type { Tag } from '@/utils/content-utils'
  import type { Locale } from '@/i18n/locales'

  export let tags: Tag[] = []
  export let locale: Locale = 'zh-CN'

  type SortMode = 'count' | 'name'
  let sortMode: SortMode = 'count'
  const labels = locale === 'en'
    ? { count: 'By post count', name: 'By name', frequent: 'Frequent', extended: 'More', single: 'Single-post tags' }
    : { count: '按文章数', name: '按名称', frequent: '常见标签', extended: '延伸标签', single: '单篇标签' }

  $: sortedTags = [...tags].sort((left, right) =>
    sortMode === 'count'
      ? right.count - left.count || left.name.localeCompare(right.name, locale)
      : left.name.localeCompare(right.name, locale)
  )
  $: frequent = sortedTags.filter((tag) => tag.count >= 5)
  $: extended = sortedTags.filter((tag) => tag.count > 1 && tag.count < 5)
  $: single = sortedTags.filter((tag) => tag.count === 1)

  function groupLabel(label: string, count: number): string {
    return `${label} · ${count}`
  }
</script>

<div class="mb-5 flex flex-wrap gap-2" aria-label={locale === 'en' ? 'Tag sorting' : '标签排序'}>
  <button type="button" class:active={sortMode === 'count'} class="sort-button" onclick={() => sortMode = 'count'}>{labels.count}</button>
  <button type="button" class:active={sortMode === 'name'} class="sort-button" onclick={() => sortMode = 'name'}>{labels.name}</button>
</div>

<div class="space-y-6">
  {#each [[labels.frequent, frequent], [labels.extended, extended], [labels.single, single]] as [label, group]}
    {#if group.length > 0}
      <section>
        <h2 class="mb-3 text-xs font-semibold tracking-[0.12em] text-black/40 uppercase dark:text-white/40">{groupLabel(label, group.length)}</h2>
        <div class="flex flex-wrap gap-2">
          {#each group as tag}
            <a href={getTagUrl(tag.name, locale)} class="tag-pill">
              <span>{tag.name}</span>
              {#if tag.count > 1}<span class="text-xs opacity-45">{tag.count}</span>{/if}
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/each}
</div>

<style>
  .sort-button, .tag-pill { border-radius: .65rem; transition: 150ms ease; }
  .sort-button { padding: .45rem .75rem; color: color-mix(in oklab, currentColor 55%, transparent); font-size: .75rem; }
  .sort-button:hover, .tag-pill:hover { background: var(--btn-plain-bg-hover); color: var(--primary); }
  .sort-button.active { background: color-mix(in oklab, var(--primary) 13%, transparent); color: var(--primary); font-weight: 600; }
  .tag-pill { display: inline-flex; height: 2rem; align-items: center; gap: .4rem; padding: 0 .7rem; background: color-mix(in oklab, var(--card-bg) 82%, transparent); color: color-mix(in oklab, currentColor 72%, transparent); font-size: .8rem; }
  @media (prefers-reduced-motion: reduce) { .sort-button, .tag-pill { transition: none; } }
</style>
