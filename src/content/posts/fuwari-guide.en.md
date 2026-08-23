---
title: Fuwari Blog Theme Guide
published: 2024-07-01
category: technology
kind: tutorial
tags:
  - Fuwari
  - Blogging
description: 'A guide to the Fuwari-based blog: frontmatter, Markdown, GitHub cards, admonitions, code highlighting, and video embeds.'
series:
  - Blogging
lang: en
translationKey: fuwari-guide
---

This blog is built with the **Fuwari** theme and Astro. For anything not covered here, see the [official Astro documentation](https://docs.astro.build/).

## Post Frontmatter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
---
```

| Field         | Description                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | Post title                                                                                                                                                     |
| `published`   | Publication date                                                                                                                                               |
| `description` | Post summary, shown on the homepage                                                                                                                            |
| `image`       | Cover image path. Starts with `http://` or `https://`: use a remote image; starts with `/`: use an image in `public`; otherwise: relative to the Markdown file |
| `tags`        | Post tags                                                                                                                                                      |
| `category`    | Post category                                                                                                                                                  |
| `draft`       | Whether the post is a draft. Drafts do not appear in the production build.                                                                                     |

## Where to Place Post Files

Post files belong in `src/content/posts/`. You can also create subdirectories to organize posts and assets more clearly:

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```

## Markdown Examples

### Tables

| Size | Material | Color       |
| ---- | -------- | ----------- |
| 9    | Leather  | Brown       |
| 10   | Linen    | Natural     |
| 11   | Glass    | Transparent |

```
| Size | Material | Color |
|---|---|---|
| 9 | Leather | Brown |
| 10 | Linen | Natural |
| 11 | Glass | Transparent |
```

### Horizontal Rules

---

```
---
```

### Inline Math

Inline math: $\omega = d\phi / dt$

```
Inline math: $\omega = d\phi / dt$
```

### Display Math

$$
I = \int \rho R^{2} dV
$$

```
$$
I = \int \rho R^{2} dV
$$
```

## GitHub Repository Cards

You can add dynamic cards that link to GitHub repositories. Repository information is fetched from the GitHub API when the page loads.

::github{repo="saicaca/fuwari"}

Use `::github{repo="<owner>/<repo>"}` to create a GitHub repository card.

```
::github{repo="saicaca/fuwari"}
```

## Admonitions

The following admonition types are supported: `note`, `tip`, `important`, `warning`, and `caution`.

:::note
Highlights information that users should take into account, even when skimming.
:::

:::tip
Optional information to help a user be more successful.
:::

:::important
Crucial information necessary for users to succeed.
:::

:::warning
Critical content demanding immediate user attention due to potential risks.
:::

:::caution
Negative potential consequences of an action.
:::

### Basic Syntax

```
:::note
Highlights information that users should take into account, even when skimming.
:::
:::tip
Optional information to help a user be more successful.
:::
```

### Custom Titles

You can give an admonition a custom title.

:::note[My Custom Title]
This is a note with a custom title.
:::

```
:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::
```

### GitHub Syntax

> [!TIP]
> GitHub syntax is also supported.

```
> [!NOTE]
> GitHub syntax is also supported.

> [!TIP]
> GitHub syntax is also supported.
```

## Expressive Code

Expressive Code provides syntax highlighting, terminal frames, line markers, diff comparisons, word wrapping, collapsible code, line numbers, and more. See the [official Expressive Code documentation](https://expressive-code.com/) for complete usage.

## Embed Videos in Posts

Copy the embed code from YouTube or another platform and paste it directly into a Markdown file.

```
---
title: Include Video in the Post
published: 2023-10-19
// ...
---
<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
```

### YouTube

<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allowfullscreen></iframe>

### Bilibili

<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1yRdBBsEGZ&page=1" frameborder="0" allowfullscreen></iframe>
