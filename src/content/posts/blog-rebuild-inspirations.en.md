---
title: 'Rebuilding My Blog: Where My Inspirations Came From'
published: 2026-06-07
updated: 2026-08-23
category: Learning as I Build
tags:
  - Blogging
  - Open Source
description: Tracing the inspirations behind each page and module throughout the blog's rebuild and continuing evolution.
pin: true
series:
  - Blogging
lang: en
translationKey: blog-rebuild-inspirations
---

> [!NOTE]
> **AI-generated content disclosure:** This article was organized and is continually updated by [Korewaxnne](https://github.com/xnne-bot), an AI assistant powered by Claude. Xnne provided the source material, inspirations, and backstories behind each part of the blog's rebuild; I shaped them into a complete article.

In [[When My Cloud Provider Disappeared: Rethinking the Shape of a Personal Blog and What Is Worth Recording]], Xnne discussed why they ultimately chose a static blog. This article is its companion, documenting the inspirations behind each part of the rebuild and the blog's continuing evolution afterward.

The reason for writing it is simple: Xnne drew a great deal of inspiration from other people's blogs, applications, and games. Connecting those threads is both a way to give credit and a way to help anyone attempting something similar avoid unnecessary detours.

This is not a list frozen at the moment the rebuild ended. The blog is still growing: new pages will appear, and features that were once scattered will be recombined. This article will therefore continue to evolve alongside the blog.

# The Core Framework

::github{repo="SigureMo/nyakku.moe"}

The blog's underlying framework was forked directly from [nyakku.moe](https://nyakku.moe/), which combines Astro, Svelte, and Tailwind. The reasons for choosing it were covered in the other article: static generation, native Markdown support, simple deployment, and completely local data.

nyakku.moe itself can be traced back to Fuwari:

::github{repo="saicaca/fuwari"}

Fuwari provides an Astro blog theme that works out of the box, and nyakku.moe made extensive personal customizations on top of it. Xnne then continued building their own ideas on top of nyakku.moe. The three layers look roughly like this:

> Fuwari → nyakku.moe → this site

# Rethinking Content Organization

The rebuild was not just a switch to a different framework. More importantly, it was an opportunity to rethink how the content itself should be organized.

Previously, Xnne used categories as though they were series, which left the categories extremely disordered. The rule now is: **Each post has exactly one category, but may belong to multiple series.**

## Categories

A category describes the nature of a post, answering, “What kind of content is this?”

- **Resources** — Straightforward recommendations of sources, applications, or information, such as websites for finding books and manga.
- **Reviews** — A display case for memories and a magnet for kindred spirits: things written after finishing a book or series.
- **Tutorials** — Process-oriented records, such as a guide to using an application or configuring a piece of software.
- **Reflections** — Deeper thoughts prompted by an event or an object, along with the actions those thoughts set in motion. They may not be correct, but they help Xnne arrive at a coherent view.
- **Learning as I Build** — Meandering explorations with little nutritional value. If readers cannot find a suitable tutorial or example elsewhere, perhaps they can still find what they need among Xnne's experiments.

## Series

A series describes a post's subject, answering, “What is this post about?” Examples include LLMs, blogging, reading, and film. A post discussing the construction of a graph for a blog might be categorized under Reflections while belonging to both the LLM and Blogging series.

This division grew out of reflecting on the old, chaotic organization. Categories became focused, series became flexible, and the two became orthogonal.

# The Homepage and Reading Experience

## Homepage Banner

![The latest version of the blog homepage](../../assets/img/blog-rebuild-inspirations/homepage-latest.jpg)

The homepage hero fills the viewport while the actual content begins farther down. A transparent wave bridges the background image and the content area. The top navigation blends into the hero and becomes visible only after scrolling. Except while reading a post, the navigation always follows the viewport.

Inspiration: [NBlog](https://naccl.top/)

::github{repo="Naccl/NBlog"}

NBlog was also the first blogging system Xnne deployed during the cloud-server era. Its opening screen has a strong visual impact, and the wave transition keeps the hero and content from feeling disconnected. Xnne brought that design language into the current static site, then gradually replaced it with colors, navigation, and content entry points that felt more personal.

## Hiding the Navigation While Reading

![The navigation bar hidden while reading](../../assets/img/blog-rebuild-inspirations/blog-rebuild-navbar-hidden.jpg)

While a post is being read, the top navigation disappears and leaves the visual space entirely to the content. This detail came from:

[Innei's Blog](https://innei.in/)

Navigation is a distraction in a reading context. Hiding it makes the experience more immersive. Simple, but effective.

## Image Comparison Workbench

Video platforms transcode uploads, while GIFs sacrifice either image quality or file size. For image upscaling, where the point is to inspect differences at exactly the same position, the most direct approach is to stack the original and the result and let readers move the divider themselves.

The blog therefore gained an image comparison workbench for Markdown. It shows the result by default; the button in the lower-right corner opens a comparison that can be controlled with a mouse, touch, or arrow keys. A comparison may also play one automatic sweep when it enters the viewport, then remain draggable.

:::compare{before="Original · 1099×818" after="SeedVR2 · 1648×1224" label="SeedVR2 image upscaling comparison" autoplay}
![Original image before SeedVR2 upscaling](../../assets/img/blog-rebuild-inspirations/image-compare-original.jpg)

![SeedVR2 image upscaling result](../../assets/img/blog-rebuild-inspirations/image-compare-seedvr2.jpg)
:::

The workbench later appeared in [[What Does It Mean When Someone Looks Like a Yandere?]]. Moving back and forth over the same position makes it easier to see how SeedVR2 handles faces, clothing textures, and atmospheric softness, without losing those details to GIF compression or video transcoding.

# The Bookshelf: What I Am Reading and What Has Stayed with Me

![The bookshelf after Continue Reading was added](../../assets/img/blog-rebuild-inspirations/bookshelf-current-reading.jpg)

The [Bookshelf](/en/shelf/) presents books, manga, games, films, television series, anime, and papers that Xnne has experienced, with the complete collection displayed as either a cover wall or a list.

The original inspiration was [Lapis' Bookshelf](https://www.lapis.cafe/bookshelf/):

::github{repo="Lapis0x0/VermilionVoid"}

Xnne loved this way of visualizing reading and viewing history. Compared with a plain list, a cover wall feels more like a display case being slowly expanded. Categories, subcategories, and reading notes make it possible to rediscover the works that have remained.

Later, a “Continue Reading” section was added to the top of the Bookshelf. It is not another collection list, but **a place reserved for books still in progress, and a reminder to keep reading them**. A book does not have to disappear from the site simply because it has not yet been finished and its reflections have not yet become a post. Reading progress and quick notes can show that the relationship is already unfolding.

The Bookshelf now holds two kinds of time at once: unfinished reading above and the works that have remained below.

# Statistics and Graphs: Seeing a Blog Through Its Numbers

The formerly separate statistics page and relationship graph were eventually combined into a single [Statistics entry point](/en/statistics/). One view observes how content is published and then read; the other observes how posts cite one another. Both are concerned with the same question: how did this blog gradually grow into what it is today?

## Publishing Trails and Reading Echoes

![The publishing trail on the Statistics page](../../assets/img/blog-rebuild-inspirations/statistics-publishing.jpg)

The inspiration for publishing statistics came from [this cute world](https://thiscute.world/statistics/): take numbers that would normally be visible only in an administrator dashboard and organize them into a public page, allowing readers to see how the blog is read and how its content has accumulated over time.

This site divides its statistics into two threads. The first is the “publishing trail”: a publication calendar records the dates on which works appeared, while a time slice presents publication pulse, category evolution, and series lifelines side by side. It records when posts were published without pretending to know when the actual writing happened each day.

The second is the “reading echo”: visitors, page views, engagement time, and post rankings describe what happens once the writing leaves the desk and is read. Visitors' browsers send page-view and engagement events to GA4. GitHub Actions periodically calls the GA4 Data API, then combines those aggregate results with word counts, estimated reading times, and publication dates calculated during the Astro build to produce static data for the page.

This approach requires neither a persistent backend for GitHub Pages nor a self-hosted database. Service-account credentials exist only in GitHub Actions Secrets, and the public page displays only post-level aggregate data. The average reading-time ranking also requires a minimum sample size so that a handful of visits cannot distort the results.

## Relationship Graph

![The relationship graph integrated into the Statistics page](../../assets/img/blog-rebuild-inspirations/statistics-graph.jpg)

The relationship graph was inspired by [Nagi's Blog](https://blog.nagi.fun/sao-blog?lang=zh). The blog is not open source, but its author explained the relevant implementation ideas in detail in an article.

Combining those ideas with their reflections in [[After Building Long-Lived Systems: Is the RAG Monster Right for Constructing a Personal Blog Graph?]], Xnne ultimately chose not to rely on RAG or embeddings. Instead, the graph is built from bidirectional wiki-link relationships. Open a post and you can see what it cites and what cites it; zoom back out and you can see how different categories are distributed and connected throughout the blog.

After the graph was integrated into the Statistics page, the “publishing trail” and the “citation threads” became two perspectives under a single entry point: one looks back through time, while the other wanders through relationships. Statistics are no longer merely a row of numbers, and the graph is no longer an isolated page.

# About: Letting the Bookshelf Introduce Me

![The About page centered on photographs of bookshelves](../../assets/img/blog-rebuild-inspirations/about-reading-portrait.jpg)

The [About page](/en/about/) originally relied mainly on written self-description. Later, Xnne realized that adding more personality labels and experiences did not make “who I am” any more concrete. Instead, it increasingly resembled a fully completed form with no warmth.

The page was therefore remade as a “reading portrait.” It first places real bookshelves in front of the reader, using a set of photographs that can be browsed and enlarged, each accompanied by a short caption, as the introduction. Chang Ge, light novels, Makoto Shinkai, Keigo Higashino, Haruki Murakami, Yasunari Kawabata, Yukio Mishima, Hermann Hesse, Somerset Maugham... The arrangement left behind by all that reading comes closer to the self Xnne wants to introduce than a string of abstract labels ever could.

> If a person can truly be recognized through the books they have read, then perhaps these photographs come closer to me than a self-introduction does.

The writing was not removed entirely; it simply receded behind the photographs. The page then uses three cards—“Recording,” “Organizing Fragments,” and “Music”—to summarize its driving forces, before ending with a more concrete self-description. It changed from “read a passage about me” to “first see what I have left behind, then decide how to know me.”

# Comments

::github{repo="MrXnneHang/xnnehang.top"}

The comment section uses [giscus](https://giscus.app/), which is built on GitHub Discussions. Readers can comment with a GitHub account, and all data remains in the repository's Discussions without requiring a backend.

Inspiration: [Menghuan1918's Blog](https://blog.menghuan1918.com/)

After seeing the approach on that blog, Xnne thought it was a good fit: lightweight, free, and particularly suitable for a technical blog because every comment is managed as a Discussion. Xnne later adopted it and created a custom theme to match the blog's blue palette.

# A Custom 404 Page

GitHub Pages' default 404 page contains only `File not found`, with neither this site's navigation nor a way back. As soon as visitors reach an address that does not exist, they are abruptly thrown out of the blog's visual world.

This site therefore added a custom 404 page. It uses “This part of the knowledge planet is still a desert” to represent coordinates that have not yet been recorded, retains the navigation bar, theme switcher, and footer, and provides two exits: “Back to Home” and “View Archive.” The page continues to use the main site's theme colors and also adapts to mobile screens and dark mode.

During the Astro build, a `404.html` file is generated at the root. When GitHub Pages cannot find the requested static file, it returns this page while preserving the correct HTTP 404 status. Even when visitors take a wrong turn, they therefore remain on the same knowledge planet.

![The custom 404 page](<../../assets/img/blog-rebuild-inspirations/Pasted image 20260804223135.png>)

# The In-Progress Workbench: Turning Todos into Alchemy

![The In-Progress Workbench using alchemy as its metaphor](../../assets/img/blog-rebuild-inspirations/todo-alchemy.jpg)

The [In-Progress Workbench](/en/todo/) is a public, read-only view of GitHub Issues. GitHub handles creation, editing, permissions, and history, while the blog handles presentation, search, priorities, and browsing by label. Ideas in progress do not have to wait until they become posts or projects before they can be seen.

Its task-management foundation was inspired by [TickTick](https://ticktick.com/), but Xnne did not want to build yet another ordinary Todo List. The alchemy experiences of [Potionomics](https://www.potionomics.com/) and [The Elder Scrolls V: Skyrim](https://elderscrolls.bethesda.net/en/skyrim) were therefore folded into the workflow as well: scattered ingredients are gathered, sorted, and placed into the cauldron, eventually becoming something new.

The site does not reproduce any of those systems wholesale. Instead, it recombines the three inspirations. Items still in progress enter the “Crucible,” organized by priorities from P0 through P3 and by ordinary labels. Closed Issues become “Crystals,” preserving traces of what has been completed. A line on the workbench captures the metaphor:

> Mix and refine scattered ideas.

For Xnne, showing work in progress does more than reveal “what comes next.” It also gives fleeting ideas a container before they disappear. A Todo is no longer merely a line waiting to be crossed out, but material still being refined.

# A Bilingual Site: Making Another Language Part of the Structure

When Xnne first considered adding English to the blog, the task was not simply to “translate the posts.” If English existed only in the article body while navigation, search, archives, statistics, the relationship graph, and RSS still understood only Chinese, the result would have been a scattered collection of translations rather than an English site that could be read on its own.

The redesign therefore preserves every existing Chinese URL while placing the English site under `/en/`, with language changes left to the reader. Pages do not force a redirect based on browser language, and the Chinese and English versions of each post are paired through a stable `translationKey`. Old links remain intact, while both languages receive clear and predictable addresses.

The harder part was carrying language through the entire network of content. The homepage, navigation, archives, series, Bookshelf, In-Progress Workbench, Statistics, relationship graph, search, 404 page, RSS, and SEO all gained English counterparts. WikiLinks, related posts, previous and next navigation, categories, and series are resolved only within the current language. Chinese and English also receive separate search indexes, RSS feeds, statistics catalogs, and graph data, so switching to English does not lead the reader unexpectedly back into Chinese somewhere farther along the path.

At the same time, all 66 published posts were migrated into complete English counterparts. The migration did not treat them as isolated pieces of text: groups connected by WikiLinks had to move together, or translated links would point toward titles that did not yet exist. Each post first went through translation-pair and file checks, while full production builds were reserved for batch checkpoints. This order kept a large migration divisible, inspectable, and traceable.

The purpose of making the whole site bilingual was not to pretend that the blog no longer has a linguistic boundary. It was more like laying a second complete path through it. Chinese remains the place where the blog first grew, while English is no longer an attachment beside the body text; it has its own entrances, navigation, and content network. **Bilingualism thus changed from a translation task into part of the blog's structure itself.**

---

Those are the main threads of inspiration running through this blog today. Thank you to the creators of these projects, blogs, applications, and games for leaving their practices and imaginations behind, giving those who followed a trail to trace.

The blog will probably continue to change. The next time a new page grows, this list will gain another tributary.
