---
title: 以坏架构为鉴：Claude Desktop 五套定时系统反映出来的 cowork 和 code 分离架构的弊端
published: 2026-07-23
description: 拆解 Claude Desktop 的五套定时系统，剖析混乱背后的及架构本质，为什么花 N+ 倍精力维护一个项目。以及一个坏的架构能让我们看到什么?
tags:
  - Claude Desktop
  - memU
  - bridging
  - 定时任务
category: 边写边学
featured: true
---

![](../../assets/img/covers/PixPin_2026-07-23_17-28-05.jpg)

:::note
我这个人有点怪癖，碰到让我困惑的东西就喜欢去 figure out，至少 figure 到解惑的程度。

而这次 claude desktop 那复杂的定时系统就把我吸引住了，但经过我的拆解，我发现它是一个充斥着大量历史遗留问题、不断迭代加塞代码的架构"屎山"。具体为何看我解说。

以及为什么我中途发现它写得很变态也坚持把它看完，因为并不是只有好的架构才值得学习，反而好的架构更难理解它好在哪里。但坏的架构不一样，你是一眼就能看出来，古人以史为鉴，我们以“屎”为鉴。

值得避雷这种架构，坑人家替我们踩了，我后续是千万不会去为了适配不同场景而把底层 `agent` 系统做分化，不然就会面临这种维护多套系统的情况。这相当于要花费 N 倍精力来维护一个项目。大不了我把它开成一个新项目也坚决不塞在一个项目里。
:::

## 为什么说它是架构"屎山"

先看看 Claude Desktop 的三种状态：`chat`、`cowork`、`code`。

其实这次讨论的主要是它架构上的冗余感，而不是代码的优雅度，毕竟人家不开源。

分开来用，`cowork` 和 `code` 都是极好的，并且我也都曾深度用过。

`chat` 没啥好讲的，很多 tool 啊， shell 权限啊都被阉割掉了，就单纯 chat。

`code` 感觉像是和 claude code 共享内核的。可以说 claude code 有的 tool 和 `/` 指令它都有，逻辑很像，提示词感觉也是一致的。

`cowork` 是它屎山了来源，它选择直接和 `code` 一样独立构建了一套 agent 系统，底层的 tool 和记忆机制也许大部分相通，但是又有很大分歧。比如它没有明确给出 `code` 那边的多种 `allow` 权限，它对 shell 的掌控度始终保持在有，但不如 code 完全放行的舒服，而且应该也被阉割掉了一些，以及不知道为什么它的 shell 执行效率就是比 code 低。

我以前写毕设的时候经常用它，做 survey，做 ppt 或者改 docx，在配好 skill 的情况下它真的是很好的工作台，但它也为了这个工作台牺牲阉割了很多 code 的特性，提示词，以及和 code 出现分歧。

但这次我们主要要扯的屎山是来源于定时任务系统的，或者说定时系统反馈出来背后一套非常反工程直觉的系统架构。

我们前面聊到，它们被构建成了两套 agent 系统，所以它们也必须有两套以上的定时系统。

同时由于它既要又要，它支持本地又支持云端，所以至少有四套。而且在 code 模式里还有一个叫做 `/loop` 的模式，它可以创建 session 内部的定时任务，随 session 死亡而死亡。

所以说，一个 `claude desktop` 其实严格来讲有五套定时系统，并且它还存在以下问题，`cowork` 和 `code` 之间的定时系统无法沟通，各建各的，`code` 那边叫 `Routine`，`cowork` 这边叫 `Scheduled Task`。另外 `code` 这边默认创建 local Routine， cowork 那边默认创建 `Cloud Scheduled`。并且两个创建时用的都是 `create_schedule_task` Tool，命名一致，但是不同效果。

以及 code 这边还有一个 `/schedule` 支持用户自己配置 local 还是 cloud Routine，但是 cowork 这边没有 `/Schedule`，通过对话无法创建 `Local Scheduled Task`，只能通过 GUI 把 Cloud 调成 `Run on your computer`。

这是一个充斥着历史遗留问题，功能不对齐，文档不对齐，用法还很别扭的 `code vs cowork`。

所以这次解惑算是解到屎山了。

## 背景

[#538](https://github.com/NevaMind-AI/memU/issues/538) 指出 bridging 需要 standalone CLI + headless auth。一个自然的追问是：**能不能不装 CLI，直接用 Claude Desktop 原生的定时任务跑 bridging？**（在已登录的 app 里跑，理论上同时绕开 #538 的两个 symptom。）

为回答这个问题做了本地实测（Windows 11 / Claude Desktop 2.1.181）+ 官方文档对照。本 issue 记录 survey 结果与结论，避免未来重复评估这条路线。

结论先行：**不采用 Desktop 原生定时，claude_code adapter 保持只面向 Claude Code CLI + OS scheduler。**

## Claude 原生定时系统全景（五套）

对照 [scheduled-tasks](https://code.claude.com/docs/en/scheduled-tasks) / [desktop-scheduled-tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks) / [routines](https://code.claude.com/docs/en/routines) / [Cowork support](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork) 四份文档：

| 系统                                                                                                                         | 在哪建                                           | 跑在哪                            | 能碰本地文件                  | 能读全部 session log |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------- | ----------------------------- | -------------------- |
| 云端 routine（UI: New routine→cloud）                                                                                        | CLI、Desktop、claude.ai 网页                     | Anthropic cloud，每次 fresh clone | 否                            | 否                   |
| 本地 routine（UI: New routine→Local；Code mode 运行工具: create_scheduled_task）                                             | 仅 Desktop：Routines 页选 Local、Code 会话内工具 | 本机，app 开着才跑                | 是                            | 是                   |
| session-scoped tasks                                                                                                         | CLI `/loop`                                      | 本机，随会话                      | 是                            | 是，但随会话死       |
| Cloud Cowork scheduled tasks （UI: Home->Scheduled->new task；cowork mode 运行工具: create_scheduled_task）                  | Cowork 会话 / Home 页面的 Scheduled              | Anthropic cloud sandbox           | 条件式（仅 app 在线时经桥接） | 不可靠               |
| local Cowork scheduled tasks （UI: Home->Scheduled->new task->`run on your computer` / 不能由 create_scheduled_task 复现创建 | Cowork 会话 / Home 页面的 Scheduled              | 本机，app 开着才跑                | 是                            | 是                   |

需要额外注意的一点是，由 claude desktop 对话使用内置 `create_schedule_task` 创建的 task，在 code mode 下默认是 local routine，但是 local routine 会自动绑定创建时的工作目录为它的 `cwd`，当该目录被删除后，它将会失去工作时自动激活的目录而异常。

在 cowork mode 下，`create_schedule_task` 创建的 task，默认是 cloud scheduled task，可以手动把它 `run on your computer`，这样可以变成本地的定时任务，但是这个操作难以在对话中复现，或者说被 cowork 明确拒绝：**即便我再创建十个定时任务它也依然运行在云端**，并没有任何 tool 允许它手动创建一个本地的 scheduled task，它甚至建议我们可以用 cron (Mac/Linux)，即便 windows 它也可以帮我们写。这个 `run on your computer` only-access in GUI。只能手动配置，它是 Beta，应该是新推出的功能没有进 Tool。

另外这里要指出**官方文档的一个缺口**：[routines 文档](https://code.claude.com/docs/en/routines)把 Routines 定义为只跑在 Anthropic cloud 的定时系统，[desktop-scheduled-tasks 文档](https://code.claude.com/docs/en/desktop-scheduled-tasks)把本地那种叫 Desktop scheduled task——可后者自己描述的 UI 流程就是 "click **New routine** and choose **Local**"，这在 desktop UI 里的命名时错位的。文档存在一定程度的未对齐和命名偏移，且在 desktop 中，两种任务都可以通过 UI 手动地去调整 local 和 cloud，但是两套系统似乎都没有比较完整的内置系统来稳定通过对话来触发定时任务的云端本地迁移。

## 入口路由实测：`/schedule` 与 `create_scheduled_task` 同名不同后端

![](../../assets/img/covers/claude-desktop-routing.png)

三个实测要点（全部落盘/transcript 验证，非文档转述）：

1. **`create_scheduled_task` 在 Code 会话建本地任务**（SKILL.md 实测落盘），**在 Cowork 会话建云端任务**（自述 "spins up a fresh session in a cloud sandbox, so your computer doesn't need to be on"）。同一个工具名，两个相反后端。
2. **`/schedule` 有两个**：Desktop Code 会话里敲 `/schedule`，触发的是 anthropic-skills 插件 skill（落盘于 `%APPDATA%\Claude\local-agent-mode-sessions\skills-plugin\...`），其指令结尾是 "Finally, call the `create_scheduled_task` tool" → **本地**；而文档语境（CLI）的 `/schedule` 建**云端** Routine。且实测只有 Code 会话有 `/schedule`，Cowork 和普通 chat 都没有。
3. **普通 chat 会话两样都没有**——不是定时任务的 surface。

## Code 会话的本地 task vs Cowork 的 scheduled task（用户最容易混淆的两个）

| 维度                                | Local Routinue（Code 会话建）        | Cowork scheduled task                   |
| ----------------------------------- | ------------------------------------ | --------------------------------------- |
| 跑在哪                              | 本机，Desktop app 进程内             | Anthropic cloud sandbox                 |
| app/机器关闭                        | 不跑；唤醒后只补最近一次（7 天窗口） | 照跑                                    |
| 本地文件                            | 全量（cwd 只是起点，不是沙箱）       | 仅 app 在线时经桥接，条件式、无正式文档 |
| 读全部 `~/.claude/projects` session | 可以                                 | 不可靠                                  |
| 认证                                | 继承 app 登录，无需 CLI/token        | 云端自理                                |
| 本地实体                            | SKILL.md + registry 两层落盘         | 无（没有可"搬到本地"的东西）            |

看起来 local routine 很完美很适合搭载 memu-cli 的定时系统。

但是 Routine 存在一个致命缺陷就是 `cwd` 在定时任务系统创建时自动绑定到创建时的 session 所在的项目目录，如果项目文件夹被删除，Routine 将失去工作目录而异常。虽然它可以访问全量的 sessions，但是它原本只是设计来应对 Project 内部的。

另一个不可控点就是我们无法预测用户究竟是在 cowork 下安装 memu-cli 还是在 code 下安装的。以及 cowork 下，我们无法通过对话稳定把 routine `run on your computer`。

## 为什么不把 claude_code adapter 拆成 CLI/Desktop 两套

本地 Desktop scheduled task 单看很诱人（app 内已登录、能读全部 session）——但作为 **installer 的注册目标**，实测暴露的机制问题太多：

1. **判据不稳定**：同名工具/同名命令在不同 surface 后端相反，agent 无法靠名字探测自己在哪；唯一可靠判据是"建完看 SKILL.md 是否落盘"——install 逻辑复杂且脆。
2. **入口极窄**：本地任务只能从 Desktop 的 Code 会话建。terminal CLI 无任何入口；手工投放 SKILL.md 是孤儿（实测：一个内容完整的 `memu-bridging/SKILL.md` 因不在 registry 里而永不被调度）；手改 registry（`%APPDATA%\Claude\claude-code-sessions\...\scheduled-tasks.json`）是死信（实测：手改存活 7 分钟后在触发 tick 被 app 的内存副本整条覆写）。**installer 没有任何会话外的注册路径。**
3. **隐藏 cwd 绑定**：registry 里每条任务有一个静默捕获的 `cwd`（= 创建会话的工作目录），工具参数不可传、不可 update；cwd 目录被删后的行为未文档化、实测未决。
4. **机制仍在 rollout，文档自身有缺口**：文档与实测有偏移（如 Cowork 的 `/schedule`，support 文档说有、实测没有）；文档、UI、工具三套命名互相矛盾（见上文命名说明）。surface 语义随版本漂移，不适合作为第三方 install 目标。
5. **收益并不独占**：Desktop Code 会话的 transcript 与 CLI 的落在同一个 `~/.claude/projects` 下——**CLI + OS scheduler 的 bridging 管道天然覆盖 Desktop 用户产生的数据**，不走 Desktop 原生定时不丢任何东西。

维护一套（CLI + cron/launchd/Task Scheduler，统一 task 名，三道 verify gate）vs 维护两套（其中一套建立在名字碰撞、三层存储、隐藏 cwd 之上）——选前者。这也与其余 adapter 的格局一致：codex / openclaw / workbuddy 走宿主自带 scheduler 是因为那些 scheduler 是**稳定 API**；Claude Desktop 的还不是，它还在 scheduled Task 那里标着 Beta，可能随时会改动。

## Trade-off（明确接受）

**如果用户只有 Claude Desktop、没有 Claude Code CLI**：装 memU 时需要两步额外操作——

1. 安装 standalone CLI（一条命令：`irm https://claude.ai/install.ps1 | iex` / `winget install Anthropic.ClaudeCode` / `npm install -g @anthropic-ai/claude-code`；Desktop 自带的 MSIX bundle 不算，它不在 PATH 且 bare process 不可见）；
2. headless auth（`claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN`，或 `ANTHROPIC_API_KEY`；Desktop 的登录对 CLI 不可见，见 #538）。

已有 CLI 的用户则以 verify gate 判断：bare shell 里 `claude -p 'ping'` 通过即跳过，不通过才引导 setup-token。

若未来 Desktop 原生调度稳定并文档化（尤其消除同名分裂、提供会话外注册路径），可重新评估作为 Desktop 用户的可选优化腿——届时判据必须是落盘验证，而非工具名。

## 相关

- [#538](https://github.com/NevaMind-AI/memU/issues/538) bridging 需要 on-PATH、可 headless 认证的 standalone `claude`（执行层修复）
- [#539](https://github.com/NevaMind-AI/memU/issues/539) bridging 指南缺 Windows Task Scheduler 分支（执行层修复）
- #514（已关闭，本系列的起点）

实测细节（三层存储、A/B 对照、registry 覆写时间线、调度 tick 测量）整理成博客后补链。
