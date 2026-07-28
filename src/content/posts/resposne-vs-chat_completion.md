---
title: 协议的形状决定能力：codex 为什么砍掉 chat_completion，以及桌宠的「边说边做」到底卡在哪
published: 2026-07-28
description: 从 codex 硬删 chat/completions 的全过程，追到 new-api 被波及的迁移损伤，再拆开 Anthropic Messages 与 OpenAI 协议在 Tool 流上的真实差别——为什么我的长链静默不是协议的锅，以及什么才算真的「边说边做」。
tags:
  - LLM
  - Agent
  - OpenAI
  - Anthropic
  - 协议
  - Tool Call
category: 边写边学
featured: true
series:
  - LLM
---
![](../../assets/img/covers/18409210202869120.jpg)

## 前言

今天我们来稍微讨论一下关于传输协议。

常见的有：

- `Chat Completion`: /v1/chat/completions
- `Responses`: /v1/responses
- `Claude Response`: /v1/messages

一直以来我的 `XnneHangLab` 消费的都是 `chat_completion`。

原因比较简单，我以及正常用户接触的都是 `chat_completion`。因为早期版本的 newapi 是不支持 Responses 的，直到今年五月份以后的新版本似乎才支持。而且 DeepSeek 这样的 API 平台也都只提供了 Completion 的接口，这就很不该了。导致我当时想找个纯正的 Responses 接口来测试一下新版本的 codex-cli 都找不到。

> PS，最近的 ds-v4-flash 在我日常使用中已经出现了类似豆包的低智和左右脑互博。哪怕一些简单的指令也需要跑几次，已经打算全面用 grok-4.5 接替它在 Obsidain-YOLO 里的辅助工作。<br>
> 不知道是不是降智了，在我这里，判断一个模型智力最容易就是让它审查代码，而 deepseek-v4-flash 审查代码和 gpt-5.6-sol 以及 grok-4.5 比真的是会流口水的那批。多步推理和深度思考一团糟，考虑事情非常片面。<br>
> 唯一可圈可点的就是 deepseek 的后训练了，它让 deepseek 的话看起来更有人格。也就只能用来角色扮演对话了。但是 tnnd 那个图像理解到底什么时候进 api。明明网页端都上线了一个多月了。

之所以想来做这个，是因为在测试 memu-cli 接入 codex-cli 的时候，发现新版本 (>0.95) 的版本直接阉割掉了 `Chat Completion` 转向 `Response`。

## 讨论的主题


### chat_completion 和 responses 的差异与迁移价值

我们这里探讨一下为什么 codex-cli 这么做。可能从 codex 官方仓库的 issue 入手。

以及分辨一下这两个主要区别，以及迁移价值，会给我们的 XnneHangLab 带来哪些好处？


### Anthropic Messages 和 OpenAI 的流式 Tool 回复的差异

以及召回一下以前在碎碎念里留下的疑问：

```shell
可以探究一下为啥 anthropic 协议支持 tool token 和 chat token 交替，而 openai 只能先 tool 后 chat ，但是似乎用提示词注入又可以让它预告自己要执行的 tool。

它预告时是否得到了完整的 tool schema? 以及它是在哪一次 LLM call 进行预告?
```

这里或许不够准确。这个疑问是这样的场景：

我们给桌宠陪伴场景加了 ToolCall 后，不仅 ToolCall 会带来一次额外的 LLM，而且等待 Tool 执行的时间通常还不短，并且还得把 Tool 执行的结果再发给 LLM 进行回复，这个过程中，体感上增加了五六秒的回复延迟。而且这个过程模型显得异常 `沉默`。

当时我设计给它加入了一个 policy 级别的提示词注入插件: [pre_tool_preview](https://github.com/XnneHangLab/XnneHangLab/blob/dev/src/lab/plugins/pre_tool_preview/plugin.toml)

大致就是告诉模型说，嘿，如果你要执行 tool 了，请在执行前口头预告一下你要执行的内容。

之后模型也确实会在做各种事情来一句简短的预告 `让我截图看看你在做什么？`、`让我翻找一下最近的日记内容`。

整体效果不错，缓和了原本那段如果死亡一般的寂静沉默。

### 为什么我的 pre_tool_preview 可以生效？它的限制是什么？

我有点忘了当时的具体实现细节了，需要再次确认。另外，我需要 token 级别的 `streaming token` 演示，token 是如何交替的，这个预告发生在 tool token 前还是 tool token 后。为什么可以先预告再执行再回答。它中间经过了几次 LLM Tool Call。

以及它可以预告几次？是否支持长 tool call 链条的分段预告？

如果我迁移到 Responses，这个特性会被继承吗？ Responses 会改变 Token 流的返回过程吗？

另外我室友说 Responses 支持长连接是真的吗？是否可以省掉我桌宠对话过程中握手带来的那部分首字延迟？

以及当时为什么我会说 Anthropic 支持边说边做，而 OpenAI 不行？它们在 Streaming Token 流上有什么区别吗？

### 工程上如何让 Agent 边说边做？

我们了解到 pre_tool_preview 大概只是最初级的做法。

而在工程上，经常会看到某些 Agent 支持长链的 Tool Call，比如 [Obsidian-yolo](https://github.com/Lapis0x0/obsidian-yolo)。

这中间大致是高频的 Tool Call 和反馈。它是的提示词是如何编写的。是如何让模型支持长链往返的，这似乎有些违背了我最早对于 chat_completion 的认识。因为这中间看上去似乎没有多次握手？

多次握手大多发生在什么时候？

---

大致就是这些疑问。接下来我们来请教 Fable 老师，或者 Opus 老师，请老师不要仅仅只依赖自己的学识回答，这里很多涉及到的东西要有依据。最好是 codex 或者 newapi 官方仓库的 issue ， Athropic 和 OpenAI 的文档来背书。

## codex-cli 为什么要砍掉 Chat Completions

为什么 codex-cli 砍掉了 chat_completion？

一直以来我都用得好好的。而 codex-cli 直接砍掉了这个协议的支持，看起来收益相当大。

codex 本身开源，这个问题不仅需要围绕协议本身差异，而且最重要的是 track 社区 issue、disscussion、PR。以及 newapi 社区的相关 issue 和 PR。

我需要了解整个过程的起始到终止，为什么做出这个决策？是独断决策还是社区决策？社区支持率如何？


:::note[Opus]
**结论：这是一次有公告、有弃用期、有硬删除 PR 的协议下线，独断执行，社区零支持率。表面理由是维护成本，真实原因是 codex 新功能的原语只有 Responses 装得下。你说的 ">0.95" 精确到不能再精确——就是 `rust-v0.95.0`。**

### 时间线

| 时间 | 事件 |
| --- | --- |
| 2025-12-09 | 官方发弃用公告 [codex#7782](https://github.com/openai/codex/discussions/7782)（`etraut-openai`） |
| 2025-12-11 | 给 `wire_api = "chat"` 加运行时警告 [codex#7897](https://github.com/openai/codex/pull/7897) |
| 2026-02-03 | 硬删除 PR **`chore: nuke chat/completions API`** [codex#10157](https://github.com/openai/codex/pull/10157)，49 文件 +268/−2931 |
| 2026-02-04 | 第一个含该 commit 的 release：**`rust-v0.95.0`** |

用 compare API 验过：`d2394a24...rust-v0.95.0` 是 `ahead`，`...rust-v0.94.0` 是 `diverged`。**0.94 还能用 chat，0.95 开始不能。**

### 独断还是社区决策

公告的 reaction 分布：**👎 85 / 😕 10 / 🚀 2 / 👍 0**，upvote 21，评论 11 条。分类是 `General` 不是 Poll，没选 answer。措辞也不是征询——"the Codex team **is** deprecating"、"Full removal **is slated for** early February 2026"。删除 PR body 是空的、0 条 review comment、5 天合并。事后 [codex#31083](https://github.com/openai/codex/issues/31083) 提了带 feature flag 的恢复方案，0 reaction、无人回应。

**零赞八十五踩，照常执行。** 但别急着骂——公告里那句免责已经解释了一切：

> **The vast majority of Codex users are unaffected by this change.** If you are using OpenAI-hosted models with a default Codex configuration, you are already using the `responses` API.

**投票的人和付钱的人不是同一批。** 那 85 个踩基本都来自本地模型和第三方网关用户。对你的启示：codex 开源 ≠ 它对协议兼容性有承诺，**"上游随时可能单方面砍掉一整条协议路径"要当成设计前提。**

### 官方理由 vs 真实原因

公告说的是维护成本：

> the `chat/completions` API has **increasingly hampered our ability to improve Codex**... added complexity, introduced regressions, and increased support overhead.

但更硬的原因是表达能力。**Chat 是 message-centered**（塞进 `role`/`content`/`tool_calls`），**Responses 是 item-centered**（有序 item 列表，reasoning / function_call / message / web_search_call 全是平级独立条目）。codex 后来加的东西 chat 根本没地方放——`agent_message`（[#33551](https://github.com/openai/codex/issues/33551)）、`type: "namespace"` 的 MCP 工具（[#23186](https://github.com/openai/codex/issues/23186)）、加密任务分配（[#34833](https://github.com/openai/codex/issues/34833)）。

最诚实的签名是现在的 `WireApi` 枚举——**只剩一个成员**，配置项还在但已不构成选择：

```json
"WireApi": {
  "oneOf": [{ "enum": ["responses"], "type": "string" }]
}
```

[官方迁移文档](https://developers.openai.com/api/docs/guides/migrate-to-responses)给的收益（**自测自报，无第三方复现**）：SWE-bench +3%、**缓存利用率提升 40%–80%**、`store: true` 跨轮保留 reasoning、可选 encrypted reasoning。缓存那条是重点——codex 是长上下文重复前缀的典型负载，命中率直接等于钱。

### 波及 new-api 成了什么样

（先排噪声：new-api 里那堆 `[codex]` 前缀 PR 是维护者**用 Codex 写的**，不是兼容性工作。）

| 类别 | 证据 |
| --- | --- |
| **缓存透传崩了** | [#3389](https://github.com/QuantumNous/new-api/issues/3389) 实测直连 vs 中转：未缓存输入 **11.74x**，缓存输入只剩 **9.16%**，输出反而只有 43.87%；[#3309](https://github.com/QuantumNous/new-api/issues/3309) 识别不了非标准位置的缓存字段 |
| **加密 reasoning 的新错误** | [#3240](https://github.com/QuantumNous/new-api/issues/3240) `invalid_encrypted_content`，按 `prompt_cache_key` 做渠道亲和救不了，要 litellm 的 `encrypted_content_affinity`。**至今 open** |
| **降级通道有损** | [#5209](https://github.com/QuantumNous/new-api/pull/5209) 是你印象里"五月才支持"的那个；但它丢 MCP 工具（[#5938](https://github.com/QuantumNous/new-api/issues/5938)）、丢 `reasoning_content`（[#6396](https://github.com/QuantumNous/new-api/issues/6396)）、丢 reasoning summary（[#6449](https://github.com/QuantumNous/new-api/pull/6449)）、漏 `include_usage`（[#6149](https://github.com/QuantumNous/new-api/issues/6149)） |
| **工程碎屑** | SSE 无 `Content-Type`（[#6075](https://github.com/QuantumNous/new-api/issues/6075)）、zstd 解压（[#6313](https://github.com/QuantumNous/new-api/issues/6313)）、OOM（[#5698](https://github.com/QuantumNous/new-api/issues/5698)）、渠道亲和挡 failover（[#4541](https://github.com/QuantumNous/new-api/issues/4541)）、追私有端点 `/v1/alpha/search`（[#6114](https://github.com/QuantumNous/new-api/issues/6114)） |

两个要点。第一，**加密 reasoning 让负载均衡不再无状态**——上下文里出现了一段有归属、不可搬运的 blob，这在 chat 时代不存在。第二，也是对你最重要的：

> **降级通道丢的全是 reasoning 和 tool 元数据——恰好是你后面几问要观测的那部分 token 流。** 做 streaming token 演示前，务必确认走的是原生 Responses 上游还是 newapi 的降级通道，否则你看到的交替顺序是网关翻译出来的，不是模型真实吐的。

这些 issue 绝大多数**至今 open**。不是 newapi 不努力，是 `/v1/responses` 的表面积比 `/v1/chat/completions` 大了一个数量级：状态、加密、item 排序、生命周期事件、私有端点，每样都得重新实现。

### 一句话版本

**官方说"legacy 拖慢开发"，代码说"新功能只有 Responses 装得下"，商业上说"受影响的都不付钱"——三句话同一个动作，所以不可逆；对 XnneHangLab 来说这不是要不要迁移，是网关已经替你迁了一半，而它翻译途中丢掉的恰好是你最想研究的那部分信息。**
:::


### 总结和吐槽一下 openai

okay，所以呢，这边很清晰了。

openai 只是自己不想继续在 codex 里面维护两套逻辑 (`chat_completion` + `responses`) 于是乎当方面砍掉了 `chat` 接口。为的是更敏捷的开发和快速迭代。砍掉了那些不为 openai 实际付费的人（第三方模型 provider 支持），被社区骂了很久。

但实际上，它非常左右脑互博，它前脚刚刚把 `chat_completion` 砍掉，后续又在近期把 `ChatGPT` 和 `Codex` 两个客户端合并在了一起，搞成了和 Claude Desktop 一样的架构。

而我们前面聊过 [[以坏架构为鉴：Claude Desktop 五套定时系统反映出来的 cowork 和 code 分离架构的弊端]]。这个架构会让维护成本几何倍的上升，分开维护比合起来维护好得多。而且最近 memU 这边的 host 适配的时候， Claude Desktop 和 Codex Desktop 也因为它们的 Cowork 和 Chat 的各种离奇沙箱和低 shell 权限表现出非常糟糕的适配性。

前脚操作像是追求技术整洁，后脚又把架构变成屎山。（虽然两者代码不一定都在 codex 官方仓库莉维护，也许 core 是独立维护的，和 claude code 一样，桌面端独立）。

这大概都是商业化的追求，然而，这追求的我看不懂，决策也看不懂。

而且 openai 永远是这样，喜欢一下子做两件事情而不是一件事情做到最好，更新 gpt 模型的同时，跑去分化 `codex` 模型，分化 `o1`、`o2` 、`o3` 。然后最后又把 `codex` 扔掉了只做 gpt。期间命名也是一团糟，简直是想到什么命名什么。而且 5.1、5.2、5.3、5.4 更新频率跟窜了一样。结果这一阵子下来绝大多数人体感最佳模型是 5.2。5.4 这边讲话跟人机一样，而且信息冗余度很高，杂乱无章，ADHD 患者看了一大段一句话都看不进去。

而 claude 这边对于模型追求的始终是数学、编码、逻辑能力。命名迭代严谨且浪漫，希腊神话来着。而且换名字的时候是真的有重磅更新，比如 Fable。

而 GPT 目前就 5.6 sol 、terra 可以用。5.6 以下充斥着混乱无秩序以及不信任感。

我看不懂 openai，为什么一手好牌能打这么烂。也看不懂 codex，估计他们自家员工也是，都建议大家把 5.6 接到 claude code 里最好用 XD。

### 需要注意什么，当前没有迁移价值，只有迁移风险

我们更在意的，其实是迁移价值。

但是看起来 newapi 当前对于 responses 的原生支持和转换很烂，还有很多技术债。只是简单保证回复能通不出错，真正的特性几乎一个没有继承过来。反而阉割掉了不少东西。

目前绝大多数人还接触不到真正 respones api，也就是说当前我们接着用我们的 `chat_completion` 就很好了，`newapi` 在这方面的支持已经沉淀了三年以上了，没必要赌着去换 `responses`。

## 真正的 respone 和 chat_completion 差别在哪？

前面提到， response 似乎支持 `store=true` 这种东西，可以轮次命中缓存和保留 reasoning。主要优化点也只在于缓存命中的优化，没有更多了吗？

:::note[Opus]
**远不止。而且缓存不是"一个功能"，是别的改动带来的副产品——把因果搞反了会看不清这次协议换代到底换了什么。**

### 一张表看完

| 维度        | Chat Completions                            | Responses                                                                                    |
| --------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 端点        | `/v1/chat/completions`                      | `/v1/responses`                                                                              |
| 输入        | `messages` 数组                               | `input`（字符串或 Item 数组）+ 顶层 `instructions`                                                     |
| 输出        | `choices[0].message.content`                | **`output`：带 `type` 的有序 Item 数组**，每个有独立 `id`                                                 |
| 工具定义      | `{type:"function", function:{name,...}}` 嵌套 | `{type:"function", name:...}` 扁平                                                             |
| 工具结果      | 塞回 `messages`                               | 独立 Item，用 `call_id` 关联                                                                       |
| strict    | 默认关                                         | **默认开**（不兼容再退回 `strict:false`）                                                               |
| 结构化输出     | `response_format`                           | `text.format`                                                                                |
| 内置工具      | 无                                           | `web_search` / `file_search` / `tool_search` / `code_interpreter` / **remote MCP**           |
| 多轮        | 每轮手动重发全量 `messages`                         | `previous_response_id` 或 `conversation` 对象                                                   |
| 状态        | 无                                           | `store`（默认存 30 天，可关）                                                                         |
| reasoning | 丢弃                                          | **原生 `reasoning` Item，支持 `encrypted_content`**                                               |
| 流式        | 不透明的 `delta` chunk                          | **语义事件**：`response.output_item.added` / `response.output_text.delta` / `response.completed`… |
| 异步        | 无                                           | `background: true` + 轮询                                                                      |
| 断流续传      | 无                                           | `starting_after` 游标（SDK 支持 "coming soon"）                                                    |

### 真正重要的只有四条

**1. `output` 是 typed Item 数组——这是所有其他差别的根。**
chat 里一轮的产物必须压扁进 `role`/`content`/`tool_calls` 三个格子；Responses 里它是一串平级的、各自带 id 和生命周期的条目。上一节说的 `agent_message`、`namespace` 工具、加密任务分配之所以 chat 装不下，全是因为这个。

**2. hosted tools 在服务端执行，一次请求内可以连续调多个工具。**
官方原话是模型"automatically decides whether to use a configured tool"，且"Some advanced workflows can also load more tool definitions during the interaction"（`tool_search`，仅 gpt-5.4+）。**这条直接回答了你后面那个"长链 Tool Call 为什么看上去没有多次握手"的疑问**——内置工具那部分确实没有，因为控制权压根没回到客户端。但你自己的 function tool 仍然要回来执行，这个区分很关键，后面单独展开。

**3. reasoning Item 跨轮保留——缓存提升是这条的副产品。**
文档对无状态调用的要求是 "preserve **every** item in the response's `output` array"。为什么缓存能提升 40%–80%？不是因为"加了缓存"，**是因为前缀变稳定了**：chat 每轮手动拼装 `messages`、推理内容被丢弃，前缀天天在变；Responses 用 `previous_response_id` 续接、reasoning 原样保留，前缀就是一条只往后长的链。**SWE-bench 那 +3% 同理，来自推理不再被截断，不是来自缓存。**

**4. 流式从黑盒变白盒。**
chat 的 SSE 只有一串 `delta`，你得自己猜这段是正文还是工具参数；Responses 每个事件带 `type`，`output_item.added` 明确告诉你"新开了一个 Item，它是 reasoning / message / function_call"。**你要的那个 token 级交替演示，在 Responses 里是直接可读的；在 chat 里得靠推断。** 这条对你后面几问的价值可能比缓存大得多。

### 但结论不变

上一节的判断我不改：**现在别迁。** 因为上面这四条里，真正能落到你手上的取决于中间那一跳——而 newapi 的降级通道恰好把 reasoning Item 和 tool 元数据丢了（[#6396](https://github.com/QuantumNous/new-api/issues/6396) / [#6449](https://github.com/QuantumNous/new-api/pull/6449) / [#5938](https://github.com/QuantumNous/new-api/issues/5938)）。**你花力气迁过去，拿到的是一个被翻译回 chat 语义的 Responses 壳子，四条好处一条都不剩。**

值得记下来的是**触发迁移的条件**，而不是迁移本身：等你能拿到原生 Responses 上游（不经降级），第 4 条（语义流式）和第 2 条（服务端工具链）才是你桌宠真正要的东西；缓存反而是最不该为之迁移的理由。
:::

### 再次吐槽

我大概看懂了。

它把之前 `choices[0].message.content` 那套非常变态的数据结构变得像 `pydantic` 可校验的白盒子。以及把以前写流式非常多 type unknown error 改成了原生支持。

我以前刚刚接触 openai 那个库的时候就觉得，一个 pypi 包，这么多人用，怎么能写得全是 pyright error，得加那么多 type:ignore。它在类型强校验上简直就是一团糟。如果仅仅看一小段代码，可能根本看不出来这段代码返回的是什么内容，因为什么内容都套在 `content` 的壳里面。

一个那么大的公司，数据结构怎么会设计的那么潦草。

当时我在支持 FastMCP 的时候，最大的难关就是 openai 的 chat_completion 带给我的，它的 Tool Call 看得真是让人心力交瘁。后面我直接把 FastMCP 砍掉了，心情大爽。

但是，`responses` 就真的设计好了吗？数据结构真的就校验干净了吗？我不信。我对 openai 充满了不信任感，他们以往各种粗糙的、不讲理的、混乱无秩序的做派让我感觉这就是一个草台班子。

## Anthropic Message 和我们桌宠目前用的 Chat Completion 在 Tool Stream token 之间的区别。

### 边说边做的困惑

我需要你回答我上面的那个问题。

为什么当时 claude 告诉我， anthropic messages 的设计才能真正满足我需要桌宠边说边做的需求，Openai 的协议只能先全部执行 Tool 然后回复。但是我在实际注入那个 pre_tool_preview plugin 后也看到它能够在执行 Tool 前给出预告。

我忘记实现细节，可能需要你确认: [XnneHangLab](https://github.com/XnneHangLab/XnneHangLab)

:::note[Opus]
**当时那句话半对半错。Anthropic 确实原生就边说边做，但 OpenAI 也不是"做不到"——它是"表达不了多段"。你的插件没有突破协议，它只是用上了协议本来就允许、而模型默认不用的那个字段组合。**

### Anthropic：边说边做是官方例子里的默认行为

[官方流式文档](https://platform.claude.com/docs/en/build-with-claude/streaming)的 tool use 例子，逐字是这样的：

```
content_block_start  index:0  {"type":"text"}
content_block_delta  index:0  "Okay" "," " let" "'s" " check" " the" " weather" ...
content_block_stop   index:0
content_block_start  index:1  {"type":"tool_use","name":"get_weather"}
content_block_delta  index:1  {"type":"input_json_delta","partial_json":"{\"location\":"}
content_block_stop   index:1
message_delta                 {"stop_reason":"tool_use"}
```

**模型自己先说了"好，我来查一下旧金山的天气"，再发 tool_use——没有任何提示词注入。** 这就是你花力气用插件换来的效果，在 Anthropic 那边是文档首例。

而且它的 `content` 是**有序 block 数组**，`index` 就是最终数组下标。web search 那个例子更夸张：`text(0) → server_tool_use(1) → tool_result(2) → text(3) → …` 一路到 `index:17`——**一个 message 里文本和工具真正多段交替**。

### OpenAI：能说一次，但表达不了多段

chat completions 的 assistant message 是 `content`（**一个字符串**）+ `tool_calls`（数组）两个**并列字段**。所以：

- **一段预告 + 一批 tool call → 完全合法。** 你的插件生效不是 hack。
- **说→做→说→做 → 表达不了。** 只有一个 `content` 字符串，没地方放第二段。

还有个更隐蔽的：**顺序信息在回存时丢了。** 流式过程中你确实先收到 `delta.content` 再收到 `delta.tool_calls`（自回归，生成顺序即到达顺序），但组装成 message 之后变成两个平级字段——下一轮模型看到 `{content: "让我截图看看", tool_calls: [...]}`，**结构本身不再告诉它"我是先说后做的"**，只能靠语义猜。Anthropic 的 `index` 是结构性保留的。

### 你的实现（我读了仓库，确认如下）

| 疑问                   | 答案                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 注入在哪                 | `type = "policy"`，`injection_position = "before_tools"`，`priority = 10`。走 `PolicyPlugin.get_prompt_segments()` → `SystemPromptBuilder.build()`，**注入进 system prompt，在 tool 定义之前** |
| 什么时候注入               | `AgentFactory.create_core_with_profile()`，**建 agent 时一次性注入**，不是每轮 hook                                                                                                           |
| 预告时有没有完整 tool schema | **有。** 提示词在 system prompt 里，tools 通过 `stream_with_tools(tools=tools_schema)` 完整传给 API——同一次请求                                                                                     |
| 在第几次 LLM call 预告     | **就是决定调用 tool 的那一次，不是额外一次。** 预告 token 和 tool_call token 来自同一个 completion                                                                                                         |
| 预告在 tool token 前还是后  | **前。** `core.py` 的循环里 `delta.content` 先到、累进 `text_buf` 并直接 `yield` 给用户；`delta.tool_calls` 后到、累进 `tool_calls_buf`                                                                 |
| 能预告几次                | **一轮一次**（只有一个 `content`）。但 `max_rounds = 6`，每轮一次 → **最多 6 段**                                                                                                                    |
| 长链分段预告               | **支持，粒度是"每轮一段"**，不是"一轮内多段"                                                                                                                                                       |

关键那段组装代码，正是"一个 message 同时带预告和 tool_calls"：

```python
assistant_payload = {
    "role": "assistant",
    "content": text_buf or None,   # ← 预告文本落在这里
    "tool_calls": [...],
}
```

所以**你早就在用协议允许的合法组合，只是模型默认不这么干，需要你的提示词把它叫出来。**

### 那"OpenAI 不行"错在哪、对在哪

| | Anthropic Messages | OpenAI Chat Completions |
| --- | --- | --- |
| 一轮内说一次再做 | ✅ 原生默认 | ✅ 可以，但要提示词诱导 |
| 一轮内多段交替 | ✅（server tool 可到 index 17） | ❌ 只有一个 `content` |
| 顺序结构性保留 | ✅ `index` | ❌ 两个平级字段 |
| 跨轮分段预告 | ✅ | ✅（你的 6 轮） |

**对的部分**：Anthropic 是原生行为 + 支持一轮内多段交替，OpenAI 两条都不占。
**错的部分**："OpenAI 只能先全部执行 Tool 然后回复"——不对，它一轮内说一次是协议允许的，你自己的插件就是证据。

真正的差距其实在 **client tool 场景下并不大**（Anthropic 遇到 client tool 也是 `stop_reason: "tool_use"` 收尾，一轮一段）。**多段交替的真正来源是 server tool**——工具在服务端执行，控制权不回客户端，所以能在一个 message 里连着 text→tool→result→text。chat completions 没有 server tool，所以永远做不到。**这也正好是 Responses 补上的那块。**
:::

## pre_tool_preview 在 openai 协议下的限制

okay 我回忆起来了，确实是这样。多段交替表达不了，通常在开头预告一下之后哼哧哼哧就开始干了，如果有第二个 tool 就触发不了。

比如说这样是合法的:

```shell
我来读一下最近的日记。
Tool Call: Read Diary
Tool Result: {...}
我发现 ....
```

但是这样是办不到的：

```shell
我来读一下最近的日记。
Tool Call: Read Diary
Tool Result: {Diary Folder is empty}
我发现 Diary 似乎是空的，让我查看一下最近的记忆。
Tool Call: Read Memory
Tool Result: {...}
我发现...
```

它会是这样：

```shell
我来读一下最近的日记。
Tool Call: Read Diary
Tool Result: {Diary Folder is empty}
Tool Call: Read Memory
Tool Result: {...}
我发现似乎没有日记，...
```

也就是说在第一次预告后用户就会失去感知，如果中途 Tool Chain 超级长，我们也无法再次感知到它具体做了什么。

### 额外了解

我想了解两点。

a. Anthropic Message 和 OpenAI 都是两者严格交替串行吗？即预告的 message token 发完前不会做任何的 Tool Call token 的发送。
b. 为什么 OpenAI 协议不支持交替？是模型输出的限制吗？大多数模型有这样的限制吗？还是说只是纯粹协议写得垃圾了？

:::note[Opus]
**a：是，两家都严格串行，"交替"这个词从一开始就用错了。b：纯协议问题，不是模型限制——而且证据就在 openai 自己的 SDK 类型里。另外你上面那个例子的锅可能不在协议，在你自己的提示词，见最后一节。**

### a. 都是严格串行，没有 token 级交替

**Anthropic**——[官方流式文档](https://platform.claude.com/docs/en/build-with-claude/streaming)把流程写死了：

> A series of content blocks, each of which has a `content_block_start`, one or more `content_block_delta` events, and a `content_block_stop` event.

即 **block 0 收完 `content_block_stop` 才会有 block 1 的 `content_block_start`**。官方例子里 `"Okay, let's check the weather..."` 的最后一个 `text_delta` 到达后，先 `content_block_stop index:0`，才 `content_block_start index:1` 开 `tool_use`。**不存在 `text_delta(0)` 和 `input_json_delta(1)` 混在一起流的情况。**

**OpenAI**——自回归生成，`delta.content` 先到、`delta.tool_calls` 后到，同样串行。

所以准确的说法是：**两家都是 `[文本 token 段][工具 token 段]` 顺序拼接，区别只在能拼几段。**

| | 能拼的形状 |
| --- | --- |
| Anthropic | `[文本][工具][文本][工具]…`（server tool 例子里到 `index:17`） |
| OpenAI chat | `[文本][工具]` —— 就这一组 |

**"交替"应该改叫"分段"。** 你原来的疑问"tool token 和 chat token 交替"想问的其实是分段能力，不是 token 混流——后者两家都没有，也不该有（客户端没法渲染半句话里插一个工具调用）。

### b. 是协议，不是模型——证据在 openai 自己的类型定义里

**证据一：同一个模型，换协议就能多段。** `gpt-5.x` 在 Responses 下 output 是 typed item 数组，`message → function_call → message → function_call` 完全合法；同一个模型走 chat completions 就做不到。**模型没变，协议变了，能力就变了。** 这一条直接排除"模型输出限制"。

**证据二：openai-python 里的不对称，非常刺眼。**

```python
# 出参（模型吐给你的）— chat_completion_message.py
class ChatCompletionMessage(BaseModel):
    content: Optional[str] = None          # ← 一个字符串

# 入参（你回传的）— chat_completion_assistant_message_param.py
ContentArrayOfContentPart: TypeAlias = Union[
    ChatCompletionContentPartTextParam,
    ChatCompletionContentPartRefusalParam,  # ← 只有 text 和 refusal
]
content: Union[str, Iterable[ContentArrayOfContentPart], None]
```

两件事同时成立：

1. **入参侧 assistant content 已经能是数组了，出参侧还是 string。** 数组这个形状在协议里是存在的，只是从没扩展到模型输出侧。
2. **就算是那个数组，成员也只有 `text` 和 `refusal`，没有 tool_call part。** 所以哪怕你手动构造，也放不进一个"文本→工具→文本"的有序序列——`tool_calls` 永远是另一个平级字段。

**这就是问题的根：不是"没做数组"，是"数组里没有工具"。** 顺序信息在协议里没有任何一个位置可以承载。

**证据三：chat completions 是三家里的异类。** Gemini 的 `Content.parts` 也是混合数组，官方文档甚至专门警告：

> the model may return a mix of `functionCall`, `toolCall`, and `toolResponse` parts in a single turn. **Don't assume the `functionCall` will always be the last item in the parts array.**

——这句话等于明说"文本可以排在 functionCall 后面"。Anthropic 有序 blocks、Gemini 有序 parts、Responses 有序 items，**只有 chat completions 是两个平级字段。**

### 那到底是不是"写得垃圾"

**不是垃圾，是没重构的历史包袱。** `content: str` 在 GPT-3.5 时代完全合理——一轮就只可能吐一段文本。2023 年加 function calling 时，**加一个平级 `tool_calls` 字段是向后兼容的，把 `content` 从 string 改成有序数组不是**——那会炸掉当时所有读 `choices[0].message.content` 的客户端。

于是就锁死了：多模态输入侧后来补了数组（因为那是新字段、新形状），输出侧永远是 string。**Responses 之所以要另起一个端点而不是给 chat completions 加参数，根本原因就在这——这个改动没法兼容，只能换协议。** 这也回过头解释了[前面那节](#codex-cli-为什么要砍掉-chat-completions)codex 为什么必须硬删而不是软兼容。

### 最后：你上面那个例子，锅可能在你自己

你说"第一次预告后用户就失去感知"。但**跨轮不受多段限制**——第二轮的 assistant message 有自己的 `content` 字段，再预告一次完全合法：

```
round 1: {content: "我来读一下日记。", tool_calls: [read_diary]}
round 2: {content: "日记是空的，我查一下记忆。", tool_calls: [read_memory]}   ← 协议完全允许
round 3: {content: "我发现…"}
```

那为什么没发生？看你自己 `pre_tool_preview` 注入的第五条：

> **"如果是本轮首次工具调用**，且用户能够感知等待，优先输出这条前置说明。"

**"本轮首次"这四个字，模型很可能理解成了"一个用户 turn 里只预告一次"。** 你观察到的行为和这条提示词高度吻合。

建议先做个对照实验：把那句改成"**每次**发起工具调用前都输出前置说明；如果与上一条重复则换个说法"，看看第二段预告会不会出现。**如果出现了，说明你的长链失声是提示词写的，不是协议限制——这比协议问题好修一万倍。**

（顺带修正上一节的表述：那里说"一轮一次、最多 6 段"是对的，`max_rounds = 6` 给了你 6 段预算；真正卡住你的不是段数上限，是这条提示词把预算用掉了 1 段就停了。）
:::

### 卧槽！

噢我终于搞懂了，也就是说我一直以来只能看到一段预告是因为我自己的提示词！

并且，openai 协议在 tool loop 里其实每段 tool call 都算独立且都能携带一个预告消息？

这对我非常重要，也就是我后续要追求的工程上消除长 tool 链静默的问题。原本我打算把一条 tool 链 break down 到多步，但现在看起来似乎不用了！

是这样的吗？

也就是说我只要改善提示词，并加上一些护栏就可以了。不用搞很复杂的实现？


:::note[Opus]
**大方向对，但先别急着高兴——有三处必须校准，其中第二处是我的责任。**

### 修正一：是"每轮一个"，不是"每个 tool 一个"

你的 `core.py` 里这两行说明问题：

```python
max_rounds = 6                                    # 503
*(_exec_tool(tc, ...) for tc in ordered_tool_calls)   # 606，并行执行
```

**一轮（一次 LLM call）里模型可以一次吐出 N 个 tool_calls，你并发跑掉。** 这一轮只有一个 `content` 字段 → **N 个工具共享 1 条预告**。

所以准确说法是：**预告的粒度是「每次 LLM call 一条」，不是「每个 tool 一条」。**

要一对一，得把 `parallel_tool_calls: false` 传给 API（chat completions 的标准参数，openai-python 里有类型）。但这是拿延迟换感知——本来并行 3 个工具 5 秒，串行就变 15 秒。**大多数情况不值，一条预告覆盖"我要同时查日记和记忆"完全够用。**

### 修正二：我那个诊断是假设，不是结论

上一节我说"锅在你的提示词"，那是**读代码得出的高置信度推断，我没有跑过你的 agent**。别把它当已验证事实——**请务必先跑对照实验**。

而且即使提示词改了，还有第二个阻力：**模型本身在拿到 tool_result 之后就是倾向于直奔下一个 tool call**。这个倾向的可塑性因模型而异，你桌宠上跑的那些（deepseek / grok 一类）比 frontier 模型更硬。

所以现实预期是：**改提示词 → 大概率有明显改善，但不一定每轮都稳定出现。** 做好"部分生效"的心理准备，别一次改完就当解决了。

### 修正三：预告消不掉 tool 执行本身的静默

这条最容易被忽略。预告覆盖的是 **LLM 决定调工具 → 工具开始跑** 这个瞬间，**不是工具执行那 3-5 秒**。

所以真实效果是：

```
改之前： [说一句] ────静默 30 秒──── [回答]
改之后： [说一句]─静默5s─[说一句]─静默5s─[说一句]─静默5s─[回答]
```

**是把一段长静默切成若干段短静默，不是消除静默。** 体感改善巨大，但如果单个工具本身要跑 10 秒，那 10 秒依然是哑的——那部分只能靠你自己 UI 层的进度反馈（转圈、"正在读取…"），协议给不了。

### 那还要不要拆多步

**如果目的只是消静默——不用拆。** 你原本想的 break down 是在用工程手段模拟协议本来就有的能力，属于白干。

**但有个硬上限要注意：`max_rounds = 6`。** 长链一旦超过 6 轮就被你自己截断了。如果你要追求"长 tool 链不静默"，先把这个数调上去，否则预告能力再好也只有 6 段预算。

### 一个具体的提示词形状

别只写"调用前预告"，让每轮那句话**同时收尾上一步、预告下一步**——这正好就是你想要的形状：

> 每次发起工具调用前都先说一句话。如果这不是本轮第一次调用工具，这句话要同时做两件事：用半句话说明上一步的结果，再说明接下来要做什么。不要重复上一条的措辞。

对应的输出就是你写的那个理想例子：

```
我来读一下最近的日记。          ← 纯预告
[Read Diary] → 空
日记是空的，我查一下记忆。      ← 收尾 + 预告，一句话两件事
[Read Memory] → ...
我发现...                       ← 收尾
```

**这个形状比"每步都预告"更自然，也更省 token——用户拿到的是连贯叙述，不是六条"让我看看…"的复读。**
:::

## 真假边说边做

我懂了，但，我又有点看不懂 Claude 在此之外的优势是什么？

两者都是严格串行的，那好像没什么区别了？能不能跟我讲讲，什么是真正的边说边做（Anthropic），什么是假的边说边做 (OpenAI)？

毕竟在我看来能做到上面那个程度已经是很完整了。

:::note[Opus]
**先纠一个框架错误：真假的分界线不是 Anthropic vs OpenAI，是 server tool vs client tool。而按这条线划，你桌宠的场景无论换哪家协议都拿不到"真"的那一档——所以答案对你是个坏消息，但省了你一次迁移。**

### 假的：分段说，每段一次完整往返

chat completions 的多段是**客户端循环缝出来的**：

```
HTTP 请求 1 ──> [预告] [tool_calls]        ← 连接结束，控制权回到你
   你本地执行工具
HTTP 请求 2 ──> [收尾+预告] [tool_calls]   ← 全量历史重传，重新 TTFT
   你本地执行工具
HTTP 请求 3 ──> [最终回答]
```

用户看到的是连贯叙述，底下是 **3 次请求、3 次全量上下文提交、3 次首字延迟**。它是「**分段说**」，不是「边说边做」——每一段之间，模型其实已经下班了。

### 真的：一条流里说做说做，控制权不回客户端

Anthropic 的 **server tool**（`web_search` / `code_execution` / MCP connector）在 Anthropic 服务端执行。官方文档那个 web search 流式例子是这样的：

```
content_block_start index:0   text          "I'll check the current weather in NYC for you."
content_block_start index:1   server_tool_use   web_search
content_block_start index:2   web_search_tool_result   ← 服务端跑完直接塞回来
content_block_start index:3   text          "Here's the current weather..."
...
content_block_stop  index:17
message_stop                                  ← 从头到尾，一次 HTTP
```

**一次请求、一条 SSE 流、17 个 block。** 中间没有任何一刻控制权回到客户端。这才是字面意义上的「边说边做」——**说的同时事情正在发生，中间没有断点。**

### 诚实的部分：Anthropic 的 client tool 也是假的

你用 Anthropic 定义自己的 `get_weather`？照样 `stop_reason: "tool_use"` 收尾、照样回客户端、照样重新握手。**和 OpenAI 一模一样。**

所以正确的分界线是：

| | 一次请求内多段 | 需要客户端循环 |
| --- | --- | --- |
| Anthropic server tool | ✅ 真 | ❌ |
| **OpenAI Responses server tool** | ✅ 真 | ❌ |
| Anthropic client tool | ❌ 假 | ✅ |
| OpenAI chat completions（只有 client tool） | ❌ 假 | ✅ |

**注意第二行。** Responses 也有 server tool（`web_search` / `code_interpreter` / remote MCP），也能做到真的。所以这从来不是"Claude 更强"，是 **chat completions 是四格里唯一连门都没有的那个**。

### 对你桌宠的意义（这条最重要）

你的工具是**截图、读日记、读记忆**——全部必须在你本地机器上执行。**它们永远是 client tool。**

**所以"真边说边做"这一档，你换 Anthropic 拿不到，换 Responses 也拿不到。** 不是协议不给，是你的工具物理上跑在用户电脑里，控制权必须回来。

那 Anthropic 相对 chat completions 还剩什么优势？只有两条：

1. **默认行为更好**——不用写 `pre_tool_preview`，模型自己就先说再做
2. **一轮内文本-工具的顺序是结构化的**（`index`），不用靠"content 总在 tool_calls 前"这个约定

**这两条都不值得为它迁移。** 第一条你已经用提示词解决了；第二条你在自己的客户端里，约定和保证没实质差别。

### 顺带把"握手"这个词精确化

你一直担心"多次握手带来的首字延迟"。但**多轮往返里通常不重新握 TCP/TLS**——`openai-python` 底下是 httpx 共享 client，连接是 keep-alive 复用的。

每轮的真实成本是：

- **全量上下文重新提交**（token 花销，被 prompt cache 抵掉大部分）
- **服务端重新 prefill**（同样被 cache 抵掉）
- **TTFT**（首 token 延迟）——**这个每轮都真实存在，抵不掉**

所以"六轮 tool 链"的延迟主要来自 **6 × TTFT + 6 × 工具执行时间**，不是 6 次握手。你室友说的"Responses 支持长连接能省首字延迟"能不能成立，我们留到[那一问](#为什么我的-pre_tool_preview-可以生效它的限制是什么)一起看——但先记住：**你要省的是 TTFT，不是握手。**
:::

okay 果然如我所料，两者没有什么区别了，能够做成那样就已经是极限了，如果不保持长连接。

okay 大困惑又 -1，念头通达 +1。
