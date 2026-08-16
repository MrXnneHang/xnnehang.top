---
title: 'First Impressions of GitHub Stacked PRs'
published: 2026-08-05
description: 'Notes from a real refactoring project on GitHub Stacked PRs: linear dependencies, layered merging, multi-level synchronization, and local branch relationships.'
tags: [GitHub, Git, Stacked PRs, Development Tools]
category: Learning as I Build
draft: false
featured: true
lang: en
translationKey: github-stacked-prs
---

![Article cover](../../assets/img/github-stacked-prs/cover.jpg)

Today I noticed that GitHub has opened Stacked PRs as a Public Preview. It is no longer something that requires joining a waitlist before trying it.

I happened to have a very old PyQT Pomodoro project that I have recently wanted to refactor into Tauri + Rust, so I decided to try it out first.

## What Is `gh stack`?

It is a little like a `gh` CLI extension. It lets pull requests be connected in an orderly way instead of existing independently and merely mentioning one another like sworn brothers.

It lets PRs stack on feature branches rather than all pointing directly to the `main` branch.

![Overview of a Stacked PR relationship](../../assets/img/github-stacked-prs/stack-overview.jpg)

### What Does It Bring?

This is what I wrote before:

```text
Large PRs are hard to review, take a long time to move through the process, and make conflicts and blocking relationships difficult to understand. They require frequent rebasing.

Small PRs are fast to review, but their relationships can only be connected through mentions. Everything becomes fragmented and unclear. I am used to opening atomic PRs, so I often run into this problem and lose track of what has been done.

`gh stack` can combine the advantages of both approaches while making collaboration more atomic.
```

No more preamble. Let us begin.

### How Do You Create One?

For the exact steps, see [Creating stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-stacked-pull-requests).

But if you rely on tools such as Claude Code or Codex, GitHub also provides a corresponding Skill installation. It is somewhat like the Skill injection work memU has been doing recently.

You can simply tell Codex or Claude to globally install GitHub’s new `gh stack` and its Skill for you.

In other words, we do not need to care about which commands to type; we can stay at the higher-level view.

Even if we do not care about the mechanics, though, we still need to understand its shape and its benefits.

## Stacked PRs from a Maintainer’s Perspective

### Can They Be Merged in Order?

![Merge a bottom PR independently](../../assets/img/github-stacked-prs/merge-single-pr.jpg)

![Merge multiple Stack layers at once](../../assets/img/github-stacked-prs/merge-stack.png)

Yes—and they can only be merged in order.

As shown here, the bottom PR can be merged one by one. Once it is merged, as long as there are no conflicts, GitHub automatically cascades a rebase across the remaining upper branches on the server and force-pushes updates to the remote PRs. Developers do not need to manually run `gh stack sync`; the automated process stops only when it encounters a conflict and needs developer intervention.

But merging an upper PR also merges all the PRs below it. If my cursor is on the third layer, merging it merges three PRs at once.

### Incremental Reviews

Using the diagram above as an example, #23 contains all of #23’s code.

And #24 contains all of #23’s code plus #24’s incremental code, but review shows only the diff between #24 and #23.

All reviews are incremental; they do not overlap.

## Stacked PRs from a Contributor’s Perspective

### An Immediate Reality Check

All branches in a Stack PR must be in the same repository, and that repository must also contain the branch they will merge into.

For example:

```shell
xnne-bot wants to merge 4 commits into NevaMind-AI:main
```

If I open a PR from a fork to upstream, my PRs cannot form a Stack. They can only be merged together when they all live in the `nevamind-AI/memU` repository.

At least for now.

### Are Tree-Shaped Stacks Supported?

The official example looks roughly like this:

```shell
L0 main
L1  └── auth-layer
L2     └── api-endpoints
L3         └── frontend
```

It is a linear set of layers.

My first thought was: could it be a tree instead of a stack?

At present, the answer is no. Every PR must follow a strict dependency relationship. For an upper PR to merge, the lower PRs must merge with it.

What happens if two PRs are at the same level?

:::note[Opus]
Two PRs cannot exist as the “same layer” of one Stack.

Suppose PR B and PR C both use PR A’s branch as their base. From Git’s and ordinary PRs’ perspective, this is entirely valid, but they become two sibling PRs rather than part of the same linear Stack. Merging one will not merge the other.

If B and C depend on one another in sequence, arrange them as `A → B → C`. If they are independent and merely share A as a dependency, it is better to merge their common foundation A first, then let B and C each begin from the new trunk.

In short, a Stack requires each layer to have a unique layer above and below it. Once a same-level branch appears, it is no longer a Stack but an ordinary branch dependency graph.
:::

That is to say, a Stack should not contain parallel relationships. It exists solely to handle linear, inclusive dependencies. If a parallel relationship exists, the Stack should break at that point.

Break one PR down progressively and incrementally.

### Do Upper PRs Include All Lower-Level Code, and Do They Change in Real Time?

If it were only a simple puzzle, ordinary mentions could already handle it.

But the most frustrating part of mentions is this: if PR B contains all of PR A’s code and depends on PR A, then whenever PR A changes, we must manually align PR B with it.

That is also why we often hesitate to split a PR, only for it to become very large in the end.

A Stack solves this problem. Because an upper PR includes all lower PR content, any change to a lower PR will ~~automatically synchronize upward~~. The whole thing feels like one PR, but it is reviewed as different parts.

:::note[Opus]
**The triggering scenarios need to be distinguished here: upper branches really do contain lower-level code, and GitHub does automatically synchronize the remaining branches after a lower Stack PR is merged. But if you merely add and push a commit to a lower branch, that change does not immediately propagate to upper branches.**

Suppose we split a refactor into five layers:

```text
main
└── PR A: data model
    └── PR B: core service
        └── PR C: API
            └── PR D: frontend interface
                └── PR E: integration tests
```

These branches form one continuous chain in Git history:

```text
main ← A0 ← B0 ← C0 ← D0 ← E0
```

E’s branch therefore does contain the code from A, B, C, and D. But because each PR uses the branch immediately below it as its base, GitHub normally shows only E’s test changes when you view PR E, rather than showing all four preceding layers of diff again.

Now suppose the bottom PR, A, receives an additional commit `A1` that is pushed to the remote but has not yet been merged. A’s branch moves forward, but B through E do not move with that ordinary push in real time. They temporarily diverge into this:

```text
main
└── A0
    ├── A1                         ← PR A’s new position
    └── B0 ← C0 ← D0 ← E0         ← The four upper layers remain on the old chain
```

Without Stacked PRs, we would have to manually align the four layers in sequence:

```text
Rebase B onto A1
Rebase C onto the new B
Rebase D onto the new C
Rebase E onto the new D
```

`gh stack` knows the entire dependency chain, so from A’s layer you can run:

```bash
gh stack rebase --upstack
```

It performs a cascading rebase and eventually produces:

```text
main ← A0 ← A1 ← B1 ← C1 ← D1 ← E1
```

Here, `B1` through `E1` are the new commits created by rebasing. Even if the code at a given layer has not changed substantially, its commit SHA is rewritten. For this **not-yet-merged case, where only a lower branch has been modified and pushed**, you can run `gh stack rebase --upstack` locally and then `gh stack push`, or simply run:

```bash
gh stack sync
```

`sync` fetches, cascades a rebase across the entire Stack, pushes it, and synchronizes the PR and Stack state on GitHub. Under normal circumstances, whether there are two upper layers or ten, the developer runs the same command: **the number of layers does not increase the number of steps linearly**.

But the situation differs if the lower PR has already been merged through GitHub Stack merge. GitHub then cascades a rebase from bottom to top across the remaining branches on the server and automatically force-pushes updates to the remote PRs. Without conflicts, this requires no manual `sync`; you only run `gh stack sync` later when your local state needs to catch up with the remote. The **Rebase Stack** button on GitHub’s page is the same kind of server-side cascading rebase, except that it must be clicked manually.

If the change occurs in the middle PR C, A and B do not need to change. Only D and E need to realign from C. Run `gh stack rebase --upstack` on C’s branch:

```text
main ← A ← B ← C1 ← D1 ← E1
```

What can truly become troublesome is **conflicts, not synchronization itself**. Whether using a local cascading rebase or GitHub’s server-side cascade after a merge, the normal path can process the entire Stack in one action; manual intervention is needed only when conflicts occur.

If `gh stack sync` encounters a rebase conflict locally, it restores each branch to its previous state and tells you to use `gh stack rebase` instead. After resolving the current conflict and staging the files, run `gh stack rebase --continue`. If later layers conflict too, continue resolving them. GitHub’s server-side rebase cannot resolve conflicts on your behalf either, so you must return to local development.

Additionally, a rebase rewrites every affected upper branch, so remote PRs need updating and CI may run again. If the repository has protections such as “dismiss approval when new commits are pushed,” existing review status can also be affected. These costs become more obvious the deeper the Stack is and the more each layer edits the same code.

So Stacked PRs **really do reduce layer-by-layer alignment to an automatic cascading operation**: after a lower PR is merged, GitHub automatically rebases and force-pushes the remote Stack; when an unmerged lower branch changes, you actively trigger it with a local `rebase + push`, `sync`, or the web UI’s **Rebase Stack**. Under normal circumstances you do not need to operate layer by layer; human intervention is needed only for conflicts. In practice, each layer should still stay focused and cross-layer edits to the same area should be minimized.
:::

That is very clear: **GitHub automatically completes remote synchronization after a lower PR is merged**, stopping only for conflicts. `sync` is mainly for actively realigning unmerged changes or bringing local state up to date with the remote; it is not something you must run after every merge.

:::warning[Automatic Remote Synchronization Does Not Mean Automatic Local Synchronization]
GitHub’s automatic cascading rebase and force-push update **remote branches**. The local branches on a developer’s computer are not rewritten in reverse by the remote repository. Once the remote Stack updates automatically, local branches remain at their old commit SHAs; before continuing work, run `gh stack sync`, or at least `git fetch`, to obtain the latest remote state.

If you skip this step, local and remote state diverge and later rebases may conflict. `gh stack push` uses `--force-with-lease`, so it normally refuses to push when the remote has changed instead of overwriting it outright. But manually running the unsafe `git push --force` can overwrite the result of GitHub’s automatic rebase.

The more accurate workflow is therefore: **GitHub automatically updates the remote Stack; before continuing to modify or push, local development must fetch or synchronize the remote state.** If there are already new local changes, commit or stash them before synchronizing the remote.
:::

### What Do Local Branches Look Like During `sync`?

The previous section explained that upper PRs contain all lower PR code and that lower changes are synchronized with `sync`.

From the perspective of local branches, do all branches move together? Do branches include all code? How are the diffs between branches ultimately turned into the incremental diffs we review in PRs? Do Stack-linked branches carry any special marker or relationship?

:::note[Opus]
**Conclusion: upper branches include lower-level code; `sync` moves only the branches that need realignment; Stack relationships are not a special Git capability.**

Suppose there are four local layers:

```text
main ← A ← B ← C ← D
```

- Checking out A includes `main + A`.
- Checking out C includes `main + A + B + C`.
- Checking out D includes the entire chain’s code.

If A changes, then after running `gh stack sync`, B, C, and D are cascaded and rebased, so their branch pointers and commit SHAs update accordingly. If only C changes, normally only C and D need updating. It changes branch pointers; it does not modify the same working directory’s files multiple times.

Each PR shows only its own layer because it compares itself with the branch immediately below it:

```text
PR A: main → A
PR B: A → B
PR C: B → C
PR D: C → D
```

So even though D contains the code from A, B, and C, PR D still displays only the incremental `C..D` diff.

To Git, these are still ordinary branches with no special Stack marker. The relationship is recorded mainly in two places:

1. Each PR’s base/head relationship;
2. GitHub’s Stack metadata for presentation and management.

`gh stack init` also maintains local hierarchy information; `gh stack link` can instead link existing PRs into a GitHub Stack in sequence without using that local tracking state.
:::

All right, I understand. So during `sync`, the same file is not modified N times just because there are N layers. Rather, each file should change only once, and the heads of the other branches then point to the updated file.

Seen this way, GitHub Stack seems rather straightforward to implement. It only needs to know the base of each PR branch.
