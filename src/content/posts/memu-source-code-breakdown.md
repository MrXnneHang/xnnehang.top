---
title: memU 是啥？我们来拆开看看（长期更新）
published: 2026-06-29
updated: 2026-09-02
category: technology
kind: learning-note
tags:
  - memU
  - 记忆系统
  - 提示词设计
description: 拆解 memU，专注拆分主线路，以及分析 ADR 架构文档，当前跟进至 ADR 0008。
series:
  - Long-Term Memory
featured: true
pin: false
---

![](../../assets/img/memu-source-code-breakdown/cover.jpeg)

> [!NOTE]
> **AI 协作声明：** 本文由 Xnne 与 [Korewaxnne](https://github.com/xnne-bot)（赛博猫猫）共同撰写。Xnne 负责内容方向和技术分析，Korewaxnne 协助了结构组织、语法润色和格式整理。<br>
> 并且，这个博客会长期更新。

上次其实已经拆过一次 memU 了。

但是因为处在架构迭代期，并且也没有 ADR0007 的阅读指导。所以这边把上次的 break down 全部都删除了。这无形中又增加了这篇的阅读难度，我尽量地让它更简单。

## memorize / retrieve pipline changes

之前 memorize 是一个单独 python 脚本， retrieve 也是一个单独 python 脚本。

之前 memorize 和 retrieve 的对象是 `单文件(Chat)` + `Skill`。

之前 retrieve 的方式是 `LLM retrieve` + `RAG retrieve`，区分 mode, 一次只走一条路线。

在 [#466](https://github.com/NevaMind-AI/memU/pull/466) 之后。

### memorize

![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-1.png)
![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-2.png)

memorize 变成了两个脚本—— `memorize.py` + `memorize_workspace.py`

memorize 和 retrieve 的对象新增了一个 `workspace`。

简单来说就是，先前的 memorize 的对象是像 mem0 那样子，是一组对话:

```json
{
"user": "hi",
"assistant": "hi,how can I help you today?",
...
}
```

准确说是一个 single-file。还可能是一个长字符串啥的，它不包含复杂的嵌套层级关系。

workspace 的对象是一个 folder。并且可以是复杂的 folder 比如项目目录。

workspace 的 retrieve 放在后边讲。

### retrieve

![](../../assets/img/memu-source-code-breakdown/retrieve-pipeline.png)

retrieve 在 ADR 0007 里提到了要实现 BM 25 + hybrid search 的方法。不过这个方法目前暂时还没实现，`retrieve-workspace` 也只是简单的 `top-k`。

不知道是不是之前给 mentor 唠嗑的这个 [[站在 C 端开发者的角度看 memU 的架构转向]] 起了作用。好像 mentor 说服 leader 保留 LLM retrieve 和 RAG retrieve 了。在 [#467](https://github.com/NevaMind-AI/memU/pull/467) 里，它们都被加入了 cli:

```python
memu memorize notes/meeting.md
memu memorize-workspace ./workspace
memu retrieve "What are this user's launch preferences?"
memu retrieve-workspace "deploy checklist"
memu export
```

其中 retrieve 是之前 old version 配置 `RAG` 和 `LLM` 任一启用的。

然后同样把 workspace 都独立实现了。

其实还是有一丢丢架构的冗余的，比如 retrieve 是否还需要保留 `RAG mode`，按道理是需要保留的，但是保留后和 `retrieve-workspace` 原理类似但做的内容又不一样。

但如果删了复用 `workspace` 它又和语义不一样。总之这一点会让对架构挑剔度敏感的人有一些不舒服，因为它不对称。完全使用 workspace 替代 `RAG/LLM retrieve` 最舒服的架构，但也得取舍。

但是对于我来说，it's okay。以及，至少咱争取了 `LLM retrieve` 的保留。并且它似乎也真的有留下来的迹象——希望不是分多个 PR 剪除 =-=。

## Data Model Changes

### old memorize

```
Resource ──1:N──▶ RecallEntry ──N:M──▶ RecallFile
                                  (通过 RecallFileEntry)
```

一个 Resource（原始文件）产出多个 RecallEntry（LLM 提取的条目），条目通过 RecallFileEntry 关联到 RecallFile（主题文档，如 "Profile"、"Goals"）。

### latest memorize（add workspace pipline）

```
Resource ──N:M──▶ RecallFile ──1:N──▶ RecallFileSegment
              (通过 RecallFileResource)
```

workspace 路径跳过了 RecallEntry，Resource 直接通过 RecallFileResource 关联到 RecallFile。然后每个 RecallFile 被切成多个 RecallFileSegment 用于检索。

### Data Model

<div class="img-center" style="max-width: 24rem; margin: 0 auto;">

![data-model](../../assets/img/memu-source-code-breakdown/data-model.png)

</div>

### What's new?

**`RecallFileSegment`** —— 最重要的新增。一个 RecallFile 被切成 1~N 个 segment，每个 segment 有自己的 text 和 embedding。检索时搜 segment，命中后 roll up 到所属的 file。切法按 track 不同：

- skill：整个 skill 一个 segment（`name: ...\ndescription: ...`）
- memory：按行切，跳过空行和 markdown heading

**`RecallFileResource`** —— Resource 到 RecallFile 的多对多关联表（provenance）。记录"这个 file 的内容是从哪些 source file 合成来的"。旧路径通过 Entry 间接关联，新路径需要这个直接链接。

**`Resource.track`** —— 新字段，标记来源：`"chat"` / `"skill"` / `"workspace"`，旧路径的 Resource 是 `None`。workspace retrieve 通过 `track="workspace"` 过滤只搜 workspace 来源的 Resource。

### 两条路径共存

旧路径（RecallEntry 那条）**没有被删除**。`memorize.py` 仍然走 Resource → Entry → File 的链路。两条路径**共用同一张 RecallFile 表**，靠 `track` 字段区分（`"memory"` vs `"skill"`）。这也是 ADR 0007 终态要消除的——最终目标是三条 line 各有独立 store，不再靠 `track` 列区分。

### what's track?

track 这个词在数据模型里出现了三次（Resource、RecallFile、RecallFileSegment），但其实是**两层含义**：

**第一层：Resource.track —— "这个源文件从哪来的？"**

由 `memorize_workspace` 按目录名自动分类：

| 顶级目录        | Resource.track | 含义                        |
| --------------- | -------------- | --------------------------- |
| `chat/`         | `"chat"`       | 对话记录                    |
| `agent/`        | `"skill"`      | agent 执行日志              |
| 其他            | `"workspace"`  | 普通项目文件                |
| （旧 memorize） | `None`         | 单文件路径，没有 track 概念 |

**第二层：RecallFile.track / RecallFileSegment.track —— "这个文档是什么性质的？"**

只有两个值：`"memory"`（记忆主题文档）和 `"skill"`（技能文档）。

**两层之间的映射：**

```
Resource.track    →    RecallFile.track
─────────────────────────────────────────
"chat"            →    "memory"
"skill"           →    "skill"
"workspace"       →    ❌ 不生成 RecallFile
```

workspace track 的文件只存 Resource（带 caption + embedding），用于 `INDEX.md` 的检索。不合成文档，不切 segment。

RecallFileSegment.track 是从所属 RecallFile 冗余复制过来的，目的是检索时不用 join 就能按 track 过滤。

:::note
后续似乎要把 track 字段丢弃，把 chat、workspace、skill 分别存进不同的数据库表结构中。那样会更干净一些。
:::

### what's entry?

Entry（`RecallEntry`）是旧 memorize 路径的核心中间产物——LLM 从源内容里**提取出来的原子事实**。

举个例子，一段对话：

```python
用户：我下周要去东京出差，帮我订周一的机票
助手：好的，已为您预订了周一飞东京的航班
```

LLM 会从中提取出多条 entry：

| memory_type | summary                                  |
| ----------- | ---------------------------------------- |
| `event`     | 用户下周一去东京出差                     |
| `behavior`  | 用户倾向于让 AI 直接帮忙订票，不需要确认 |
| `profile`   | 用户有出差需求，可能是商务人士           |

`memory_type` 一共有 6 种：`profile` , `event` , `knowledge` , `behavior` , `skill` , `tool`。每种类型有自己的提取 prompt，LLM 按类型分别跑一遍，各自提取属于该类型的条目。

提取出来的 entry 会被 embed，然后通过 `RecallFileEntry` 归类到对应的 `RecallFile`（主题文档）里。多条 entry 汇总到同一个 file，file 的 content 就是这些 entry 的综合摘要。

**workspace 路径为什么跳过了 entry？** 因为 workspace 的源文件（代码、文档、配置）不是对话，不适合按 memory_type 提取原子事实。workspace 路径直接让 LLM 把源内容 route + synthesize 到 RecallFile，省掉了中间的 entry 层。

## 三层记忆关系对应

### 数据模型映射

我们都知道三层记忆关系：**Resource → Category → Memory Item**。

对应到数据模型：

```python
Resource     = Resource        （原始素材，一个文件/一段对话）
Category     = RecallFile      （主题文档，如 "Profile"、"Goals"）
Memory Item  = 看走哪条路径 ↓
```

两条路径的 Memory Item 不一样：

|             | 旧路径 memorize                     | 新路径 workspace                  |
| ----------- | ----------------------------------- | --------------------------------- |
| Memory Item | `RecallEntry`（LLM 提取的原子事实） | `RecallFileSegment`（文档的切片） |

:::note
ADR 0007 里管这三层叫 L0 / L1 / L2（L0 = Resource，L1 = Category，L2 = Memory Item）。含义一样，只是换了个编号。
:::

### 两条路径的顺序反转

旧路径有个**反直觉的地方**：pipeline 先产出 Memory Item（Entry），再合成 Category（File）。顺序是从细到粗：

```python
旧路径执行顺序：Resource → Entry(细) → File(粗)
```

> Q: 我会好奇，这个合成(旧路径 Entry -> Category)是直接拼接，还是说又调了一次 LLM?<br>
> A: 不是直接拼接，又调用了一次 LLM。

新路径则调转过来了：

```python
新路径执行顺序：Resource → File(粗) → Segment(细)
```

> Q: 我会好奇，调转后的提取细粒度，是否会收到影响？是否会因为把整理信息和提取信息放到一起导致提取信息能力不够？<br>
> A: 确实能力会下降，原先对每个 memory type 都做了独立的 entry 提取。相当于分 N 次，然后合成又调用一次。<br>
> **但这不一定是退步**，因为：<br>
>
> 1. workspace 的源文件（代码、文档）不像对话那样适合 "提取原子事实"——你怎么从一个 Python 文件里提取 standalone memory items？直接合成摘要文档再切反而更合理<br>
> 2. workspace retrieve 有 **segment → file roll-up**：即使单行命中不精确，只要 roll up 到了正确的 file，用户拿到的是完整文档，信息不丢 <br>
> 3. 旧路径的 entry 检索虽然精确，但 entry 是孤立的——你拿到一条 `"用户喜欢黑咖啡"` 没有上下文。新路径 roll up 到 file 后有完整的主题文档 <br>

### 方向之问：为什么 workspace 不适合"分总"？

但是更关键的似乎是：

**信息组织和信息检索的耦合方向反了。**

因为在无穷无尽的 chat memory 里，只需要抓住一点点碎片化的相关片段，就可以反推召回 resource 得到所有相关的信息，且信息是完整独立的。它是适合分总的方式的。

但是在 workspace 里，这种碎片 -> resource 的方式不那么好用了。因为能被碎片召回的也只是代码碎片，比如召回了一个 Data Model，实际上这个 Data Model 在哪里被引用还需要再次搜索，起不到召回所有相关信息的作用。反而召回很多垃圾信息——召回了很多定义，但是对使用处和架构联系毫无关系。

我们需要的是一个 Agent 和人类可读的高层文档。然后从这个文档里面去切出那些碎片。

所以 workspace 整体而言是适合总分的形式。也是我们的新路径。

但也正因为这种特殊性，我觉得应该刻意保持 chat 和 workspace 之间的路径差异化。

---

如果后续 chat 也变成"总分"的话。

似乎也能被接受，但是会有一些信息损失，换来巨大的速度提升和更低的 token 消耗。这个要看取舍了，虽然我真的很喜欢 LLM mode。

## what's different in ADR 0008

[ADR 0008](https://github.com/NevaMind-AI/memU/commit/ff90dac6976bc920667e03d295a75d5da8626f75)

### 输入来源变化 - 注意力聚焦点变化

![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-1.png)

在 ADR 0007 里我们见过这图，它的要求是 chat/、skill/、workspace/(others) 作为三种来源。然后按照不同来源来走不同的路线。

但是它在设计上其实有个不舒服的点，就是这三个文件夹从哪里来？或者说，在对话进行中，这三个是否会经常改变？skill 肯定大多时候都是稳定的。 workspace 可以是整个项目工作区，而对于一个十万行的项目来说，一次二三十行的 modify，在整个项目面前而言太微不足道了。

这会导致一个问题，模型对于上下文的变化是迟钝的。或者说这三个来源一定程度上是不靠谱的，它难免让模型一直去注意一些无关紧要的事情，而且没有一个很好的约束方案。

ADR 0008 之后**输入来源再次变回了和智能体之间的对话和工具调用记录。并且它作为唯一的原始输入。**

但是 0007 的内核依然没有被抛弃，它把输入的对话数据由 LLM 提取成了不同的待处理的部分`。

分别是 `memory`、`project`、`skill`。

### 从大文件到 embedding 索引

原本定义中的 `MEMORY.md`、`INDEX.md`、`SKILL.md` 三个大文件被拆成文件夹式，L1 子文件 + ~~L2 索引文件。避免每次大文件重新构建要处理很多东西。~~

索引本身并不以文件形式存在磁盘上，它是一个 embedding 的索引，有点意思。好奇是怎么单纯用它作为索引的。是直接把 L1 embedding 存起来还是咋弄呢？

claude say，它不是简单地把 L1 文件转成 embedding，而是对 L1 切片后做 embedding 以及附带 metadata，比如来源文件，所在行数等等。

确实是很好的做法。

后续只要改对应的子文件然后更新索引就行。就是 embedding 比较难受的一点是删除时带来的 metadata 的索引行数变化，以及 embedding 自动删除，当子文件里对应的条目被删除的时候， L2 要如何自动感知并且也做出相同删除以及更新所有条目？

听上去很麻烦，但只是工程控制上的麻烦。但是可以避免这点麻烦，对于大模型来说不需要具体行数，它只需要 grep 一下就能定位了，所以最好的做法是不限定行数来避免数据库内全量的行更新。

不过一开始似乎就没有行引用，只是 claude 举例的。

### CLI 的简化

原本定义中的 `memorize-workspace` 和 `retrieve-workspace` 被移除了。

我比较关心的是，现在是否直接用 `hybrid search` 覆盖了原来的 `old-retrieve`？

以及我需要确定是不是每步 `on_turn` 的 `memorize` 都会先调用一个按照语义拆分对话到三条线的操作。这个也消耗不小呢，虽然异步感知不到。

### on_turn 频率的取舍

和 claude 讨论了一下，既然 `retrieve-workspace` 被移除了，那么 `hybrid search` 的设计就不得不落到了原先 `retrieve` 的设计上来了，也就是说 `old-retrieve` 会因为太重被直接覆盖。

但这也确实更舒服的架构，因为一开始 workspace 和 chat 分流的时候总觉得哪里的架构设计让我不舒服。

而，到底是每轮对话都进行三线拆分还是批量累积提交，这个还在讨论中，因为一方面确实会涉及会不会太重的缘故。而且它会直接影响到几轮跑一次 memU。对 mem0 来说，是每轮对话都跑一次，而对 memU 来说，这个几轮拆一次会直接影响到运行频率。可以交给用户来设定，如果我设计的话我会这么做。

而且主要是由于按照这个设计哲学，我想不到不先拆分三路能做啥。

另外，假设每轮都拆分三路，是不是至少要四个 LLM 调用呢？

claude say yes. 确实也不轻了。而且根据 claude 的分析，老的 memorize 一般不会 run every turn，只会累积一整个长会话后手动批量地进行。而现在 ADR 0008 引入 on_turn 的设计是比较希望可以直接自动触发。但是频率就是个问题了，如果轮轮触发，那么用户会发现自己对话消耗的 token 远没有记忆文件消耗得多。

刚刚突然想到，应该是可以来一个比较轻量的 LLM call 判断当前到上次 memorize 之间是否积攒了足够的消息，这样既可以不用固定死轮数，也可以自动触发。

claude 补充说可以用 count token 的方式来决定是否要 memorize。

## What's new in ADR 0009 00010?

最近虽然还没跟进 ADR，但是实际上已经做上了。

主要都是关于 `memu-cli` 的。

我最近几天主要做了这些：

- memu commit 的 embedding 返回契约对齐。[#504](https://github.com/NevaMind-AI/memU/pull/504)
- codex 的 classify 去掉环境、turn 以及重复注入的 AGENTS.md 等信息，避免 token 浪费而后给无关的内容做记忆提取 [#511](https://github.com/NevaMind-AI/memU/pull/511)
- 加了一个快速安装 Latest HEAD 的 agentic install workflow，继承旧的配置，检查是否引入新配置，继承记忆数据库。非常便利，特别在 openclaw 里用。[#527](https://github.com/NevaMind-AI/memU/pull/527)
- 修复 openclaw 的 memorize 的输入重复和空值问题。 [#533](https://github.com/NevaMind-AI/memU/pull/533)

这几个都比较有意思，特别是最后一个让我决定去检查一下每个 adpater 的输入 classify 的内容以及最后的输出，各自都有什么冗余。

然后今天就在这里写了这篇 [[了解 RRF 和 Hybrid Search：基于时间的检索应该以什么形态混合，以及它在项目场景和陪伴场景的适配性]]，因为如果只是一味 debug 会迷失自我。需要沉淀一下。

还有一篇正在进行中。

不过我好奇的是，源码的进度很奇怪。 0009 00010 00011 的内容几乎都实现了，就是实现的很草率， all vibe 最近在疯狂 QA。

但是 0007 承诺的 Hybrid Search 和 BM25 到现在还没有落地，但这个提升应该不小呀。

我目前也对齐一下源码和 ADR 文档，看看 0009 和 00010 在是实现上，有哪些缺口，有哪些不对齐？

比如源码那边加了一个 WorkBuddy 的 Adapter，这个是意料之外的。

:::note[claude]

### 对齐的部分

ADR 0010 五个 host 的行为声明和源码逐行对齐，没有偏差：

- 每个 host 的 session 路径、instruction 文件路径、`classify()` 语义、timestamp 处理方式，全部和 ADR 表格一致。
- Hermes 确实以 `?mode=ro` 只读打开 SQLite（`hermes/sessions.py:72`），且有测试验证写入会抛 `OperationalError`。
- Cursor 确实没有 timestamp，继承 base 的 `timestamp()` 返回 `None`，manifest 记录 null。
- OpenClaw 的 timestamp 确实同时处理了 ISO 字符串和 epoch 毫秒（`openclaw/sessions.py:82-93`），用 `> 1e11` 阈值区分。
- `TranscriptSource.exists()` 默认 `root().is_dir()`，Hermes 覆盖为 `self._db.is_file()`——都如 ADR 所述。
- 配置层面：`build_service_from_env()` 确实在缺少 `MEMU_DB` 时抛 `ConfigError`（通过 `require()` 调用，`env.py:94-99`），不会静默回退。

### 分叉的部分

**1. `memu retrieve` 根本不是 ADR 0009 说的"重型 LLM 路由路径"**

ADR 0009 第 89-92 行花了很大篇幅强调：inject hook **绝对不能**调用 `memu retrieve`——因为那是 "LLM-routed path（intention routing, sufficiency checks, summarization），far too heavy to run on every turn"。所以它需要专门走 `progressive_retrieve`。

但实际上打开 `src/memu/cli.py:92`，`memu retrieve` 调用的就是 `service.progressive_retrieve()`——和 host adapter 的 `memu-codex retrieve` 调用的是**同一个函数**。`cli.py` 第 145 行的描述甚至直接写着 `"Single-shot embedding retrieval ... (LLM-free, fast)"`。

也就是说，ADR 0009 用来论证"为什么 host adapter 需要自己的 retrieve 子命令"的那个前提——`memu retrieve` 太重——**在代码里不成立**。重型 LLM 路由检索在整个代码库里不存在。ADR 的架构叙事和实现之间有一个空洞的论证层。

**2. "每个入口都调用 `build_service_from_env()`"——`memu` CLI 自己没有**

ADR 0009 第 121-125 行声称 "every entrypoint calls it: the `memu` CLI, `memu-codex retrieve`, and the bridging pipeline's prepare and commit"。bridging pipeline 确实调用了（`pipeline.py:55` 和 `pipeline.py:103`），host adapter 的 retrieve 也调用了（`retrieval.py:31`）。

但 `memu` CLI 本身用的是自己的 `_build_service()`（`cli.py:68-83`），走 argv 参数解析构建 service，不经过 `build_service_from_env()`。虽然它也会读 `config.env` 作为 fallback，正常情况下结果一致——但这和 ADR 说的 "single source of truth，一个函数统一所有入口" 是不一样的。存在两条构建路径。

**3. `install-instruction` 和 `remove-instruction` 是公开 CLI 命令，ADR 0009 没提**

ADR 0009 列举了 host CLI 的全部 verb：`retrieve`、`prepare`、`commit`、`verify-resources`、`doctor`、`docs`。但实际的共享 CLI（`host_cli.py:3-5`）还有 `install-instruction` 和 `remove-instruction`。这两个在 `instruction.py:294` 和 `instruction.py:314` 注册，是用户安装/卸载指令的入口，不是内部实现细节。ADR 的 scope 描述里漏了它们。

**4. WorkBuddy 是第六个 host adapter，没有任何 ADR 覆盖**

`pyproject.toml:69` 注册了 `memu-workbuddy`，完整实现在 `src/memu/hosts/workbuddy/`。session 格式类 Codex 但 record type 不同（`input_text`/`output_text`，`function_call`/`function_call_result` 作为独立 type）。完全遵循 0010 的 `HostSpec` 模式，但 ADR 0010 的表格和正文都只写了五个 host。
:::

ADR 0009 说不应该有任何重型 LLM retrieve，于是乎所有的 LLM Retrieve 一夜消失 =-=。

不过 ADR 0007 里承诺的 Hybrid Search 差不多是时候落地了。我们那边也可以最近把 wikimem 的 ADR 落实，然后就可以开测了。

ADR 00011 似乎涉及一些范式的设计，我们后续独立拆解，它似乎要应对一个通用的场景，我们也可以看一下，我们的 XnneHangLab，要如何接入这个通用范式？

值得注意的是，我们所有 adapter 的 retrieve 都是用 Skill 触发的而不是 on_prompt 的。

不管是 CLAUDE.md 还是 AGENTS.md，它们都不是“绝对安全”的，遗忘、惰性、幻觉也都会在长文里照常发生。

我们当时补了 [简易的 A/B test](https://github.com/NevaMind-AI/memU/issues/507)。

## 时隔很久重新回来读 memU 26.9.1

似乎上面又有一些过期的 =-=，但很难一个一个修正，因为我不擅长整理文档，完全交给 AI 又很没意思。

之前提到当我知道一个东西的构成后我就懒得把它完整记录，最近就一直处于这种状态，这不是一个好的信号。但好歹现在又有了一个可以讨论的，应该算架构决策。

### 背景

之前是基于定时器的被动 memorize，每小时每个 host 都会启动一个 session 发送 evolve 的提示词然后修改 Recall Files。

这里当时碰到的第一个难点是，如果用户本地有多个 host，整点启动的定时任务 prepare 会争抢工作区，而 evolve 是一个耗时的任务，这个争抢就会显得可怕。

当时为了防止争抢，加了一个 marker 来标记任务是否完成，若未完成就不允许新任务 prepare。

#### q1. marker 标记是如何 prevent 新任务产生的？它的生命周期如何？

然后又给不同的 host 提供了独立的工作区，就产生了 `~/.memu/hosts/*`。

但即便是现在，这个 bug 也可以说只是隐藏了并没有消退。很简单的复现方式，我们如果把定时任务的循环时间改成五分钟，然后每次任务总时长大概是十分钟。就会发现有 50% 的概率定时任务启动后 prepare 那步骤就会被 block。

#### q2. 我上面那个复现方式理论上成立吗？整体还是 marker 生命周期和行为的问题，marker 是否始终拒绝一个 workspace 里的多任务运行？

另外，每个 host 隔离了完整的 memory 快照，`~/.memu/memory` 是一个 only-retrieve 的快照，真正被直接更新的是 host 下的 memory？

#### q3. host 下的快照什么时机取得这份快照，又是什么时机把这份快照反哺回根目录。

即使现在，跨 host 之间依然存在不同快照最终导致按 track,name 覆盖丢记忆的行为。但这个原子覆盖似乎已经是最好的方案了。最好的方案是——

始终有一个中央 worker，所有的任务启动后都在这里排队，一个做完，另一个同步更新最新快照。之后下一个。这样甚至都不必区分只读只写的快照。

为什么做不到，即使我们现在恢复一个 memu-server 也兜不住我们各个 host 的定时任务行为，以及会破坏我们原来的设计。

我们预期，对于 coding agent 都采用各自自己的 agent 去做 evolve，也就是采用 skill。我们不太可能在 skill 里要求 agent 去 connect 一个 local server，无法保证 local server 始终在线，另外 memu-server 期待在 server 内部运行独立的 LLM service，这违背了我们希望用 agent 自己的 token 办事的想法。那么就得做成 EverMem 那种 MCP server handle retrieve 和 memorize 的流程。这个改造非常重，而且除了 memorize 的队列可支配问题，这个也没解决什么实质性问题，比如 Codex sandbox 的问题。

代价是巨大的，因为 MCP server 放在哪里成了一个问题，按照惯例，它通常会进闭源仓库作为一个云端服务。这会降低开源版 memU 的功能完整性以及加重云端-本地的功能差异。

在这个代价面前，按照 track,name 原子覆盖记忆已经是极其友善的方式了。

所以定下来按照 track,name 原子覆盖 + 保持 CLI。

我们就得考虑一个更深层次的问题。一旦引入主动 memorize，原先的五分钟-十分钟的问题就会回到台面上。就是一个频率问题需要解决。

我们不仅要允许跨 host 之间的记忆产生原子覆写，同时我们还得允许同一个 host 之间的记忆产生原子覆写。也就是解除 marker 的 evolve 限制。

但是这个也不是完全放开，对于 host 那边我们可以暂时保持原状，那边太重改起来复杂。

因为暂定会借助最近新出的 memu memorize CLI 来进行主动 memorize，所以借用这个 CLI 完成的主动 memorize 的记忆快照和 jobs 应该都发生在 `~/.memu/developer`。暂时不看语义问题，我们似乎把所有的主动 memorize 都放进这个 workspace，同时放开对它的 marker 限制。

建立 `~/.memu/developer/runs`，每个 run 都是原先完整的一个工作区快照。彼此没有 marker。

![主动 memorize 的运行隔离方案](../../assets/img/memu-multi-host-run-isolation/PixPin_2026-09-01_17-48-12.jpg)

### Opus 第一轮解读

这里需要先拆开三个很容易混在一起的东西：

1. `~/.memu/hosts/<host>/memory` 和 `skill` 是给 agent 操作的 Recall Files **工作镜像**；
2. `.memory_manifest.json` 是这份工作镜像在上一次成功提交时的 **内容哈希基线**；
3. `.bridging_run.<host>.json` 只是一次 bridging cycle 的 **计时 marker**，真正负责单实例运行的是外层调度器或 wrapper 的锁。

因此，前文“marker 阻止新的 prepare”和“host 把快照反哺回 `~/.memu/memory`”这两个理解都不符合现在的实现。

### q1

现在的 `.bridging_run.<host>.json` **不会 prevent 新任务产生**。它不是锁，也没有任何“文件存在便拒绝 prepare”的检查。

每次 `prepare` 一开始都会直接写入：

```json
{ "started_at": 1234567890.0 }
```

如果旧 marker 已经存在，新一次 `prepare` 就覆盖它。这个写入还是 best-effort：写失败只会损失 cycle 的观测数据，不会让任务失败。`commit` 会用它判断这次提交是否在关闭一个由 `prepare` 开启的 cycle，并计算从 prepare、agent evolve 到 commit 的总耗时。成功 commit 后 marker 被删除；commit 失败或进程中途崩溃时 marker 保留，供重试的 commit 继续关闭同一个 cycle。marker 本身没有超时清理；代码里的 24 小时上限只表示“超过这个长度就不再相信 duration 数值”，并不表示 24 小时后自动解锁。

真正的互斥发生在 agent 启动之前：

- Windows Task Scheduler 注册任务时使用 `-MultipleInstances IgnoreNew`。旧实例仍在运行时，新触发会被 Task Scheduler 直接丢弃，连第二个 bridging 进程都不会启动。
- Unix 的 cron wrapper 使用 `mkdir ~/.memu/hosts/<host>/.bridge.lock` 取得原子目录锁。锁存在且未满 180 分钟时，新触发记录一条 `skipped: another bridging run is in progress`，然后以 0 退出；进程退出时由 `trap` 删除锁。超过 3 小时的锁会被当成崩溃残留回收，这是“避免一次崩溃永久卡死定时任务”和“极长任务可能被重复启动”之间的明确取舍。

所以 marker 的生命周期是“prepare 写入、成功 commit 删除、失败保留”，而锁的生命周期才是“整次定时任务开始时取得、agent 退出时释放”。这是两套独立机制。

#### q1.1 marker 本身不决定互斥，真正互斥的 bridging task 本身？

也就是说 marker 本身只是一个哈希标识符没有任何的锁作用。

而我们的真正的锁是依赖各个 host 的定时任务本身，但我们的结论不变甚至变得更加简单。各个 host 之间的定时任务互斥，跨 host 不互斥。

另外，我们新增的 memorize 接口的 prepare 也不会产生互斥对吧？

### q2

“五分钟触发一次、一次运行约十分钟，结果约一半触发没有执行”这个现象**理论上基本成立**，但不是 prepare 被 marker block，也不是一个 50% 的随机概率。

在 Windows 上，运行期间到来的下一次 trigger 会被 `IgnoreNew` 丢弃；在 Unix 上，它会在 wrapper 取得 `.bridge.lock` 失败后立即跳过。两者都发生在第二次 `prepare` 之前，因此更准确的说法是“本次定时触发被跳过”，而不是“prepare 阻塞在那里”。如果运行时间稳定为略低于或约等于十分钟，五分钟处的 trigger 会被跳过，于是长期看接近每两个 trigger 执行一个。若任务略长于十分钟，十分钟处的 trigger 也可能赶在旧任务退出前被跳过，比例就不一定正好是 50%。

marker 也**不会始终拒绝同一 workspace 中的多任务运行**。如果绕过官方调度入口，例如手工启动一个 `prepare`，同时定时任务也在执行，那么两个进程都可以进入；后一个 `prepare` 只会覆盖计时 marker。这个重叠并不安全，因为 `prepare` 会重新生成并清理旧的 `jobs/*.txt`、`sessions/*.jsonl`，成功 commit 也会清理这些临时文件。Unix 上运行超过三小时后被当作 stale lock 回收，也是另一个可能真的发生双跑的边界。

这也意味着后文所谓“解除 marker 的 evolve 限制”并不能解决主动 memorize 的并发问题，因为当前根本没有这个限制。要允许同一 host 并行运行，真正需要解除或绕开的是调度层单实例策略，同时把 `jobs`、`sessions`、manifest、pending cursor 等可变状态隔离到每个 run；文中提出的 `developer/runs/<run-id>` 实际上是在解决这个问题。

#### q2.1 最好的做法是不动当前的定时任务对吧？

按照 1.1 的说法，我们目前是不是 memu memorize CLI 本身就不会互斥，我们只需要隔离工作区就能达成我们想要的效果，这个也符合我最初的预期，也是我为什么要隔离 developer 到外部而不是放到 host 里，因为我们确实没有那么多定时任务才携带的东西。

### q3

这里也要区分“工作镜像”和“快照基线”。对 Claude Code、Cursor、Pi 等后加入的 host，工作根是 `~/.memu/hosts/<host>`；Codex 为了兼容旧布局，仍直接使用 `~/.memu`。因此 `~/.memu/memory` **不是所有 host 共同拥有的 only-retrieve 根快照**，它实际上还是 Codex 的 `memory` 工作镜像。所有 host 真正共享的权威状态是 `~/.memu/config.env` 所指向的持久化 store，本地模式下是 memU 的数据库，Cloud 模式下则是远端服务。

一次完整流程是：

1. `prepare` 从共享 store 分页执行 `list_all_recall_files`，把当前全部 Recall Files 按 track 镜像到该 host 的 `memory/` 和 `skill/`。单个 Markdown 文件通过“同目录临时文件 + `os.replace`”整体替换，避免并发读取到半写文件。
2. 如果这是该工作区第一次 prepare，程序在镜像完成后创建 `.memory_manifest.json`，记录所有文件的 SHA-256。之后的 prepare 不会重新建立这份基线；它应当一直表示“上一次成功 commit 后的状态”。
3. agent 根据 `sessions/` 和 `jobs/` 工作，直接修改这个 host 工作区里的 `memory/*.md` 与 `skill/*.md`。
4. `commit` 把当前文件与 `.memory_manifest.json` 比较，只读取新增或内容变化的文件，然后通过 `commit_results` 写入共享 store。Recall File 的身份键是 `(track, name)`，所以已有同键记录会被整份新内容更新，而不是进行文本级 merge。
5. 只有 store 接受提交之后，程序才重新拍摄 `.memory_manifest.json`、提升 pending session cursor，并清理本轮 jobs 和 session 切片。提交失败时这些状态都不前移，留下来供下一次重试。

所以不存在“host 快照反哺回 `~/.memu/memory`”这一步。数据路径是：

```text
共享 store
  ├─ prepare/retrieve → host A 的工作镜像
  ├─ prepare/retrieve → host B 的工作镜像
  └─ prepare/retrieve → Codex 的 ~/.memu/{memory,skill}

host 工作镜像 ── commit → 共享 store
```

一个 host 成功 commit 后，另一个 host 要到下一次 prepare 或对应的 retrieve 镜像动作，才会在自己的磁盘工作区看到新版本。因此跨 host 确实存在 stale snapshot 下的 last-writer-wins：A、B 从同一旧版本出发分别改动同一个 `(track, name)`，后提交者会整份覆盖先提交者，没有三方合并、版本检查或 compare-and-swap。这里“原子”的准确范围只是本地单文件镜像的替换；`commit_results` 的语义是按 `(track, name)` create-or-update，并不等于整个多文件提交拥有一个全局原子事务。

还有一个边界：当前 diff 只提交新增和内容变化，磁盘上删除一个 Recall File 不会向 store 传播删除，因为提交 API 还没有 removal path。

#### q3.1 每一个本地的文件树的 RecallFiles 其实都是快照，只有数据库才是权威源？

那么每个 RecallFiles 我记得是在 prepare 的时候对齐最新快照，然后 commit 的时候反哺到权威快照对吧？

## Opus 第二轮解读，针对 qx.1

这一轮还要再拆一次概念。现在一共有两种不同的 marker：

- host bridging 的 `.bridging_run.<host>.json` 是 cycle 计时 marker，不承担互斥；
- developer memorize 的 `.memorize_run.json` 是 active-run marker，确实会参与同一 workspace 的生命周期门控。

它们虽然都叫 marker，但语义并不相同。

### q1.1

“真正互斥的是 bridging task 本身”这个方向是对的，但更准确的作用域是：**每个 host 自己的官方定时任务保持单实例，跨 host 不互斥。**

Windows 上每个 host 注册的是各自的 Scheduled Task，`IgnoreNew` 只会阻止同一个 task 的第二个实例；Unix 上每个 host 的 wrapper 锁定各自工作根下的 `.bridge.lock`。所以 Claude Code 的 bridging 和 Cursor 的 bridging 可以同时执行，因为 task、锁目录和工作树都不同；但同一个 Claude Code 定时任务在上一次尚未结束时再次触发，会被跳过。

因此不是“各个 host 之间互斥”，而是：

```text
同一 host 的官方 bridging run：互斥
不同 host 的 bridging run：不互斥
绕过 wrapper 手工运行 prepare：不受该互斥保护
```

另外，`.bridging_run.<host>.json` 也不是哈希标识符。它只保存一个 `started_at` 时间戳；真正保存 Recall Files 内容哈希的是 `.memory_manifest.json`。

`memu memorize prepare` 则走另一套生命周期。它不由 OS scheduler 启动，也不使用 `.bridge.lock` 或 `IgnoreNew`，但当前实现并非完全没有门控：默认 workspace 是 `~/.memu/developer`，其中有一个 `.memorize_run.json`。`prepare` 发现该文件已经存在时会直接报错：

```text
memorize workspace already has an active run
```

成功 prepare 会创建这个文件；`commit` 要求它必须存在，成功 commit 后删除，commit 失败则保留以便重试。它更接近“这个 workspace 当前是否有一轮尚未提交”的状态标志，而不是 bridging 那种计时 marker。

不过它仍然不是严格的并发锁。代码先检查 `.memorize_run.json` 是否存在，之后才物化输入、镜像 store、生成 jobs，最后才写 marker。两个几乎同时开始的 `prepare` 可能都在 marker 尚未创建时通过检查，随后互相覆盖 `input/`、`jobs/`、`memory/`、manifest 等文件。因此它能够拒绝通常意义上的“上一轮尚未结束时再开一轮”，却不能安全地解决两个同时起跑的进程之间的 TOCTOU race。

#### q1.2 我们当前有两套保证单实例运行避免侵占 workspace 的方案

一套是 host 的定时任务带来的，绑定在任务上的。

另一套则是 memu memorize 根据 `.memorize_run.json` 做的 block prepare。这个当时我都没注意到，导致我把它和 host 的混淆。

而我们现在要做的，应该是说，仅仅只把 memu memorize 的 workspace 改成 runs，并且允许多 host 直接通过接口复用这个 workspace 创建自己的 runs。我们的 `.memorize_run.json` 不再成为 block prepare 的依据，退化为确定这个 workspace 职责结束可以被清理的标志。

对 host 定时任务的单实例策略保持不变。

### q2.1

对，**最好的做法是不改当前 host 定时任务的单实例策略**。host bridging 共用同一 host 工作树里的 `jobs/`、`sessions/`、pending cursor、manifest 和 resource log；它还要处理定时任务自身的 session 身份、崩溃 leftovers 和 cursor 提升。直接放开同一 host 的定时任务重叠，会重新引入 job 被清理、session 被重复消费或漏消费等问题，而这些都不是主动 memorize 需要承担的复杂度。

主动 memorize 应当在 developer 路径解决并发。你的“每个 run 隔离完整工作区”方向正好切中现有实现的 seam，因为 `MemorizeWorkspace` 已经把这一轮全部可变本地状态放在一个可替换的 `base` 下面：

```text
<workspace>/
  input/
  jobs/
  memory/
  skill/
  .memorize_manifest.json
  .memorize_run.json
  .resource.tmp
  resources.md
```

当前 CLI 已支持 `--workspace`，所以从机制上说，把每一轮指向不同目录便能隔离本地竞争，例如：

```text
~/.memu/developer/runs/<run-id>/
```

但当前默认值仍然是共享的 `~/.memu/developer`，CLI 也不会自动创建 run id。因此“只需要隔离工作区”是正确的实现方向，却还不是当前默认行为：还需要让调用方每次传入唯一 `--workspace`，或者让 CLI 自己分配 `runs/<run-id>` 并把该路径带到后续的 verify 和 commit 命令。

而且不必让每个 run “没有 marker”。更稳妥的定义是：**每个 run 拥有自己的 marker，彼此不共享 marker。** 这样 `.memorize_run.json` 仍可以约束单轮内部的 prepare → agent → commit 状态机，同时不会限制其他 run 并行执行。若要防止同一个 run 目录被两个进程同时 prepare，还应把“检查并创建 marker”改成原子的 exclusive create，而不是现在先 `exists()`、结束 prepare 时才写入。

工作区隔离解决的是本地文件竞争，不会把共享 store 也隔离。多个 run 仍然可以从同一旧版本出发，并向同一个 `(track, name)` 提交不同结果；最终依然是后提交者整份覆盖先提交者。只要我们已经接受 `(track, name)` 的 last-writer-wins，这就是预期语义，而不是 `runs/` 还能消除的问题。换句话说：

```text
per-run workspace 解决本地并发安全
(track, name) 覆盖决定共享 store 的冲突结果
```

这也解释了为什么 developer 应当独立于 host：它只需要输入物化、Recall Files 镜像、jobs、diff 基线和 commit 生命周期，不需要复制 host bridging 的 session cursor、self-session 识别或调度器状态。

### q3.1

高层理解是对的：**共享持久化 store 才是权威源，各个本地文件树是围绕它建立的工作副本。** 不过严格来说，本地 `memory/` 和 `skill/` 不是不可变“快照”，而是 agent 会直接修改的 **工作镜像**；真正表示某一时刻快照的是 manifest 里记录的内容哈希基线。

所以这三个对象应当分别叫：

```text
共享 store                         权威状态
本地 memory/ 与 skill/            可变工作镜像
.memory_manifest.json
或 .memorize_manifest.json        用于 diff 的快照基线
```

“prepare 对齐、commit 反哺”也基本正确，但更精确的数据流是：

1. `prepare` 从共享 store 拉取当前 Recall Files，写入本轮工作镜像；
2. 程序对镜像记录哈希基线；
3. agent 修改镜像；
4. `commit` 用当前内容和基线做 diff，只把新增或变化的 Recall Files 提交给共享 store；
5. store 接受后，程序才更新本地基线并清理本轮临时状态。

这里不是把文件“反哺到权威快照”，而是把变化提交到 **权威 store 的当前状态**。store 更新之后，其他 workspace 不会自动热同步；它们要等自己的下一次 prepare 或 retrieve 镜像动作才会看到新内容。

host bridging 和 developer memorize 在基线时机上还有一个小差别：

- developer memorize 每次新 run 的 `prepare` 都在镜像 store 后建立 `.memorize_manifest.json`，因为每轮输入和生命周期是独立的；
- host bridging 只在工作区第一次 prepare 时自举 `.memory_manifest.json`，之后主要在成功 commit 后重拍，保证失败 run 的变化仍能被后续重试识别。

因此，你后面提出的 `developer/runs/<run-id>` 可以被理解成：每个 run 在启动时从同一个权威 store 分叉出一份独立的可变工作镜像，各自在提交时按 `(track, name)` 汇回 store。它不是数据库事务意义上的分支合并，而是多个独立工作副本上的 last-writer-wins 提交。

#### q3.2 为什么 Codex 已经在用 `~/.memu/memory` 了却还是保留着 `hosts/codex`?

是不是可以不让 Codex 这么特殊化，直接让它回到 hosts 里？把根目录真正转化为只读，以及数据库源对外的一个可读物，而不是一个可读又可写的东西，语义上很怪异。

## Opus 第三轮解读，针对 q1.2 与 q3.2

### q1.2

对，现在可以把两套单实例机制明确分层：

```text
host bridging
  └─ 调度层单实例：保护一个 host 的长期共享工作树

memu memorize
  └─ workspace active-run：保护一次主动 memorize 的本地状态机
```

目标架构也基本就是你描述的那样：**host bridging 保持原状，只改 developer memorize 的 workspace 分配方式。**

不过有一句需要稍微改写。不是让 `.memorize_run.json` 完全“不再成为 block prepare 的依据”，而是让它**不再阻塞其他 run 的 prepare**。同一个 run 目录仍然不应该被 prepare 两次；否则即使不同 run 已经隔离，同一 run 内的 `input/`、`jobs/`、manifest 和工作镜像仍会被第二次 prepare 覆盖。

更准确的布局和职责应该是：

```text
~/.memu/developer/
  runs/
    <run-id-a>/
      input/
      jobs/
      memory/
      skill/
      .memorize_manifest.json
      .memorize_run.json
      .resource.tmp
      resources.md
    <run-id-b>/
      ...
```

其中：

- `~/.memu/developer` 只是 run 的命名空间，不再是一轮任务本身的 workspace；
- 每次 `memu memorize prepare` 原子地分配一个新的 `<run-id>`；
- 不同 host、不同会话都可以调用同一个 CLI 创建自己的 run，不需要按 host 再分区；
- prepare 返回 `run-id` 和具体路径，后续 agent、`verify-resources`、`commit` 都显式绑定这个 run；
- `.memorize_run.json` 只约束所在的这个 run，不会影响兄弟 run。

所以它的角色确实会从“整个 developer workspace 的全局门禁”收缩成 **per-run 生命周期标志**。但“可以被清理”的方向要反过来理解：marker 存在表示这轮仍 active，通常不能清理；成功 commit 删除 marker，或者写入明确的 completed 状态之后，这个 run 才可以回收。commit 失败则保留 active 状态和工作文件，以便重试。

仅凭一个 active marker 也无法判断“很久没动的 run”究竟是已放弃还是等待人工恢复。因此自动 GC 如果要做，最好再记录 `run_id`、创建时间和状态，并提供明确的 abandon/clean 命令；不要只看到 marker 很旧就删除，因为里面可能正是一次失败后尚未提交的 Recall Files。

另外，当前实现里 `.memorize_run.json` 的 `exists()` 检查和最终创建之间还有 TOCTOU 窗口。改成 per-run 后，最自然的修复不是给所有 run 加一把全局锁，而是：

1. 用 exclusive `mkdir` 或等价操作原子分配唯一 run 目录；
2. 在任何输入物化和 store 镜像发生前，原子创建该 run 的状态文件；
3. 后续状态转换始终只发生在这个目录内。

这样多 host 可以并行创建不同 run，同一个 run 又不会被重复 prepare。共享 store 依然按 `(track, name)` last-writer-wins，但那是我们已经接受的提交冲突语义，不再是 workspace 被互相踩坏。

因此最终边界可以压缩成：

```text
host 定时任务：继续 single-instance
memorize prepare：允许并发创建不同 run
同一个 run：仍然 single-owner / single lifecycle
共享 store：允许并发提交，冲突按 (track, name) 后写覆盖
```

### q3.2

这里先纠正第一轮解读里沿用旧注释得出的错误结论：**Codex 现在已经不再把 `~/.memu` 当作 bridging 工作树，它已经迁移到了 `~/.memu/hosts/codex`。**

当前 `Codex` 的 `HostSpec` 没有覆盖 `base_dir`，所以会走统一默认值 `~/.memu/hosts/<host>`。它的指南也明确把 jobs、sessions、memory、skill、manifest 和 resources 全部放在：

```text
~/.memu/hosts/codex/
```

这个迁移是在解决“不同 host 同时 memorize 会踩共享工作树”的修复中完成的。`host_cli.py` 和旧 ADR 中仍有“Codex keeps ~/.memu”的文字，那是没有同步清理干净的历史说明，不代表当前运行行为。

另外，`hosts/codex` 可能指两个不同的东西：

- `src/memu/hosts/codex` 是源码里的 Codex adapter 包，保存 session parser、HostSpec 和安装指南；
- `~/.memu/hosts/codex` 是用户机器上的 Codex bridging 工作树。

前者是代码组织，后者是运行时状态；Codex 是否使用根目录与源码包为什么存在没有关系。

因此现在实际已经形成了你期望的大体分层：

```text
共享 store                         权威源

~/.memu/memory 与 skill             retrieve 的共享派生镜像

~/.memu/hosts/codex/...           Codex 的可写 evolve 工作树
~/.memu/hosts/claude-code/...     Claude Code 的可写 evolve 工作树
~/.memu/hosts/cursor/...          Cursor 的可写 evolve 工作树

~/.memu/developer/runs/<run-id>/  主动 memorize 的可写工作树（目标布局）
```

根目录的 `memory/` 和 `skill/` 现在也不是 Codex 在写。retrieve hook 从 store 得到命中的 Recall Files 后，会把它们原子写到 `~/.memu/<track>/<name>.md`，再把可打开的 `path` 返回给 agent。所有 evolve 写入都发生在 host 或 developer 自己的工作树里。

所以从**所有权语义**上说，根镜像已经应当被视为只读：agent 只读取它，不能把对它的编辑 commit 回 store；唯一合法写者是 memU 自己的 retrieve/materialization 代码。这里的“只读”是 consumer contract，不是文件系统权限。

如果要求它在 OS 权限上也真正不可写，当前实现就不能原样工作，因为 retrieve 负责：

- 首次命中时创建镜像；
- 每次命中时以 store 内容刷新文件；
- 用户误删后重新生成文件；
- 通过原子替换避免 agent 读到半写文件。

更重要的是，当前根镜像只是 **按检索命中惰性生成的 read-through cache**，并不是数据库的完整物化视图。没有被 retrieve 命中的文件不一定存在；store 中已经消失的记录也可能留下旧文件，因为这里没有完整 sweep 和 deletion reconciliation。因此暂时不能把 `~/.memu/memory` 定义为“数据库对外的完整可读物”。

如果真的希望得到一个严格的、完整的只读物化视图，就需要新增明确的 producer：

1. 全量分页读取 store；
2. 在临时目录生成全部 memory/skill；
3. 处理 store 中已删除而本地仍残留的文件；
4. 以目录版本或索引切换发布新视图；
5. retrieve 只读这份视图，不再自己写入。

这相当于又引入一个全局同步任务和刷新时机。它并非做不到，但会重新带来“谁负责刷新、多久刷新、失败时保留哪一版”的问题，而现有 read-through cache 正是用非常小的机制避开了这些问题。

因此当前更合适的结论是：

- Codex 不需要再迁移，它已经在 `hosts/codex`；
- 根 `memory/skill` 应明确标注为 **memU-owned、agent-read-only 的共享检索缓存**；
- 它可以由 memU 写、由所有 host 读，这不构成职责混乱，关键是普通 agent 的修改不能从这里进入 commit；
- 如果目录名让它看起来像权威数据，长期可以迁到 `~/.memu/cache/recall-files/<track>`，但这是路径迁移，不是并发模型上的必要改造；
- 只有产品确实需要“完整、可枚举、版本一致的数据库物化视图”时，才值得增加专门 producer，而不是仅为了让文件系统权限变成只读就承担这套同步协议。

换句话说，你希望得到的读写分离实际上已经存在，准确形式不是“根目录永远没人写”，而是：

```text
store 是唯一权威写入目标
host/run 镜像允许 agent 修改并通过 commit 回写
root 检索镜像只允许 memU 刷新，agent 只读且不能由此回写
```

这样才对嘛
