---
title: GitHub Stacked PRs 使用初体验
published: 2026-08-05
description: 从实际重构项目出发，记录 GitHub Stacked PRs 的线性依赖、分层合并、多级同步与本地 branch 关系。
tags: [GitHub, Git, Stacked PRs, 开发工具]
category: 边写边学
draft: false
featured: true
---

![文章首图](../../assets/img/github-stacked-prs/cover.jpg)

今天注意到 GitHub 把 Stacked PRs 开放成 Public Preview 了，不再是之前需要排 waitlist 才能体验的状态。

恰好我有一个很早很早之前的 PyQT 番茄钟项目最近想要重构为 Tauri + Rust，于是乎我就先来体验一下。

## gh stack 是什么？

它有点像 gh 的一个 cli extension，可以让 PR 们可以用一种和谐的状态关联到一起，而不再各自独立，只能 mention 彼此相互称兄道弟。

它让所有的 PR 不再只指向 main branch，而是可以在 feature branch 上进行堆叠。

![Stacked PRs 关系概览](../../assets/img/github-stacked-prs/stack-overview.jpg)

### 它带来什么？

这是我之前写的：

```text
大 PR 很难审查，流程很长，而且冲突阻塞关系很难明确。rebase 很频繁

小 PR 审查起来快，但是关系只能靠 mention 连接，很碎片，关系不明。我习惯提原子 PR，经常就有这类问题，理不清做了什么。

gh stack 可以兼顾两者的优点，而且协作也会更原子化。
```

不废话直接开始。

### 它怎么创建？

具体怎么创建可以看 : [Creating stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-stacked-pull-requests)

但是其实如果依赖 claude code，codex 等工具的话，github 官方也有提供对应 Skill installation。这点倒是和 memU 最近做的 Skill 注入有点像。

直接跟你的 codex 或者 claude 说，请帮我全局安装 github 新推出的 gh stack 以及它的 Skill 就可以了。

也就是说我们可以完全不用关心命令怎么敲命令，我们可以直接进入主视角。

因为虽然不关心它具体操作，但我们得理解它的具体形态。以及有哪些 benifits。

## 在 maintainer 视角里的 Stacked PRs

### 是否支持先后合入？

![单独合并 bottom PR](../../assets/img/github-stacked-prs/merge-single-pr.jpg)

![一次合并多层 Stack](../../assets/img/github-stacked-prs/merge-stack.png)

支持并且也只能按照先后顺序合入。

这里可以看到， bottom 的 PR 支持一个一个合入。合入之后，只要没有冲突，GitHub 会在服务端自动级联 rebase 剩余的上层 branches，并 force-push 更新远端 PR，不需要开发者再手动执行 `gh stack sync`；遇到冲突时自动流程才会停下，交给开发者处理。

但是在上方的 PR 每次合入的时候都会把下方几个一起合入，当我的指针在第三层的时候，一次会合入三个 PR。

### 增量式的 review

以上图为例， #23 具有 #23 所有的代码。

而 #24 具有 #23 所有的代码与 #24 的增量代码，但 review 的时候只会看到 #24 diff #23

所有的 review 都是增量式的，不会重叠。

## 在 Contributer 视角里的 Stacked PRs

### 开幕雷击

当前所有的 Stack PRs 的分支必须位于同一个仓库并且和被 merges 的分支位于同一个仓库。

比如:

```shell
xnne-bot wants to merge 4 commits into NevaMind-AI:main
```

我从 fork 仓库仓库向 upstream PR，那么我的所有 PR 不能形成 stack PRs，只有都位于 nevamind-AI/memU 的仓库才能被合并到一起。

至少目前是这样的。

### 是否支持树状堆叠？

官方给的示例大概是这样的。

```shell
L0 main
L1  └── auth-layer
L2     └── api-endpoints
L3         └── frontend
```

它是一个线性 layer。

我看到的第一个念头是，能不能是一个 Tree 而不是一个 Stack？

从目前来看是不支持的，所有 PR 都必须严格遵循类似依赖的关系。上方 PR 合入的前提是下方的 PR 一起跟着合入。

如果两个 PR 位于同一层会发生什么？

:::note[Opus]
两个 PR 不能作为同一个 Stack 中的“同一层”存在。

假设 PR B 和 PR C 都以 PR A 的 branch 为 base，那么从 Git 和普通 PR 的角度看完全合法，但它们会成为两个并列的 sibling PR，而不再属于同一条线性 Stack。合并其中一个，也不会把另一个一起合入。

如果 B 和 C 存在先后依赖，就需要把它们排列成 `A → B → C`；如果它们彼此独立，只是共同依赖 A，更合适的做法是先合并公共基础 A，再让 B 和 C 分别从新的 trunk 开始。

换句话说，Stack 要求每层都有唯一的上一层和下一层。一旦出现同层分叉，它就不再是一个 Stack，而是一张普通的 branch dependency graph。
:::

也就是说， Stack 不应该包含这种并列的关系。它只为了处理线性的包含依赖的那种关系。如果存在这种并列关系，说明 stack 该在这里断一下。

渐进式地、递增式地拆解一个 PR。

### 上层的 PR 是否默认具有了下层的所有代码且实时变动？

如果只是简单拼图的话，和我们的 mention 实际上就能做到。

但是 mention 最烦的一点是，如果 PR B 具有 PR A 的所有代码，PR B 依赖于 PR A，但是这个时候 PR A 变了，我们必须手动对齐 PR B 和 PR A。

这也是我们很多时候不愿意把一个 PR 拆开最后变得很大的原因。

而 Stack PR 解决了这个难题。如果下层的 PR 所有内容都被上层所包含，并且下层的 PR 有任何变动都会~~自动同步上层~~。整体上就像一个 PR，但是 review 起来是不同的 part。

:::note[Opus]
**这里需要区分触发场景：上层包含下层代码是真的；合并 Stack 中的下层 PR 后，GitHub 也确实会自动同步剩余分支。但如果只是给下层 branch 新增提交并 push，并不会立刻自动传播到上层。**

假设我们把一次重构拆成五层：

```text
main
└── PR A：数据模型
    └── PR B：核心服务
        └── PR C：API
            └── PR D：前端界面
                └── PR E：集成测试
```

这些 branch 在 Git 历史上是一条连续的链：

```text
main ← A0 ← B0 ← C0 ← D0 ← E0
```

因此 E 的 branch 确实包含 A、B、C、D 的代码。不过每张 PR 的 base 都是它正下方的 branch，所以 GitHub 查看 PR E 时，正常情况下只会显示 E 这一层的测试改动，而不会把前面四层的 diff 全部重新展示一遍。

现在假设最底层的 PR A 只是新增了一个提交 `A1` 并被 push 到远端，但还没有合并。A 的 branch 向前移动了，B 到 E 不会因为这次普通 push 实时跟着移动，而是暂时分叉成这样：

```text
main
└── A0
    ├── A1                         ← PR A 的新位置
    └── B0 ← C0 ← D0 ← E0         ← 上面四层仍在旧链上
```

如果没有 Stacked PRs，我们需要自己依次完成四次对齐：

```text
把 B rebase 到 A1
把 C rebase 到新的 B
把 D rebase 到新的 C
把 E rebase 到新的 D
```

`gh stack` 知道整条依赖链，因此站在 A 这一层执行：

```bash
gh stack rebase --upstack
```

它会执行级联 rebase，最终得到：

```text
main ← A0 ← A1 ← B1 ← C1 ← D1 ← E1
```

这里的 `B1` 到 `E1` 是 rebase 后的新提交。虽然某一层的代码可能没有发生实质变化，但 commit SHA 会被重写。对于这种**尚未合并、只是修改并 push 下层 branch** 的情况，可以在本地运行 `gh stack rebase --upstack` 后再执行 `gh stack push`，也可以直接执行：

```bash
gh stack sync
```

`sync` 会完成 fetch、整条 stack 的级联 rebase、push，以及 GitHub 上 PR 和 stack 状态的同步。正常情况下，无论上面还有两层还是十层，开发者执行的都只是同一条命令，**层数不会线性增加操作步骤**。

但如果下层 PR 已经通过 GitHub 的 Stack merge 合入，情况就不同了：GitHub 会在服务端从下往上级联 rebase 剩余 branches，并自动 force-push 更新远端 PR。没有冲突时，这一步完全不需要开发者手动运行 `sync`；本地之后需要跟上远端状态时，再运行 `gh stack sync` 即可。GitHub 页面里的 **Rebase Stack** 按钮也是同一类服务端级联 rebase，只不过它需要手动点击。

如果修改发生在中间的 PR C，那么 A 和 B 不需要变化，只需从 C 开始重新对齐 D 和 E。在 C 的 branch 上运行 `gh stack rebase --upstack` 即可：

```text
main ← A ← B ← C1 ← D1 ← E1
```

真正可能变麻烦的是**冲突，而不是同步本身**。无论是本地级联 rebase，还是 GitHub 合并后的服务端自动级联，正常路径都可以一次处理完整条 Stack；遇到冲突时才会停下。

本地执行 `gh stack sync` 遇到 rebase 冲突时，会恢复各 branch 原来的状态，并提示改用 `gh stack rebase` 处理；解决当前冲突、暂存文件后执行 `gh stack rebase --continue`，如果后面的层再次冲突，就要继续处理。GitHub 网页上的服务端 rebase 在存在冲突时也无法代为解决，需要回到本地处理。

此外，rebase 会重写所有受影响的上层 branch，因此远端 PR 需要更新，CI 也可能重新运行；仓库如果启用了“有新提交时撤销 approval”之类的保护规则，已有 review 状态也可能受到影响。Stack 越深、各层修改的代码越重叠，这些成本越明显。

所以 Stacked PRs **确实把逐层对齐收敛成了自动的级联操作**：合并下层 PR 后，远端 Stack 会由 GitHub 自动 rebase 和 force-push；只是修改尚未合并的下层 branch 时，则由本地 `rebase + push`、`sync`，或网页上的 **Rebase Stack** 主动触发。正常情况下不需要逐层操作，遇到冲突时才需要人工介入。实践中仍应该尽量让每层改动聚焦、减少跨层修改同一片代码。
:::

非常清晰了，也就是说，**合并下层 PR 后的远端同步是 GitHub 自动完成的**，只在 conflicts 时停下；`sync` 主要用于主动对齐尚未合并的修改，或者让本地状态跟上远端，而不是每次合并后的必做步骤。

:::warning[远端自动同步，不代表本地也自动同步]
GitHub 自动级联 rebase 和 force-push 的是**远端 branches**，开发者电脑上的本地 branches 不会被远程仓库反向改写。远端 Stack 自动更新后，本地仍然停留在旧的 commit SHA；继续工作前需要先运行 `gh stack sync`，或者至少执行一次 `git fetch` 获取最新的远端状态。

如果跳过这一步，本地与远端会形成分叉，后续 rebase 可能产生冲突。`gh stack push` 使用 `--force-with-lease`，发现远端已经变化时通常会拒绝推送，而不是直接覆盖；但手动执行不安全的 `git push --force`，就可能把 GitHub 自动 rebase 后的结果重新覆盖掉。

所以更准确的工作流是：**GitHub 负责自动更新远端 Stack，本地在继续修改或推送前负责 fetch / sync。** 如果本地已经产生了新的改动，先 commit 或 stash，再同步远端状态。
:::

### 本地分支在 sync 操作下是什么样的？

上一节提到了上层 PR 包含下层所有 PR，下层变动用 sync 同步。

如果从本地分支的视角来看，所有分支都会一起变动吗？另外分支是否包含所有代码？不同层之间的 branch 之间的 diff 最终是如何转换到 PR 里被我们 review 的增量式 diff 的？对于有 stack-link 的分支之间，它们分支有什么特殊标记或者关联吗？

:::note[Opus]
**结论：上层 branch 包含下层代码；`sync` 只移动需要对齐的 branch；Stack 关系不是 Git 的特殊能力。**

假设本地有四层：

```text
main ← A ← B ← C ← D
```

- checkout A：包含 `main + A`
- checkout C：包含 `main + A + B + C`
- checkout D：包含整条链的代码

如果 A 发生变化，执行 `gh stack sync` 后，B、C、D 会被级联 rebase，branch 指针和 commit SHA 随之更新；如果只修改 C，则通常只有 C、D 需要更新。它改变的是 branch 指针，不是同时修改多份工作目录。

PR 之所以只显示自己这一层，是因为每张 PR 都和正下方的 branch 比较：

```text
PR A：main → A
PR B：A → B
PR C：B → C
PR D：C → D
```

所以 D 虽然包含 A、B、C 的代码，PR D 展示的仍然只有 `C..D` 的增量 diff。

这些 branch 对 Git 来说仍然只是普通 branch，没有特殊的 Stack 标记。关系主要记录在两处：

1. 每张 PR 的 base/head 关系；
2. GitHub 上用于展示和管理的 Stack 元数据。

`gh stack init` 还会维护本地层级信息；`gh stack link` 则可以跳过这份本地 tracking state，直接把已有 PR 按顺序链接成 GitHub Stack。
:::

ok 了解，也就是说 sync 的时候其实不会因为有 N 层把同一份文件改 N 次，恰恰每个文件应该只改了一次，然后其他的 branch 的 head 指向了新文件。

这么看来 github stack 实现起来也相当简单。只需要知道每个 PR branch 各自的 base 是谁就好了。
