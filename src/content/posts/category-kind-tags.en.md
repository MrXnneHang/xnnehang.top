---
title: Can an Article Belong in Only One Drawer? Rethinking Category, Kind, and Tags
published: 2026-08-23
description: When technology, reviews, and reflection keep converging in the same post, I have to reconsider what a blog category is actually supposed to answer.
category: Reflections
tags:
  - Blogging
  - Writing
  - Content Taxonomy
series:
  - Blogging
draft: false
lang: en
translationKey: category-kind-tags
---

![Hatsune Miku walking past a street corner with a guitar](../../assets/img/category-kind-tags/miku823.jpg)

> [!NOTE]
> **AI collaboration note:** This article grew out of my confusion about the blog's existing categories. I provided the questions, examples, and original classification logic; Korewaxnne, my AI assistant powered by Claude, helped inventory the current system, separate the concepts, and organize them into an article. We arrived at the final structure through discussion.

After finishing [[What Does It Mean When Someone Looks Like a Yandere?]], I gave it a new Category: **Random Thoughts**.

The article begins with a yandere character from an AI-generated manhua drama who looked exactly right to me, but then spends much of its length showing the results of upscaling images with SeedVR2. I neither analyzed the series in earnest nor turned the upscaling process into a reproducible tutorial. By the end, I even admitted that I could not really explain what it meant to “look like a yandere.”

Calling it a Review did not feel quite right. Calling it a Tutorial would imply steps that were not there. Calling it a Reflection seemed to promise a conclusion more complete than the one I had reached. So I improvised a new drawer called “Random Thoughts.”

The post found a home. The taxonomy became even messier.

# Articles Are Not That Pure

This was not the first time I had run into the problem.

[[Using OBS with VTube Studio: Be a Vtuber]] has Vtuber in its title, yet the article itself is plainly a software configuration tutorial. [[Starting from a NEKOPARA Review]] begins with a Steam review and eventually turns toward life, change, and meaning. [[When My Cloud Provider Disappeared: Rethinking the Shape of a Personal Blog and What Is Worth Recording]] begins with a vanished server and lost archives, then arrives at the question of what deserves to be recorded at all.

Some articles are half technical practice and half a question directed at myself. [[In the LLM Era, What Exactly Is My Ability?]] is one example: AI coding provides the background, but the real question is what I can still call my own ability after losing much of my capacity to code unaided.

If categories are based only on what an article mentions, these posts could belong simultaneously to technology, books and screen culture, games, and philosophy. If I force each one into a single category, some important part of it always seems to disappear.

But perhaps the problem is not that the articles are “impure.” A personal blog is not a standardized library catalog. An experience can lead to a technical experiment, and a technical experiment can turn back toward an understanding of oneself. The real problem is that I have been asking one `category` field to answer several different questions.

# One Field Doing Three Jobs

The blog currently uses five main categories:

- Resources
- Reviews
- Tutorials
- Reflections
- Learning as I Build

They all look like categories, but they do not live on the same conceptual level.

Tutorials and Reviews are closer to forms: they describe how a reader will encounter the article. Resources describes what the article provides. Learning as I Build describes the writing process. Reflections describes the depth the article tries to reach. At the same time, I also expect Category to tell readers whether a post is about technology, a work of culture, everyday life, or philosophy.

In other words, one field has coupled together three questions:

1. **What is the article mainly about?**
2. **How is the article written?**
3. **Which specific objects and concepts does it involve?**

When all three answers happen to align, the old structure appears to work perfectly. An OBS setup guide is a Tutorial; a response to a film is a Review. Nothing seems wrong.

The answers begin to diverge when an article starts from a game and moves toward the meaning of life, or when affection for a fictional character leads to an experiment in image upscaling. Adding categories such as Random Thoughts only creates a new drawer for every possible mixture.

# The Taxonomy from the Cloud Provider Article Still Matters

In [[When My Cloud Provider Disappeared: Rethinking the Shape of a Personal Blog and What Is Worth Recording]], I divided the things worth recording into Resources, Reviews, Tutorials, Reflections, and Learning as I Build.

That distinction still matters to me.

It was not trying to describe which subjects exist in the world. It was asking why I write things down. Resources can help someone else. Reviews can become both a cabinet of memories and a lure for kindred spirits. Tutorials preserve reproducible procedures. Reflections let me arrive at a provisionally coherent conclusion. Learning as I Build preserves the process of exploring, testing, and correcting an idea.

That is precisely where the old taxonomy remains valuable. It allows an article to deserve a place before it has become a definitive answer. It also avoids the trap of refusing to record anything merely because an early understanding may be naive or wrong.

The new structure should therefore not replace that logic. It should return it to a more suitable role: describing an article's **form and promise to the reader**, rather than its thematic home.

# Separating the Three Questions Again

The structure I now have in mind consists of `category`, `kind`, and `tags`. They are not three parallel sets of labels, but three axes with different responsibilities.

## Category: Where the Article Ultimately Arrives

`category` answers one question: **Which collection does this article primarily belong to?**

Every article has exactly one Category. Internally, it uses a stable key that does not change with display copy; the interface can then present a name that better suits the character of the blog.

The idea of giving categories literary collection names such as 格物集 and 岁时集 was inspired by [Soulter's blog](https://blog.soulter.top/). What I am borrowing is the idea of turning ordinary sections into personal collections. The actual names and boundaries here are still derived from the articles on this site.

| Internal value | Chinese display name | Scope                                                                               |
| -------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `technology`   | 格物集               | Technology, tools, engineering practice, and explorations of principles             |
| `culture`      | 游艺集               | Books, films, television, animation, comics, and games                              |
| `thought`      | 行思集               | Philosophy, self-examination, social observation, and questions about life          |
| `life`         | 岁时集               | Personal experiences, travel, periodic retrospectives, and records of everyday life |

A Category should be chosen not by what triggered the article, but by **where the article ultimately arrives**.

A reflection on life prompted by a game still belongs to the collection of thought. A software setup guide framed around Vtubing still belongs to the technology collection. A philosophical passage written during a journey may still belong to the life collection if preserving that journey remains its central purpose.

Category gives the reader one main entrance. It does not need to exhaust everything an article means.

## Kind: How the Article Is Written

`kind` answers: **What form of writing is the reader about to encounter?**

| Internal value  | Display name  | Promise to the reader                                                                             |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `tutorial`      | Tutorial      | Provides a sequence of steps that can be repeated                                                 |
| `review`        | Review        | Records an experience, evaluation, and response centered on a particular work                     |
| `reflection`    | Reflection    | Begins with something concrete and develops a reasonably complete thought or conclusion           |
| `learning-note` | Learning Note | Preserves the process of exploration, testing, and correction                                     |
| `resource`      | Resource      | Provides channels, tools, or a collection of useful materials                                     |
| `note`          | Note          | Preserves a fragment, discovery, demonstration, or experience that has not been developed further |

Note is the addition here. It creates room for things worth preserving without requiring them to pretend that they have already become complete arguments.

The difference between a Reflection and a Note is not length. It is whether the article tries to arrive at a claim. A Reflection ultimately wants to say something; a Note may simply preserve an experience or discovery. The recent article about a yandere character and SeedVR2 is closer to the latter.

Kind is also a single-value enum. A new flavor in one article should not immediately produce Random Thoughts, Unboxing, Experience, or another improvised value. A Kind should be expanded only when a form recurs and the existing set genuinely cannot describe it.

## Tags: What the Article Specifically Discusses

`tags` answers only: **Which specific objects, technologies, and concepts appear in this article?**

Good Tags include:

- SeedVR2
- Image Upscaling
- NEKOPARA
- Agent
- Existentialism
- VTube Studio

Tutorial, Review, Reflection, Learning as I Build, and Technology no longer make good Tags. They describe the article's structure or primary home, responsibilities already handled by Kind and Category.

Tags remain open and multi-valued, but should usually be nouns that can stand on their own as subjects of retrieval. This keeps Tags from collapsing into another Category or repeating what Kind already says.

# The Other Fields Keep Their Own Roles

The blog already has organizational fields more specific than Tags, and the new structure should not absorb them:

- `shelf` identifies the medium of a work, such as books, films, animation, or games;
- `subCategory` identifies a subdivision within that medium, such as galgame;
- `series` groups articles into a continuing line of writing deliberately organized by the author, such as Blogging, LLMs, or Reading.

Their relationship with Category, Kind, and Tags can be summarized as follows:

| Field                   | Question it answers                                       |
| ----------------------- | --------------------------------------------------------- |
| `category`              | Which broad domain does the article ultimately belong to? |
| `kind`                  | What form of writing does the article use?                |
| `tags`                  | What does the article specifically discuss?               |
| `shelf` / `subCategory` | Which medium does the article's subject belong to?        |
| `series`                | Which continuing line of writing is this article part of? |

Each field must answer one kind of question, or they will eventually stick together again.

# How Several Mixed Articles Would Be Classified

The new structure does not eliminate mixed articles. It gives the different parts of that mixture somewhere to go.

## The Yandere Character and SeedVR2

```yaml
category: culture
kind: note
tags:
  - Yandere
  - AI Manhua Drama
  - SeedVR2
  - Image Upscaling
```

Its point of departure and central experience come from a manhua drama, while its form is a set of image demonstrations and immediate impressions. That makes it “Arts & Culture · Note.” SeedVR2 and image upscaling remain discoverable through Tags.

## Be a Vtuber

```yaml
category: technology
kind: tutorial
tags:
  - OBS
  - VTube Studio
  - Vtuber
```

Vtubing is the use case, but the article actually promises a sequence of software configuration steps. That makes it “Technology · Tutorial.”

## Starting from a NEKOPARA Review

```yaml
category: thought
kind: reflection
shelf: Games
subCategory:
  - galgame
tags:
  - NEKOPARA
  - Meaning of Life
  - Existentialism
```

The game is the trigger; the article ultimately arrives at a reflection on life and change. That makes it “Thought · Reflection.” `shelf` and Tags preserve its connection to NEKOPARA and galgame.

## After the Cloud Provider Disappeared

```yaml
category: thought
kind: reflection
tags:
  - Blogging
  - Writing
  - Archives
series:
  - Blogging
```

A technical failure begins the article, but its real question concerns the shape of a blog and the meaning of keeping a record. It therefore belongs to “Thought · Reflection” as well.

# What Becomes Possible After the Separation

The most immediate benefit is that I no longer need to invent a Category for every article that is not “pure” enough.

For readers, “Technology · Tutorial” and “Arts & Culture · Note” communicate both subject and reading expectation. They say more than an isolated Reflection or a flat sequence of labels. For archives and statistics, content domains and writing forms can be observed separately instead of mixing technical tutorials, responses to works, and personal reflections in the same category chart.

Stable internal keys also separate data from display copy. Chinese can display 格物集 while English uses a name natural to English readers; URLs and article metadata do not have to change every time the visible wording does.

More importantly, the structure accepts that articles on a personal blog will naturally mix. Classification is not supposed to assign an article a single identity. It only needs to help a reader find a suitable way in.

# Writing Down the Principle First

This article describes a structure that is ready to be implemented, not a feature the site has already completed.

The schema, interface, archive filters, compatibility for old links, and migration of existing articles still need to be handled separately. How Category and Kind should appear on cards and article pages deserves its own design discussion. The English wording can also be refined alongside that interface.

As for the briefly invented Random Thoughts Category, I am folding it back into the existing Reflections category for now. It was never a durable category so much as a note reminding me that the drawers needed to be reorganized.
