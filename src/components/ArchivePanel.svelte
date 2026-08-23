<script lang="ts">
  import { onMount } from 'svelte'

  import I18nKey from '../i18n/i18nKey'
  import { DEFAULT_LOCALE, type Locale } from '../i18n/locales'
  import { createI18n } from '../i18n/translation'
  import {
    getKindDescription,
    getKindLabel,
    isPostKind,
    parseLegacyKind,
    type PostCategory,
    type PostKind,
  } from '../utils/post-taxonomy'
  import { getPostUrlBySlug, getTagUrl } from '../utils/url-utils'

  export let tags: string[] = []
  export let kinds: PostKind[] = []
  export let sortedPosts: Post[] = []
  export let locale: Locale = DEFAULT_LOCALE

  const t = createI18n(locale)
  const params = new URLSearchParams(window.location.search)
  tags = params.getAll('tag')

  const requestedKinds = params.getAll('kind')
  const legacyCategories = params.getAll('category')
  const parsedLegacyKinds = legacyCategories.map((value) => parseLegacyKind(value))
  const hasUnknownLegacyCategory = parsedLegacyKinds.some((kind) => kind === null)
  kinds = [...new Set([
    ...requestedKinds.filter(isPostKind),
    ...parsedLegacyKinds.filter((kind): kind is PostKind => kind !== null),
  ])]

  let activeDescription: string | undefined
  let activeKind: PostKind | undefined
  let groups: Group[] = []

  interface Post {
    slug: string
    data: {
      title: string
      tags: string[]
      category: PostCategory
      kind: PostKind
      published: Date
    }
  }

  interface Group {
    year: number
    posts: Post[]
  }

  function formatDate(date: Date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }

  function formatTag(tagList: string[]) {
    return tagList.map((tag) => `#${tag}`).join(' ')
  }

  onMount(() => {
    if (tags.length === 1 && kinds.length === 0 && legacyCategories.length === 0) {
      window.location.replace(getTagUrl(tags[0], locale))
      return
    }

    if (legacyCategories.length > 0 && !hasUnknownLegacyCategory) {
      const normalized = new URLSearchParams(params)
      normalized.delete('category')
      normalized.delete('kind')
      kinds.forEach((kind) => normalized.append('kind', kind))
      const query = normalized.toString()
      history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
    }

    let filteredPosts = hasUnknownLegacyCategory ? [] : sortedPosts

    if (tags.length > 0) {
      filteredPosts = filteredPosts.filter((post) =>
        post.data.tags.some((tag) => tags.includes(tag))
      )
    }

    if (kinds.length === 1) {
      activeKind = kinds[0]
      activeDescription = getKindDescription(activeKind, locale)
    } else {
      activeDescription = undefined
      activeKind = undefined
    }

    if (kinds.length > 0) {
      filteredPosts = filteredPosts.filter((post) => kinds.includes(post.data.kind))
    }

    const grouped = filteredPosts.reduce(
      (accumulator, post) => {
        const year = post.data.published.getFullYear()
        accumulator[year] ??= []
        accumulator[year].push(post)
        return accumulator
      },
      {} as Record<number, Post[]>
    )

    groups = Object.entries(grouped)
      .map(([year, posts]) => ({ year: Number.parseInt(year, 10), posts }))
      .sort((left, right) => right.year - left.year)
  })
</script>

<div class="card-base px-8 py-6">
  {#if activeDescription && activeKind}
    <div class="mb-4 border-b border-dashed border-[var(--line-divider)] pb-3">
      <p class="text-sm font-medium text-black/70 dark:text-white/70">{getKindLabel(activeKind, locale)}</p>
      <p class="mt-1 text-sm text-black/50 dark:text-white/50">{activeDescription}</p>
    </div>
  {/if}
  {#each groups as group}
    <div>
      <div class="flex h-[3.75rem] w-full flex-row items-center">
        <div class="text-75 w-[15%] text-right text-2xl font-bold transition md:w-[10%]">
          {group.year}
        </div>
        <div class="w-[15%] md:w-[10%]">
          <div class="mx-auto h-3 w-3 rounded-full bg-none outline-3 -outline-offset-[2px] outline-[var(--primary)]"></div>
        </div>
        <div class="text-50 w-[70%] text-left transition md:w-[80%]">
          {group.posts.length} {t(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}
        </div>
      </div>

      {#each group.posts as post}
        <a
          href={getPostUrlBySlug(post.slug, locale)}
          aria-label={post.data.title}
          class="btn-plain group !block h-10 w-full rounded-lg hover:text-[initial]"
        >
          <div class="flex h-full flex-row items-center justify-start">
            <div class="text-50 w-[15%] text-right text-sm transition md:w-[10%]">
              {formatDate(post.data.published)}
            </div>
            <div class="dash-line relative flex h-full w-[15%] items-center md:w-[10%]">
              <div class="z-50 mx-auto h-1 w-1 rounded bg-[oklch(0.5_0.05_var(--hue))] outline-4 outline-[var(--card-bg)] transition-all group-hover:h-5 group-hover:bg-[var(--primary)] group-hover:outline-[var(--btn-plain-bg-hover)] group-active:outline-[var(--btn-plain-bg-active)]"></div>
            </div>
            <div class="text-75 w-[70%] overflow-hidden overflow-ellipsis pr-8 text-left font-bold whitespace-nowrap transition-all group-hover:translate-x-1 group-hover:text-[var(--primary)] md:w-[65%] md:max-w-[65%]">
              {post.data.title}
            </div>
            <div class="text-30 hidden overflow-hidden overflow-ellipsis text-left text-sm whitespace-nowrap transition md:block md:w-[15%]">
              {formatTag(post.data.tags)}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <div class="py-12 text-center text-sm text-black/40 dark:text-white/40">
      {locale === 'en' ? 'No posts match this view.' : '没有符合当前条件的文章。'}
    </div>
  {/each}
</div>
