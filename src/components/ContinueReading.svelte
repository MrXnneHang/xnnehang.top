<script lang="ts">
  import type { CurrentShelfItem } from '../types/shelf'

  interface Props {
    items: CurrentShelfItem[]
  }

  let { items = [] }: Props = $props()
</script>

<section class="current-reading" aria-labelledby="current-reading-title">
  <header class="section-heading">
    <div>
      <p class="eyebrow">Reading now</p>
      <h2 id="current-reading-title">继续阅读</h2>
    </div>
    <p>为正在读的书留个位置，也提醒自己继续读下去。</p>
  </header>

  <div class="current-grid" class:single={items.length === 1}>
    {#each items as item}
      <article class="current-card">
        <div class="bookmark" class:indeterminate={item.progressPercent === null} aria-hidden="true">
          <span style:height={item.progressPercent === null ? undefined : `${item.progressPercent}%`}></span>
        </div>

        <div class="cover-wrap">
          {#if item.cover}
            <img src={item.cover} alt="" loading="eager" />
          {:else}
            <div class="cover-fallback" aria-hidden="true">{item.title}</div>
          {/if}
        </div>

        <div class="current-copy">
          <div>
            <span class="medium">{item.shelf}</span>
            <h3>{item.title}</h3>
          </div>

          <div class="reading-meta">
            <span class="reading-status">{item.progressLabel}</span>
            {#if item.lastActivity}
              <time datetime={item.lastActivity}>更新于 {item.lastActivity}</time>
            {/if}
          </div>

          {#if item.note}
            <p class="note">{item.note}</p>
          {/if}

          <div class="note-action">
            {#if item.noteUrl}
              <a href={item.noteUrl} aria-label={`阅读《${item.title}》的笔记`}>阅读笔记 <span aria-hidden="true">→</span></a>
            {:else}
              <span>笔记尚未开始</span>
            {/if}
          </div>
        </div>
      </article>
    {/each}
  </div>
</section>

<style>
  .current-reading {
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--line-divider);
  }
  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .section-heading > p {
    max-width: 25rem;
    color: rgba(0, 0, 0, .46);
    font-size: .8rem;
    line-height: 1.55;
    text-align: right;
  }
  :global(.dark) .section-heading > p { color: rgba(255, 255, 255, .46); }
  .eyebrow {
    margin-bottom: .2rem;
    color: var(--primary);
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  h2 {
    color: rgba(0, 0, 0, .9);
    font-size: 1.55rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -.02em;
  }
  :global(.dark) h2 { color: rgba(255, 255, 255, .92); }
  .current-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
    gap: .75rem;
  }
  .current-grid.single { grid-template-columns: minmax(0, 34rem); }
  .current-card {
    position: relative;
    display: grid;
    grid-template-columns: 4.7rem minmax(0, 1fr);
    min-height: 8.7rem;
    gap: 1rem;
    overflow: hidden;
    border: 1px solid color-mix(in oklab, var(--primary) 14%, transparent);
    border-radius: .9rem;
    padding: .85rem .95rem .85rem 1.15rem;
    background:
      linear-gradient(120deg, color-mix(in oklab, var(--primary) 7%, transparent), transparent 58%),
      var(--card-bg);
  }
  .bookmark {
    position: absolute;
    inset: 0 auto 0 0;
    width: .3rem;
    overflow: hidden;
    background: color-mix(in oklab, var(--primary) 15%, var(--line-divider));
  }
  .bookmark span {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    min-height: .65rem;
    background: var(--primary);
  }
  .bookmark.indeterminate span {
    top: 0;
    bottom: auto;
    height: 2.25rem;
    border-radius: 0 0 .25rem 0;
  }
  .cover-wrap {
    aspect-ratio: 3 / 4;
    align-self: center;
    overflow: hidden;
    border-radius: .5rem;
    background: color-mix(in oklab, var(--primary) 8%, var(--card-bg));
    box-shadow: 0 5px 15px rgba(10, 30, 45, .14);
  }
  .cover-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .cover-fallback {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    padding: .5rem;
    color: var(--primary);
    font-size: .72rem;
    font-weight: 700;
    text-align: center;
  }
  .current-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: space-between;
    gap: .45rem;
  }
  .medium {
    display: inline-flex;
    margin-bottom: .3rem;
    color: var(--primary);
    font-size: .65rem;
    font-weight: 700;
    letter-spacing: .08em;
  }
  h3 {
    overflow: hidden;
    color: rgba(0, 0, 0, .86);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.dark) h3 { color: rgba(255, 255, 255, .88); }
  .reading-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem .75rem; }
  .reading-status {
    display: inline-flex;
    align-items: center;
    min-height: 1.55rem;
    border-radius: 999px;
    padding: .15rem .6rem;
    color: var(--primary);
    background: color-mix(in oklab, var(--primary) 11%, transparent);
    font-size: .7rem;
    font-weight: 700;
  }
  time, .note { color: rgba(0, 0, 0, .45); font-size: .7rem; }
  :global(.dark) time, :global(.dark) .note { color: rgba(255, 255, 255, .45); }
  .note { display: -webkit-box; overflow: hidden; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .note-action { min-height: 1.4rem; font-size: .72rem; }
  .note-action a { color: var(--primary); font-weight: 600; }
  .note-action a:hover { text-decoration: underline; text-underline-offset: .2rem; }
  .note-action > span { color: rgba(0, 0, 0, .34); }
  :global(.dark) .note-action > span { color: rgba(255, 255, 255, .34); }
  .note-action a:focus-visible { border-radius: .2rem; outline: 2px solid var(--primary); outline-offset: 3px; }

  @media (max-width: 39.999rem) {
    .section-heading { align-items: start; flex-direction: column; gap: .4rem; }
    .section-heading > p { max-width: none; text-align: left; }
    .current-card { grid-template-columns: 4.2rem minmax(0, 1fr); min-height: 8rem; gap: .8rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .note-action a { transition: none; }
  }
</style>
