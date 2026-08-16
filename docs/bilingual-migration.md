# Bilingual migration runbook

> Durable recovery record for Issue #119. Update this file after every atomic implementation, translation, or verification step. The final line under **Resume here** must always name one concrete next action.

## Immutable decisions

- Delivery: one branch (`feat/bilingual-site`), one large PR, internal checkpoints only.
- Default locale: Simplified Chinese (`zh-CN`) on all existing unprefixed URLs.
- English locale: `/en/` prefix for the entire public site.
- Examples: `/about/` ↔ `/en/about/`; `/posts/example/` ↔ `/en/posts/example/`.
- No browser-language forced redirects. Explicit language choice is persisted, while direct URLs remain authoritative.
- Every currently published Chinese post receives exactly one complete English translation before merge.
- Translation drafts may be produced with Haiku; structural decisions, application, review, and verification remain with Opus.
- Existing Chinese source posts and author-selected first body images remain unchanged.
- Dynamic Todo issue content stays in its source language; only the surrounding English UI is localized.
- Existing untracked user files at repository root must remain untouched.

## Checkpoints

- [x] C0 — Create branch and durable migration ledger.
- [x] C1 — Add locale domain, locale-aware URL helpers, request-scoped translations, and switcher.
- [ ] C2 — Add shared `/en/` route family and localize site chrome/static pages.
- [ ] C3 — Add translation identity and locale-isolated post/taxonomy/series/graph/search/statistics APIs.
- [ ] C4 — Add bilingual SEO, RSS, sitemap, Pagefind, and corpus validators.
- [x] C5 — Translate and review all 66 published posts.
- [ ] C6 — Complete automated and browser end-to-end verification.
- [ ] C7 — Review diff and prepare one template-compliant PR closing Issue #119.

## Current checkpoint

**C5 — complete: all 66 published Chinese posts now have reviewed English translations; each pair has locale-scoped links and passed production-build validation.**

## Session handoff — 2026-08-16

- Completed and reviewed `what-is-my-ability-in-llm-era.en.md`, the final pending English post. It preserves the `neko.jpg` cover, three GFM notes, all external links, inline technical identifiers, and the English RAG WikiLink; its generated route resolves that link under `/en/posts/`.
- The production build passes with 185 generated pages and Pagefind indexing 138 pages across isolated `zh-cn` and `en` corpora. A focused `post-locale` test attempt is still running after its initial timeout; previous attempts remain blocked by the missing `vite-plus` executable. Browser-level route/search/log verification remains pending because production-preview navigation closes the Browser target and a user-owned process occupies the configured development port 4321. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed and reviewed `vampires-melody.en.md`. It preserves the shelf metadata and shelf cover, its author-selected first body image and all ten source image paths, all three blockquotes including the final hard break, and its English WikiLink to the existing companion review. The English route is generated and its body link resolves under `/en/posts/`.
- The production build passes with 184 generated pages and Pagefind indexing 137 pages across isolated `zh-cn` and `en` corpora. Focused `post-locale` tests remain blocked by the missing `vite-plus` executable. Browser-level route/search/log verification remains pending because production-preview navigation closes the Browser target and a user-owned process occupies the configured development port 4321. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Reviewed and verified the existing `sparsing-and-densing-embeddings.en.md` translation. It is prose-complete and preserves the frontmatter cover, five code fences, five tables, nine directives, all headings, external source, and both English WikiLinks. Its generated route resolves its links only under `/en/posts/`.
- The production build passes with 182 generated pages and Pagefind indexing 136 pages across isolated `zh-cn` and `en` corpora. It emits an existing source-and-translation warning because the shared `Cpp` code-fence language is unsupported by Expressive Code and falls back to plain text; this does not affect rendering. Focused `post-locale` tests remain blocked by the missing `vite-plus` executable. Browser-level route/search/log verification remains pending because production-preview navigation closes the Browser target and a user-owned process occupies the configured development port 4321. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed and reviewed `progressive-disclosure-and-novel-agent.en.md`. It preserves the frontmatter cover and all seven source image references, two hard-break blockquotes, directive, external sources, and the entire original Fable 5 quotation. Its English WikiLink resolves to the existing English memU architecture article under `/en/posts/`.
- The production build passes with 182 generated pages and Pagefind indexing 136 pages across isolated `zh-cn` and `en` corpora. Focused `post-locale` tests remain blocked by the missing `vite-plus` executable. Browser-level route/search/log verification remains pending because production-preview navigation closes the Browser target and a user-owned process occupies the configured development port 4321. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed and reviewed `obsidian-yolo.en.md`. It preserves the author-selected first body image plus all ten local image paths, its GitHub card, external release-note link, headings, configuration literals, and the localized WikiLink to the existing English Fuwari guide. The English route is generated and the relationship link resolves under `/en/posts/`.
- The production build passes with 181 generated pages and Pagefind indexing 135 pages across isolated `zh-cn` and `en` corpora. Focused `post-locale` tests remain blocked by the missing `vite-plus` executable. Browser-level route/search/log verification remains pending because production-preview navigation closes the Browser target and a user-owned process occupies the configured development port 4321. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed and reviewed `nekopara-vol-1.en.md`. It retains the existing `nekopra2.jpg` frontmatter cover, all three blockquotes and their 17 deliberate `<br>` line breaks, inline Steam/Bilibili URLs, and both English WikiLinks to the existing English companion articles. The English route is generated and its body links resolve under `/en/posts/`.
- The production build passes with 180 generated pages and Pagefind indexing 134 pages across isolated `zh-cn` and `en` corpora. Focused `post-locale` tests remain blocked by the missing `vite-plus` executable. Browser-level route/search/log verification remains pending because production-preview navigation closes the Browser target and a user-owned process occupies the configured development port 4321. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed and reviewed the linked English translations `long-term-memory-graduation-review-and-plan.en.md` and `rag-blog-graph.en.md`. They preserve both author-selected first body images, all five Bilibili embeds, seven GitHub cards, six RAG directives, the RAG `text` fence, external links, and structural Markdown. Their WikiLinks resolve only to English `/en/posts/` targets, including the pair’s mutual link and the dash-sensitive `Attention Is Limited — Lost in the Middle` target.
- The production build passes with 179 generated pages and Pagefind indexing 133 pages across isolated `zh-cn` and `en` corpora. Focused `post-locale` tests remain blocked by the missing `vite-plus` executable. Production-preview navigation closes the Browser target, and the configured development server cannot start because an existing user-owned process occupies port 4321; browser-level route/search/log verification is therefore pending. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed, reviewed, and verified `heguang-tongchen.en.md`. It preserves the local cover, all ten body images, both Bilibili embeds, three Bilibili links, quotations and line breaks; it uses `translationKey: heguang-tongchen` and resolves its WikiLink only to the existing English `/en/posts/xianni-huafan/` article.
- The production build passes with 177 generated pages, and Pagefind indexes 131 pages across isolated `zh-cn` and `en` corpora. Browser checks confirm English metadata, media/embeds, the locale-safe link, Chinese-source language switch, title search discovery, and clean browser/server logs.
- Focused `post-locale` tests remain blocked because the installed dependencies lack the configured `vite-plus` executable. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed, reviewed, and verified the linked English *A Chinese Odyssey* pair: `yueguang-baohe.en.md` and `dasheng-quqin.en.md`. All 37 local image paths, captions, quotations, lists, and source structure remain intact; reciprocal WikiLinks resolve under `/en/posts/`, while the Part Two post also targets the existing English God of Cookery article.
- The production build passes with 176 generated pages, and Pagefind indexes 130 pages across isolated `zh-cn` and `en` corpora. Browser checks confirm full galleries, localized metadata, body/relationship links, Chinese-source language switches, English search discovery, and clean browser/server logs.
- Focused `post-locale` tests remain blocked because the installed dependencies lack the configured `vite-plus` executable. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed, reviewed, and verified the linked English translation pair `cunzai-zhuyi.en.md` and `cunzai-zhijin.en.md`. The reading note retains its cover image, nested headings, italic quotations, and external reference; its companion retains the author-selected first body image, headings, blockquotes, and emphasis. Their reciprocal WikiLinks resolve only to `/en/posts/cunzai-zhuyi/` and `/en/posts/cunzai-zhijin/`.
- The production build passes with 173 generated pages, and Pagefind indexes 128 pages across isolated `zh-cn` and `en` corpora. Browser checks confirm localized metadata, images, reciprocal links, relationship cards, Chinese-source language switches, English title search, and clean browser/server logs.
- Focused `post-locale` tests remain blocked because the installed dependencies lack the configured `vite-plus` executable. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed, reviewed, and verified `cloud-service-provider.en.md`. It preserves all four source image paths, external links, the GitHub card, admonitions, and the original Markdown hierarchy; it pairs with `translationKey: cloud-service-provider` and resolves all three outgoing WikiLinks only to their existing English `/en/posts/` targets.
- The production build passes with 171 generated pages, and Pagefind indexes 126 pages across isolated `en` and `zh-cn` corpora. Browser checks confirm the English route's localized metadata, four optimized images, three resolved body links, language switch to `/posts/cloud-service-provider/`, and English search result. Browser/server logs are clean; the GitHub card's optional unauthenticated API request returns an external 403 rate-limit response.
- Focused `post-locale` tests remain blocked because the installed dependencies lack the configured `vite-plus` executable. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed, reviewed, and verified the linked English translation pair, `yi-nian-yiwan-yuan.en.md` and `meiyou-mingtian.en.md`. Both preserve their author-selected first body images and source structure, use matching `translationKey` values, and replace their reciprocal Chinese WikiLinks with the target English titles so both body and relationship links resolve under `/en/posts/`.
- The production build passes with 170 generated pages; Pagefind indexes 125 pages across isolated `zh-cn` and `en` corpora. Browser checks confirm both English articles render their localized metadata and images, switch back to their Chinese source paths, have clean browser/server logs, and English Pagefind finds `We Who Have No Tomorrow Fell in Love Yesterday`.
- The focused `post-locale` suite could not run because the current dependency installation has no `vite-plus` executable. No commit or push was made; preserve all unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed, reviewed, and verified the second English post translation, `travellin-cats-in-germany.en.md`. It preserves the source article's first body image and shelf cover, uses `translationKey: travellin-cats-in-germany`, and localizes the title, description, tags, category, and prose without changing the Chinese source.
- The build emits `/en/posts/travellin-cats-in-germany/`; Pagefind now indexes 74 pages. The English Statistics catalog contains two translated posts and records this article at `/en/posts/travellin-cats-in-germany/` with English title/category metadata.
- Focused locale tests pass 23/23 and the complete production build passes. No commit or push was made; stop after this one article as requested.

- Completed and browser-verified `/statistics/` and `/en/statistics/` through the shared `LocalizedStatisticsPage.astro`, with localized Statistics, Writing Trail, calendar/charts/series, and Graph UI/ARIA/formatting.
- Fixed the long-term analytics contract: English site totals include only `/en` paths, Chinese totals use the complementary non-`/en` filter, translation-pair article metrics stay separate by actual path, and historical unprefixed traffic remains Chinese. Locale visitor totals are not additive unique-user counts.
- Statistics schema is now version 2 with an explicit locale. The build emits isolated content catalogs, snapshots, and graph data at root and `/en/`; fallback validation rejects a snapshot from the wrong locale.
- English content statistics contain only actual `lang: en` entries and their English title/category/series metadata. Build assertions passed for one English post versus 66 Chinese posts, `/en/posts/` paths, locale IDs, and absence of the known Chinese source title/category in English JSON.
- Statistics pipeline tests pass 12/12 and focused Statistics/Graph locale tests pass 5/5. The full production build passes and Pagefind indexes 73 pages in separate `zh-cn` and `en` indexes.
- Browser verification confirmed English Statistics has no Chinese copy, fetches `/en/statistics.json` and `/en/graph-data.json`, links to `/en/privacy/`, switches equivalently to `/statistics/`, and has no mobile horizontal overflow. English Pagefind finds `Demian` but not `德米安`; Chinese Pagefind finds a Chinese-only title with unprefixed result URLs. Final production-preview console and server logs were clean.
- The local preview initially lacked Pagefind because it was started from the preceding Astro-only build; after the complete build regenerated `dist/pagefind`, a fresh preview had no console errors. The preview tool reports successful HEAD requests as aborted because response bodies are intentionally not consumed; this is not a site failure.
- No commit or push was made. Preserve all existing unrelated working-tree changes and the user-owned untracked root Markdown file.

- Completed and browser-verified the shared bilingual Next/Todo workspace at `/todo/` and `/en/todo/`; both routes consume the same `/todo.json`, preserving GitHub Issue titles, descriptions, and labels in their source language while localizing the surrounding UI.
- Todo uses `LocalizedTodoPage.astro` plus a tested `todo-locale.ts` domain dictionary for workspace states, priority descriptions, counts, dates, controls, empty/error/loading states, GitHub actions, and accessibility labels. The focused locale suite now passes 25/25; the Todo data pipeline remains 13/13.
- The production build now emits 102 pages and Pagefind indexes 73 pages. Empty-snapshot interactions were verified on desktop and mobile with locale-correct language-switch targets and clean browser/server consoles.
- C2 now has no remaining route/UI page except Statistics. Before implementing `/en/statistics/`, decide whether English analytics use only translated-post data, how GA4 paths map across translation pairs, and how public aggregate history avoids cross-locale title/category leakage.
- Completed and browser-verified the shared bilingual Privacy page at `/privacy/` and `/en/privacy/`; the English Markdown preserves the Chinese page's GA4 disclosure, data limitations, opt-out guidance, and external Google policy link.
- Privacy uses `LocalizedPrivacyPage.astro`; both locale routes have correct `<html lang>`, Footer self-links, equivalent language-switch targets, and clean browser/server consoles. The focused locale suite remains 22/22; the production build now emits 101 pages and Pagefind indexes 73 pages.
- The next concrete C2 page is Next/Todo. Dynamic GitHub Issue content remains in its source language by design; only the surrounding English UI, dates, states, controls, and accessibility text should be localized. Statistics still waits for a locale-specific statistics-data decision.
- Completed and browser-verified the shared bilingual Shelf page at `/shelf/` and `/en/shelf/`; the focused locale suite now passes 22/22 and the production build emits 100 pages.
- Shelf keeps a single canonical media dataset with localized display fields. The English collection is locale-isolated and currently contains only the translated `demian` entry.
- The next concrete C2 page is Privacy; Next/Todo follows, while Statistics waits for a locale-specific statistics-data decision.
- Completed and browser-verified the shared bilingual About page at `/about/` and `/en/about/`, including the full English self-description, all eleven localized photo captions/alt texts, localized carousel controls, lightbox metadata, and a fixed-height overflow-caption popover.
- Completed and browser-verified the shared bilingual Friends page at `/friends/` and `/en/friends/`, including translated exchange instructions, English friend descriptions, locale-specific accessibility labels, and unchanged friend names/avatars/URLs.
- Restarted the development server on port 4321 after Astro's stale content index failed to discover `friends.en.md`; `/en/friends/` then loaded normally with no browser-console or server errors.
- Final focused locale suite passes 18/18. The final production build emits 99 pages, including both About and Friends locale pairs; Pagefind indexes 72 pages across `zh-cn` and `en`.
- No commit or push was made. Preserve all existing unrelated working-tree changes and the user-owned untracked root Markdown file.

## Checkpoint log

### C0 — recovery scaffold

- Confirmed `src/content/posts/` contains exactly 66 flat Markdown files, all published, with no drafts.
- Created branch `feat/bilingual-site` from `master`.
- Created this runbook with a generated 66-row translation ledger.
- No functional source files changed yet.

### C1 — locale domain and URL foundation

- Added `src/i18n/locales.ts` with the canonical locale union, metadata, pathname inference, prefix stripping, internal-path localization, and locale-aware home/post detection.
- Added `src/i18n/locales.test.ts`; all six focused tests pass, including prefix idempotence and query/hash preservation.
- Chinese remains the fallback for absent, unknown, and `zh_*` locale values; only a leading `/en` segment selects English.
- Refactored `src/i18n/translation.ts` with locale-bound dictionaries/functions while retaining the existing global `i18n(key)` behavior for untouched callers.
- Refactored `src/utils/url-utils.ts` so all existing calls remain unprefixed Chinese, while an explicit English locale yields `/en/...` for posts, archives, categories, tags, and series.
- Added translation and URL utility tests; the combined locale foundation suite passes 15/15.
- First combined run exposed two test-harness assumptions (Vite+ alias resolution and the existing Chinese word `主页`); tests/imports were corrected to match repository behavior. No production behavior exception remains.
- Threaded locale through `Layout.astro`, `MainGridLayout.astro`, navbar presets, mobile navigation, theme labels, and `ConfigCarrier`; hard-coded client route-family checks now recognize `/en/` homes/posts.
- Added an accessible `简中 / EN` switch beside the independent theme control. It preserves query parameters at render time, appends the current hash on click, records explicit choice in `localStorage`, and does not force browser-language redirects.
- Fixed a double-localization wiring bug found by browser DOM inspection: English now targets `/en/` instead of `/`.
- Tightened the post schema to `zh-CN | en` with optional `translationKey`; all 66 untouched legacy posts default to Chinese.
- Added `src/utils/post-locale.ts` and tests for locale filtering, stable route slugs, and same-locale prev/next links.
- Refactored core post/taxonomy/series loaders to accept a locale before any English content is introduced.
- Added shared localized home rendering and generated `/en/`; with zero English drafts present, it intentionally renders no post cards and does not leak Chinese taxonomy/content.
- Threaded locale through home post cards, pagination, profile, sidebar widgets, and “more” labels.

### C2 — shared English routes and UI

- Started the English route family with `/en/`; build output contains `dist/en/index.html`.
- English homepage currently has localized navigation, theme labels, sidebar headings, route URLs, locale carrier, and `<html lang="en">`.
- Added shared archive and series presenters plus `/en/archive/` and `/en/series/`; English dynamic series pages are generated from the English corpus only.
- Browser verification of `/en/archive/` confirmed correct title/lang/switch targets and zero Chinese post links.
- Localized global Footer, Search, and DisplaySettings; English privacy/RSS links now use `/en/`, while the shared sitemap remains at the root.
- An initial chrome build failed because runes `$props/$derived` were mixed into legacy-reactive Svelte components. Restored their existing `export let` mode; focused tests and the production build pass again.
- Restarted the preview server after the failed-build HMR state and confirmed Search, DisplaySettings, LightDarkSwitch, and ArchivePanel hydrate with no server or console errors.
- Extracted the About page into `LocalizedAboutPage.astro`, added `/en/about/`, and completed the English translation of its hero, long-form self-description, drive cards, friends calls-to-action, and all eleven photo descriptions.
- Localized the About photo deck's static and dynamically updated accessibility labels. Long captions retain a fixed clamped layout to prevent card-height shifts and expose a non-layout-shifting full-caption popover only when the text actually overflows.
- Extracted the Friends page into `LocalizedFriendsPage.astro`, added `/en/friends/`, translated the exchange instructions and friend descriptions, and preserved each friend's original name, avatar, and external URL.
- Added locale-specific avatar and external-link accessibility labels; English and Chinese Friends routes remain equivalent language-switch targets and keep responsive cards free of horizontal overflow.
- Extracted Shelf into `LocalizedShelfPage.astro`, added `/en/shelf/`, and kept canonical media records/category keys shared while localizing categories, subcategories, current-reading metadata, progress units, counts, empty states, and accessibility labels at presentation time.
- Extended the current-shelf schema with optional English title/note/progress-unit fields instead of duplicating records. The English Shelf exposes only the translated English post corpus, so its single collection card links to `/en/posts/demian/` while Chinese Shelf content and URLs remain unchanged.
- Browser-verified `/shelf/` and `/en/shelf/`, including locale-correct language-switch targets, current-reading titles, collection labels, category/subcategory filtering, paper-note links, desktop layout, and clean browser/server consoles.
- Extracted Privacy into `LocalizedPrivacyPage.astro`, added `/en/privacy/`, and translated the complete GA4 disclosure while preserving its scope, caveats, opt-out guidance, and Google policy destination.
- Browser-verified `/privacy/` and `/en/privacy/`: Markdown headings/body, page title, `<html lang>`, Footer self-link, language-switch target, and hardened external policy link are locale-correct with no console/server errors.
- Extracted Next/Todo into `LocalizedTodoPage.astro`, added `/en/todo/`, and passed locale into the runes-based `TodoView.svelte` without changing the single GitHub snapshot schema or fetch path.
- Added `todo-locale.ts` and tests for bilingual workspace terminology, priority descriptions, pluralized counts, state/date/action labels, and Asia/Shanghai date rendering. Dynamic Issue fields remain untouched and searchable in their source language.
- Browser-verified the Chinese and English empty snapshot across desktop and mobile: view/priority/search interactions, ARIA labels, page/chrome locale, equivalent switch targets, and no horizontal overflow or console/server errors.

### C3 — localized post details and relationships

- Extracted the 300+ line post detail template into `LocalizedPostPage.astro`; Chinese and English routes now share one presenter.
- Added `/en/posts/<translationKey>/` generation from English entries only. With one English fixture, the build emits `/en/posts/demian/` and no `.en`-suffixed or unprefixed English route.
- Scoped TF-IDF related posts and Wiki graph construction to the active locale, and changed graph node/series/related/previous-next links to stable route slugs.
- Threaded locale through post metadata, license labels, Giscus language, and mini-graph URLs/text. English category, series, related, and neighbor links stay under `/en/`.
- Made Markdown WikiLink resolution locale-scoped and translation-key aware so same-title translations cannot overwrite each other in the build-time title map.
- Added and reviewed the first complete translation, `demian.en.md`, preserving the author-selected first body image and pairing it with `translationKey: demian`.
- Focused tests remain 18/18; production build now emits 97 pages and Pagefind discovers separate `zh-cn` and `en` indexes.
- Browser-verified `/en/` and `/en/posts/demian/` at desktop/mobile sizes: English post card and internal post links use `/en/`, the switch returns to `/posts/demian/`, JSON-LD uses `inLanguage: en`, and no console/server errors occur.
- Fixed stale cross-locale chrome caused by Swup retaining the Navbar outside its replacement containers. Language links now opt out of Swup for a full locale render and recalculate their equivalent route after every in-locale Swup visit; verified `/` ↔ `/en/`, `/archive/` ↔ `/en/archive/`, and `/posts/demian/` ↔ `/en/posts/demian/`.

## Verification log

| Check                         | Result  | Notes                                                                                                                                                |
| ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Published source inventory    | PASS    | 66 files, 66 published, 0 drafts, 0 nested files                                                                                                     |
| Existing user files preserved | PASS    | Four pre-existing untracked root files remain untouched after branch creation                                                                        |
| Locale/content unit tests     | PASS    | Six focused files, 25/25 tests after adding Todo workspace copy, pluralization, priority, and date localization coverage                             |
| Todo data pipeline tests      | PASS    | Existing GitHub Issue filtering, sorting, sanitization, and snapshot validation remain 13/13 with one locale-neutral `/todo.json`                    |
| Production build              | PASS    | Astro completed with 102 pages, including both Todo locale routes; Pagefind indexed 73 pages across `zh-cn` and `en`                                 |
| Chinese homepage browser      | PASS    | Switch rendered beside theme; `html lang=zh-CN`, carrier `zh-CN`, current `简中`, English target `/en/`, no console error                            |
| English homepage browser      | PASS    | `html lang=en`, localized chrome, one English-only post card at `/en/posts/demian/`, and no Chinese corpus leak or console error                     |
| English post browser          | PASS    | `/en/posts/demian/` renders localized metadata/license/series/graph/comments; all scoped internal links retain `/en/`                                |
| Bilingual About browser       | PASS    | `/about/` and `/en/about/` use locale-correct copy, photo labels, Friends links, and equivalent language routes at desktop/mobile                    |
| About photo interactions      | PASS    | Prev/next/dots update captions and labels; overflow popover preserves card height; full-photo lightbox carries localized alt/caption                 |
| Bilingual Friends browser     | PASS    | `/friends/` and `/en/friends/` render locale-specific instructions/descriptions/labels with stable external data and mobile layout                   |
| Bilingual Shelf browser       | PASS    | `/shelf/` keeps all 42 Chinese works; `/en/shelf/` exposes the translated English corpus only, with localized controls and equivalent switch targets |
| Shelf interactions            | PASS    | Category/subcategory filters, paper-note links, current-reading metadata, and desktop layout work with no browser/server console errors              |
| Bilingual Privacy browser     | PASS    | `/privacy/` and `/en/privacy/` render locale-correct Markdown/lang/Footer/switch targets and the external Google policy link is hardened correctly   |
| Bilingual Todo browser        | PASS    | `/todo/` and `/en/todo/` localize workspace chrome/ARIA/dates/states while sharing source-language Issue content and one `/todo.json`                |
| Todo interactions/layout      | PASS    | Empty snapshot view, completed/P0/search states, desktop/mobile layouts, and equivalent language targets work without overflow or console errors     |
| Statistics pipeline tests     | PASS    | 12/12 for locale path classification/filters, category labels, translation-pair isolation, fallback identity, totals, and empty/live snapshots       |
| Statistics/Graph locale tests | PASS    | 5/5 for endpoint paths, formatting, pluralization, graph labels, and locale-specific category legends                                                |
| Bilingual Statistics browser  | PASS    | Locale UI/ARIA/data/links/Graph are isolated; English has no Chinese copy, mobile has no overflow, and console/server logs are clean                 |
| Locale-isolated Pagefind      | PASS    | English finds `Demian` but not `德米安`; Chinese finds a Chinese-only title and returns unprefixed post URLs                                         |
| `astro check`                 | BLOCKED | Existing Astro 7.2 / TypeScript 7 incompatibility; Astro checker requires TypeScript 6.x                                                             |
| `tsc --isolatedDeclarations`  | BLOCKED | Existing repo-wide TS7/baseUrl/declaration baseline errors, including many untouched files                                                           |
| Vite+ whole-repo format check | BLOCKED | 38 pre-existing format findings include untouched source/docs and a user-owned untracked Markdown file                                               |

## Translation ledger

States advance independently: **draft** means an English file exists, **review** means prose/structure was reviewed, **verified** means automated corpus/build checks passed.

| Chinese source slug                           | English file                                        | Draft    | Review   | Verified |
| --------------------------------------------- | --------------------------------------------------- | -------- | -------- | -------- |
| `a-maverick-pig`                              | `a-maverick-pig.en.md`                              | complete | complete | complete |
| `agent-framework-exploration`                 | `agent-framework-exploration.en.md`                 | complete | complete | complete |
| `attention-is-limited`                        | `attention-is-limited.en.md`                        | complete | complete | complete |
| `blog-rebuild-inspirations`                   | `blog-rebuild-inspirations.en.md`                   | complete | pending  | pending  |
| `changan-de-lizhi`                            | `changan-de-lizhi.en.md`                            | complete | complete | complete |
| `changge-xing`                                | `changge-xing.en.md`                                | complete | complete | complete |
| `chongfu-zhi-le`                              | `chongfu-zhi-le.en.md`                              | complete | complete | complete |
| `chunjiao-yu-zhiming`                         | `chunjiao-yu-zhiming.en.md`                         | complete | complete | complete |
| `claude-desktop-bridging-problem`             | `claude-desktop-bridging-problem.en.md`             | complete | complete | pending  |
| `cloud-service-provider`                      | `cloud-service-provider.en.md`                      | complete | complete | complete |
| `cong-yin-ai-chat`                            | `cong-yin-ai-chat.en.md`                            | complete | complete | pending  |
| `cunzai-zhijin`                               | `cunzai-zhijin.en.md`                               | complete | complete | complete |
| `cunzai-zhuyi`                                | `cunzai-zhuyi.en.md`                                | complete | complete | complete |
| `daneimitan-00fa`                             | `daneimitan-00fa.en.md`                             | complete | complete | pending  |
| `dasheng-quqin`                               | `dasheng-quqin.en.md`                               | complete | complete | complete |
| `demian`                                      | `demian.en.md`                                      | complete | complete | complete |
| `fengxin-lou`                                 | `fengxin-lou.en.md`                                 | complete | complete | complete |
| `frieren-ocd`                                 | `frieren-ocd.en.md`                                 | complete | complete | pending  |
| `fuwari-guide`                                | `fuwari-guide.en.md`                                | complete | complete | complete |
| `github-stacked-prs`                          | `github-stacked-prs.en.md`                          | complete | complete | pending  |
| `gotcha-agent-rules`                          | `gotcha-agent-rules.en.md`                          | complete | complete | pending  |
| `heguang-tongchen`                            | `heguang-tongchen.en.md`                            | complete | complete | complete |
| `huajianghu-tiangang`                         | `huajianghu-tiangang.en.md`                         | complete | complete | pending  |
| `imouto-jinsei`                               | `imouto-jinsei.en.md`                               | complete | complete | pending  |
| `long-term-memory-graduation-review-and-plan` | `long-term-memory-graduation-review-and-plan.en.md` | complete | complete | complete |
| `luoshengmen`                                 | `luoshengmen.en.md`                                 | complete | complete | pending  |
| `meiyou-mingtian`                             | `meiyou-mingtian.en.md`                             | complete | complete | complete |
| `memu-adr0007-ce-duan-perspective`            | `memu-adr0007-ce-duan-perspective.en.md`            | complete | complete | complete |
| `memu-source-code-breakdown`                  | `memu-source-code-breakdown.en.md`                  | complete | complete | complete |
| `moechat_ltm`                                 | `moechat_ltm.en.md`                                 | complete | complete | complete |
| `multi-image-vlm`                             | `multi-image-vlm.en.md`                             | complete | complete | complete |
| `my-book-finding-channels`                    | `my-book-finding-channels.en.md`                    | complete | complete | complete |
| `nekopara-vol-1`                              | `nekopara-vol-1.en.md`                              | complete | complete | complete |
| `nilin`                                       | `nilin.en.md`                                       | complete | complete | complete |
| `obs-vtube-studio-vtuber-guide`               | `obs-vtube-studio-vtuber-guide.en.md`               | complete | complete | complete |
| `obsidian-yolo`                               | `obsidian-yolo.en.md`                               | complete | complete | complete |
| `panduola`                                    | `panduola.en.md`                                    | complete | complete | complete |
| `progressive-disclosure-and-novel-agent`      | `progressive-disclosure-and-novel-agent.en.md`      | complete | complete | complete |
| `qingchun-tongrenzhi`                         | `qingchun-tongrenzhi.en.md`                         | complete | complete | complete |
| `rag-blog-graph`                              | `rag-blog-graph.en.md`                              | complete | complete | complete |
| `resposne-vs-chat_completion`                 | `resposne-vs-chat_completion.en.md`                 | complete | complete | complete |
| `RRF-vs-Hybrid-Search`                        | `RRF-vs-Hybrid-Search.en.md`                        | complete | complete | complete |
| `ruhuashuban-de-lianai`                       | `ruhuashuban-de-lianai.en.md`                       | complete | complete | complete |
| `sahara-stories`                              | `sahara-stories.en.md`                              | complete | complete | complete |
| `shaonian-babilun`                            | `shaonian-babilun.en.md`                            | complete | complete | complete |
| `shijie-jintou-de-nvyou`                      | `shijie-jintou-de-nvyou.en.md`                      | complete | complete | complete |
| `shishen`                                     | `shishen.en.md`                                     | complete | complete | complete |
| `snow-rabbit-shawshank`                       | `snow-rabbit-shawshank.en.md`                       | complete | complete | complete |
| `sparsing-and-densing-embeddings`             | `sparsing-and-densing-embeddings.en.md`             | complete | complete | complete |
| `talking-about-running`                       | `talking-about-running.en.md`                       | complete | complete | complete |
| `tangdao-zhi-lian`                            | `tangdao-zhi-lian.en.md`                            | complete | complete | complete |
| `termix-web-ssh-guide`                        | `termix-web-ssh-guide.en.md`                        | complete | complete | complete |
| `tf-idf-and-bm25`                             | `tf-idf-and-bm25.en.md`                             | complete | complete | complete |
| `travellin-cats-in-germany`                   | `travellin-cats-in-germany.en.md`                   | complete | complete | complete |
| `vampires-melody`                             | `vampires-melody.en.md`                             | complete | complete | complete |
| `weijin-zhi-hua`                              | `weijin-zhi-hua.en.md`                              | complete | complete | complete |
| `what-is-my-ability-in-llm-era`               | `what-is-my-ability-in-llm-era.en.md`               | complete | complete | complete |
| `wo-neng-you-shenme-huai-xinsi-ne`            | `wo-neng-you-shenme-huai-xinsi-ne.en.md`            | complete | complete | complete |
| `wo-yigerenlai`                               | `wo-yigerenlai.en.md`                               | complete | complete | complete |
| `xianni-huafan`                               | `xianni-huafan.en.md`                               | complete | complete | complete |
| `yi-nian-yiwan-yuan`                          | `yi-nian-yiwan-yuan.en.md`                          | complete | complete | complete |
| `you-are-my-glory`                            | `you-are-my-glory.en.md`                            | complete | complete | complete |
| `yueguang-baohe`                              | `yueguang-baohe.en.md`                              | complete | complete | complete |
| `yumei-cao`                                   | `yumei-cao.en.md`                                   | complete | complete | complete |
| `zouzoutingting`                              | `zouzoutingting.en.md`                              | complete | complete | complete |
| `zuihou-qixian`                               | `zuihou-qixian.en.md`                               | complete | complete | complete |

## Blockers and accepted exceptions

- Validation baseline: `astro check` is currently impossible with installed TypeScript 7.0.2; the repo pins `typescript: ^7.0.0` while Astro's language server requests 6.x. Do not change dependencies as part of C1 unless build/test evidence becomes insufficient.
- Validation baseline: Vite+ whole-repo formatting and `tsc --isolatedDeclarations` have broad pre-existing failures. Scope formatter runs to changed files and rely on focused tests + production build until the dedicated cleanup decision.

## Resume here

Next, run the full C6 end-to-end verification checklist, resolving the preview-server and focused-test environment blockers before preparing the review/PR.
