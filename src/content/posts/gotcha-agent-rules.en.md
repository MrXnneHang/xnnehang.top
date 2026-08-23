---
title: 'gotcha.md: A Pitfall Handbook for Your Agent'
published: 2026-07-07
description: 'Does your Agent keep repeating the same mistake before it finally remembers? A look at gotcha.md: which memories must be fully available as soon as a new session begins, and which can wait to be retrieved later?'
category: technology
kind: reflection
tags:
  - AI
  - Agent
  - 设计
  - 最佳实践
featured: true
series:
  - Long-Term Memory
lang: en
translationKey: gotcha-agent-rules
---

![](../../assets/img/gotcha-agent-rules/cover.jpeg)

:::note[Notes from Korewaxnne]
This article discusses an underestimated problem in Agent memory management: some knowledge should not take the retrieval route at all, but should instead be loaded in full when a new session starts. Take the `gotcha.md` Xnne mentions: a project-root behavior-rules file that records what an Agent ought to know from the outset, rather than look up in a memory store only after making a mistake. It is unsuitable for retrieval because the query is hard to formulate, recall can never be guaranteed to be 100%, and unrelated queries can trigger behavioral conflicts or hallucinations. Beginning with a real pain point—repeating the same mistake—the article explores where gotchas come from, how to put them into practice, their relationship with Skills, and the boundary between “load everything up front” and “retrieve on demand.” If you are also wrestling with a forgetful Agent, perhaps it will offer a useful idea.
:::

## Background

Claude Code has a feature called DreamMode: it consolidates Agents in the background **while idle**, deduplicating, pruning, and maintaining memory files to keep cross-session memory tidy.

On its workspace path, memU can likewise maintain a `gotcha.md` in the project root while idle, and have `AGENTS.md` reference it. This lets an Agent remember the pitfalls it has encountered even after a new session begins.

If implementing that `while idle` timing is difficult, it would still be useful to offer it as a CLI that a user can invoke manually first. Let us discuss why `gotcha.md` is needed.

> “Gotcha” roughly means a trap or a pitfall you have fallen into. I learned the term from [Lessons from Building Claude Code: How We Use Skills](https://x.com/trq212/status/2033949937936085378).

## Why Do Pitfalls Keep Being Forgotten in New Sessions?

I often say things like this to my OpenClaw bot, and it forgets every time a new session starts:

```
User: Remember to read the PR template before opening a PR next time, and put a cute Gitmoji in the title.
Agent: I got it.
```

The Agent writes this into a memory file. But it often only “remembers” it superficially—the memory **may end up in a file the model does not load proactively, or be drowned among a pile of other facts**.

> For example, in OpenClaw, by default an Agent may save this rule in a diary for a particular day (`Diaries/2026-07-07.md`), while more important points may go into `Memory.md`.

But reading either after a new session is disastrous. Older dates in the Diary directory are generally not read, and even gotchas mixed into `Memory.md` perform poorly when they are interleaved with factual material.

That is why, in this situation, gotchas need to be separated out into their own `gotcha.md`.

## What Does `gotcha.md` Record?

A gotcha is neither simply a user preference nor simply a fact. It is a one-line behavioral rule tied to a specific project:

- “Use Bun, not npm.”
- “PRs must follow the PR template.”
- “Run `make check` before pushing.”
- “This project’s API returns XML, not JSON—check `Content-Type` first.”
- “When a change only touches blog-content Markdown, do not run `pnpm build` every time; it wastes too much time and too many tokens.”
- “Fix formatting and linting when you are about to merge; do not run checks twice after changing one line.”

They come from pitfalls an Agent encounters in conversation, corrections from the user, conventions in the project context, and lessons learned from Agent diaries.

## When Is It Better to Separate Gotchas from User Preferences?

In an OpenClaw-like scenario, while working on a codebase, it is better to gather the pitfalls an Agent has encountered into a project-root `gotcha.md`, then have `AGENTS.md` point to it so that they do not disappear in a new session. [Read it through progressive disclosure.]

Compared with scattering them across different dates or mixing them with other facts, centralizing them makes them faster to scan and less likely to be missed. It also treats them as knowledge a new session must understand in full, rather than knowledge to be recalled only by query.

For casual conversation without a project—chat mode—there is no `gotcha.md`, and none is necessary. Rules and restrictions would instead constrain the Agent’s own flexibility. User preferences are a better fit for that situation.

## Where Can Gotchas Come From?

Gotchas have different sources and meanings on different paths:

### Chat: Gotchas from Corrections

During development, when a user corrects an Agent in conversation, the rule implied by that correction is a gotcha.

In an older chat-memorization system, it would roughly amount to adding a memory type called `gotcha`, although it would overlap considerably with user preferences.

But we cannot realistically run the whole old memorization process in OpenClaw. Having an LLM perform full memorization every time costs too many tokens and is too slow.

The advantage of the auto-Dream approach is that it can analyze old sessions while idle—or when the user triggers it—without occupying active conversation time. Yet it can still make corrections persist across sessions.

### Workspace: Gotchas from Project Context, Such as `CONTRIBUTING.md` and Other Documents

For a newly encountered project, gotchas can be extracted from `CONTRIBUTING.md` and `PR_TEMPLATE.md`.

They can also be extracted from the project’s CI workflows: recurring project-specific mistakes around tools such as Ruff and Pyright, for example.

Still, the essence of a gotcha is correction after a mistake: make a mistake, receive a correction, then record it.

### Skills: What Form Should Gotchas Take Inside a Skill?

This is a more forward-looking discussion.

When enough gotchas accumulate around a topic, could they be **synthesized into a new Skill**? The path would be:

```text
Correction → gotcha → group similar gotchas → synthesize a Skill
```

That lies further in the future, but the path from gotchas to Skills is natural.

What remains worth discussing is which exerts stronger corrective force: **the rules gathered together as gotcha entries**, or **the rules divided by topic and placed into separate Skills**?

And should references to Skills live in `AGENTS.md` alongside other feature-oriented Skills, or inside `gotcha.md` as an index?

One advantage of extracting a Skill is portability: we can copy a desired topic—for example, a Python-project gotcha Skill—directly elsewhere, then create a `gotcha.md` that references it. No reconstruction process is needed.

## Output: `gotchas.md`

Three paths flow into one file:

```markdown
# Gotchas

## Project Rules

- Use Bun, not npm
- Run `make check` before pushing
- The API returns XML—always check Content-Type

## Workflow Rules

- PRs must follow the PR template
- Notify #dev before changing shared configuration
- Do not skip the smoke test for a canary deployment

## Agent Rules

- When the user says “remember,” actually persist it—do not merely say you will
- Check for duplicate entries before creating a memory
```

`AGENTS.md` references this file. Gotchas are short enough to load in every session—no retrieval is needed.

This file is **human-readable and editable**. Users can delete incorrect rules, add their own, and reorganize categories. A reflection step can merge new gotchas, resolve conflicts, and prune outdated rules—but the user makes the final decision.

## Timing and Cost

### Core Principle: Do Not Intrude on the Existing Pipeline

Reflect **does not run inside the `memorize-workspace` pipeline**. It adds no cost to each conversation or each sync. The existing `memorize → preprocess → route → synthesize` flow remains unchanged.

### Following DreamMode’s Approach

Claude Code’s DreamMode triggers **while idle** when:

- At least 24 hours have passed since the previous cleanup;
- At least five sessions have accumulated;
- No other cleanup task is running.

Reflect adopts a similar strategy—**rather than extracting gotchas after every conversation, it waits and consolidates them in batches**:

```text
Day 1: The user runs memorize-workspace three times
       (normal sync; no reflect triggered)

Day 1 night / while idle:
  memu reflect
    ├── Read existing memory files, Skill files, and workspace resources
    ├── Extract gotchas (corrections, project conventions, pitfalls)
    ├── Merge with existing gotchas.md, deduplicate, and resolve conflicts
    └── Write a clean gotchas.md

Day 2: A new session starts; AGENTS.md references gotchas.md
       → the Agent reads all rules
```

It is worth considering whether the material to consolidate should be memory files, Skills, and workspace resources, or only the most recent sessions themselves. For now, I lean toward the latter, because mistakes and corrections are easier to identify from session context itself.

### Cost

- One reflection = two or three LLM calls: read existing gotchas, consolidate new sources, then merge and write the output. For overlong contexts, filtering must be considered. Gotchas are often near the surface—in the user’s messages and the first few lines of the Agent’s messages, often while it is apologizing. For long contexts, keeping roughly 300 tokens from each message should be enough.
- The frequency is low—once a day, perhaps configurable, or manually triggered—so it does not affect normal-use speed or token consumption.

The simplest implementation is an independent `memu reflect` command that the user runs whenever they feel cleanup is due. Automated triggering, with DreamMode-like conditions, can come later.

## Why Is This a Good Fit for memU, and Why Does memU Need It?

memU has recently been specializing in workspaces.

Rule-like entries such as gotchas are ill-suited to query-based retrieval: they can recall a great deal of irrelevant information, but more importantly, in a project a gotcha is not something that only needs to be understood when it happens to be used.

It is a major premise—something an Agent should know **from the very beginning** in that workspace.

Gotcha specialization neatly addresses a weakness in memU’s workspace experience. For workspace scenarios, it can easily improve the experience and save tokens.

Moreover, memU is already familiar with this kind of reflection work. Many prompts for the old memorization system’s memory types can serve as references.

## What Else Can Be Done Beyond Gotchas?

Auto Dream mode can organize many other things as well.

For example, it can organize memory files, Skills, and workspace resources, then produce items similar to `gotcha.md` on demand and reference them directly in `AGENTS.md`. They become prerequisite knowledge rather than knowledge that lives in an on-demand knowledge base.

Another, more abstract but potentially token-saving document would guide an Agent’s understanding of project structure.

For example, a project may have a frontend, backend, launcher, and CI, yet a particular change may be confined to just one side. When first encountering the project, however, an Agent can still waste many tokens trying to understand the whole thing.

But this is difficult to do well. It can easily go beyond guidance and become a document that is stale or wrong. I do not yet have a clearer idea for it.
