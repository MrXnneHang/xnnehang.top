---
title: 'The Shape of a Protocol Determines Its Capabilities: Why Codex Removed chat_completion, and What Actually Blocks a Desktop Companion from Talking While It Works'
published: 2026-07-28
description: "From Codex's hard removal of chat/completions to the migration damage it caused in new-api, this examines the real tool-flow differences between Anthropic Messages and OpenAI protocols—why my long-chain silence is not the protocol's fault, and what truly counts as talking while working."
tags:
  - LLM
  - Agent
  - OpenAI
  - Anthropic
  - Protocol
  - Tool Call
category: Learning as I Build
featured: true
series:
  - LLM
lang: en
translationKey: resposne-vs-chat_completion
---

![](../../assets/img/covers/18409210202869120.jpg)

## Preface

Today, let us talk a little about transport protocols.

The common ones are:

- `Chat Completion`: /v1/chat/completions
- `Responses`: /v1/responses
- `Claude Response`: /v1/messages

`XnneHangLab` has always used `chat_completion`.

The reason is simple: `chat_completion` is what normal users and I encounter. Early versions of newapi did not support Responses; it seems support only arrived in versions released after May this year. Platforms such as DeepSeek also expose only the Completion endpoint, which is rather unfortunate. When I wanted to find a proper Responses endpoint to test a newer codex-cli, I could not find one.

> P.S. In everyday use, the recent ds-v4-flash has already shown Doubao-like low intelligence and a tendency for its two halves to argue with each other. Even simple instructions need several attempts. I am already planning to replace it completely with grok-4.5 for the assistance work in Obsidian-YOLO.<br>
> I do not know whether it has been dumbed down, but for me the easiest way to judge a model's intelligence is to have it review code. Compared with gpt-5.6-sol and grok-4.5, deepseek-v4-flash code reviews belong to the group that makes you want to drool. Its multi-step reasoning and deep thinking are a mess, and it considers things far too narrowly.<br>
> The only thing worth praising is DeepSeek's post-training, which makes it sound more human. It can only really be used for role-playing conversations. But when will image understanding finally arrive in the API? The web client has had it for more than a month already.

I wanted to investigate this because, while testing memu-cli integration with codex-cli, I found that newer versions (>0.95) had directly removed `Chat Completion` and moved to `Response`.

## Questions to Discuss

### The Difference Between chat_completion and responses, and the Value of Migrating

Let us look at why codex-cli did this—perhaps beginning with issues in the official Codex repository.

And distinguish the main differences and the value of migrating: what benefits, if any, would it bring to XnneHangLab?

### The Difference Between Anthropic Messages and OpenAI's Streaming Tool Responses

And let us recall a question I left in an earlier ramble:

```shell
Can we investigate why the Anthropic protocol supports alternating tool tokens and chat tokens, while OpenAI can only do tools first and chat afterward, yet prompt injection seems able to make it announce the tool it will execute?

Does it have the complete tool schema when it announces this? In which LLM call does that announcement happen?
```

This may not be precise enough. The scenario was this:

Once we added ToolCall to a desktop-companion setting, a ToolCall not only brought an extra LLM call, but often took a while to execute. The tool result then had to be sent back to the LLM for a reply. Perceptually, that added five or six seconds of response latency, and the model appeared unusually `silent` during it.

At the time, I added a policy-level prompt-injection plugin: [pre_tool_preview](https://github.com/XnneHangLab/XnneHangLab/blob/dev/src/lab/plugins/pre_tool_preview/plugin.toml).

It roughly tells the model: if you are about to execute a tool, verbally announce what you are going to do first.

Afterward, the model did indeed give short previews such as `Let me take a screenshot and see what you are doing?` and `Let me look through your recent diary entries` before doing things.

The overall effect was good. It softened the deathlike silence that had been there before.

### Why Does My pre_tool_preview Work? What Are Its Limits?

I have partly forgotten the exact implementation and need to verify it again. I also need a token-level `streaming token` demonstration: how the tokens are ordered, whether the preview occurs before or after tool tokens, why it can preview, then execute, then answer, and how many LLM Tool Calls lie in between.

How many times can it preview? Does it support staged previews in a long tool-call chain?

If I migrate to Responses, will this feature carry over? Will Responses change the returned token stream?

My roommate also says Responses supports long connections. Is that true? Could it remove the first-token delay caused by handshakes in desktop-companion conversations?

And why did I once say Anthropic supports talking while working while OpenAI does not? What is different about their streaming token flows?

### How Can an Agent Talk While Working in Engineering Terms?

We know that pre_tool_preview is probably only the most basic approach.

In engineering practice, some Agents support long ToolCall chains, such as [Obsidian-yolo](https://github.com/Lapis0x0/obsidian-yolo).

This seems to involve high-frequency ToolCalls and feedback. How are their prompts written? How do they get the model to support long chained exchanges? It appears to contradict my earliest understanding of chat_completion, because there seem to be no repeated handshakes in the middle.

When do repeated handshakes mostly happen?

---

Those are roughly the questions. Next, let us ask Teacher Fable or Teacher Opus. Please do not answer only from your own knowledge; many of these details need evidence. Ideally, use issues from the codex or newapi repositories and documentation from Anthropic and OpenAI.

## Why codex-cli Removed Chat Completions

Why did codex-cli remove chat_completion?

I had always used it without issue. Codex-cli directly removed support for the protocol, and the benefit looked substantial.

Codex itself is open source. This question requires not only comparing the protocols, but more importantly tracking community issues, discussions, and pull requests—as well as related issues and PRs in the newapi community.

I need to understand the full process from beginning to end. Why was the decision made? Was it unilateral or community-driven? How much community support did it have?

:::note[Opus]
**Conclusion: this was a protocol shutdown with an announcement, a deprecation period, and a hard-removal PR. It was executed unilaterally, with zero community support. The stated reason was maintenance cost; the real reason was that Codex's new feature primitives only fit in Responses. Your “>0.95” is as precise as it gets—it was `rust-v0.95.0`.**

### Timeline

| Date       | Event                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-12-09 | Official deprecation announcement: [codex#7782](https://github.com/openai/codex/discussions/7782) (`etraut-openai`)                      |
| 2025-12-11 | Runtime warning added for `wire_api = "chat"`: [codex#7897](https://github.com/openai/codex/pull/7897)                                   |
| 2026-02-03 | Hard-removal PR: **`chore: nuke chat/completions API`**, [codex#10157](https://github.com/openai/codex/pull/10157), 49 files, +268/−2931 |
| 2026-02-04 | First release containing that commit: **`rust-v0.95.0`**                                                                                 |

The compare API confirms that `d2394a24...rust-v0.95.0` is `ahead`, while `...rust-v0.94.0` is `diverged`. **0.94 could still use chat; starting with 0.95, it could not.**

### Unilateral or Community Decision?

The announcement's reaction distribution was **👎 85 / 😕 10 / 🚀 2 / 👍 0**, with 21 upvotes and 11 comments. It was categorized as `General`, not a poll, and had no selected answer. The wording was not consultative: “the Codex team **is** deprecating” and “Full removal **is slated for** early February 2026.” The removal PR had an empty body, zero review comments, and merged in five days. Afterwards, [codex#31083](https://github.com/openai/codex/issues/31083) proposed restoring the option with a feature flag; it received zero reactions and no response.

**Zero likes and eighty-five dislikes, and it proceeded anyway.** But do not rush to criticize—the announcement's disclaimer explains everything:

> **The vast majority of Codex users are unaffected by this change.** If you are using OpenAI-hosted models with a default Codex configuration, you are already using the `responses` API.

**The people voting and the people paying are not the same group.** Those eighty-five dislikes mostly came from local-model and third-party gateway users. The lesson for you is this: Codex being open source does not mean it promises protocol compatibility. **“Upstream can unilaterally delete an entire protocol path at any time” should be a design assumption.**

### Official Reason vs. the Real Reason

The announcement cites maintenance cost:

> the `chat/completions` API has **increasingly hampered our ability to improve Codex**... added complexity, introduced regressions, and increased support overhead.

But the harder reason is expressive power. **Chat is message-centered**—everything is forced into `role`, `content`, and `tool_calls`—while **Responses is item-centered**: an ordered list of parallel items, where `reasoning`, `function_call`, `message`, and `web_search_call` are independent, first-class entries. Later additions to Codex simply have nowhere to go in chat: `agent_message` ([#33551](https://github.com/openai/codex/issues/33551)), MCP tools with `type: "namespace"` ([#23186](https://github.com/openai/codex/issues/23186)), and encrypted task delegation ([#34833](https://github.com/openai/codex/issues/34833)).

The most candid evidence is the current `WireApi` enum: **only one member remains**. The configuration option survives, but it no longer represents a choice:

```json
"WireApi": {
  "oneOf": [{ "enum": ["responses"], "type": "string" }]
}
```

The [official migration documentation](https://developers.openai.com/api/docs/guides/migrate-to-responses) claims the following benefits—**self-reported, without third-party reproduction**: +3% on SWE-bench, **40%–80% better cache utilization**, `store: true` preserving reasoning across turns, and optional encrypted reasoning. The cache point is important: Codex has the classic long-context, repeated-prefix workload, so a cache hit directly becomes money.

### What Happened to new-api

(First, filter out noise: all those new-api PRs prefixed `[codex]` are maintainers **using Codex to write code**, not compatibility work.)

| Category                           | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cache passthrough broke**        | [#3389](https://github.com/QuantumNous/new-api/issues/3389) measured direct versus proxied calls: uncached input was **11.74x**, cached input fell to only **9.16%**, and output was only 43.87%; [#3309](https://github.com/QuantumNous/new-api/issues/3309) could not recognize cache fields in nonstandard positions.                                                                                                                                                |
| **New encrypted-reasoning errors** | [#3240](https://github.com/QuantumNous/new-api/issues/3240): `invalid_encrypted_content`; channel affinity through `prompt_cache_key` was insufficient, and LiteLLM's `encrypted_content_affinity` was needed. **Still open.**                                                                                                                                                                                                                                          |
| **Lossy fallback channels**        | [#5209](https://github.com/QuantumNous/new-api/pull/5209) was the “support only arrived around May” change you remembered. But it drops MCP tools ([#5938](https://github.com/QuantumNous/new-api/issues/5938)), `reasoning_content` ([#6396](https://github.com/QuantumNous/new-api/issues/6396)), reasoning summaries ([#6449](https://github.com/QuantumNous/new-api/pull/6449)), and `include_usage` ([#6149](https://github.com/QuantumNous/new-api/issues/6149)). |
| **Engineering debris**             | SSE without `Content-Type` ([#6075](https://github.com/QuantumNous/new-api/issues/6075)), zstd decompression ([#6313](https://github.com/QuantumNous/new-api/issues/6313)), OOM ([#5698](https://github.com/QuantumNous/new-api/issues/5698)), channel affinity blocking failover ([#4541](https://github.com/QuantumNous/new-api/issues/4541)), and private endpoint `/v1/alpha/search` ([#6114](https://github.com/QuantumNous/new-api/issues/6114)).                 |

Two important points. First, **encrypted reasoning makes load balancing stateful**: the context now contains an owned, non-movable blob, which did not exist in the chat era. Second, and more importantly for you:

> **Fallback channels lose exactly the reasoning and tool metadata you want to observe in later token flows.** Before demonstrating streaming tokens, verify whether you are using a native Responses upstream or newapi's fallback channel. Otherwise, the alternation you see is gateway-translated, not the model's actual output.

Most of these issues remain **open**. It is not that newapi is not trying; `/v1/responses` has a surface area an order of magnitude larger than `/v1/chat/completions`: state, encryption, item ordering, lifecycle events, and private endpoints all need reimplementation.

### One-Sentence Version

**Officially, legacy support slows development; in the code, only Responses can contain the new features; commercially, affected users are not paying customers. Three statements, one irreversible action. For XnneHangLab, the question is not whether to migrate: the gateway has already migrated half of it for you, and it loses exactly the information you most want to investigate while translating.**
:::

### A Summary and Another Complaint About OpenAI

Okay, then this part is clear.

OpenAI simply did not want to maintain two sets of logic in Codex (`chat_completion` and `responses`), so it unilaterally removed the `chat` interface for more agile development and faster iteration. It cut off the people who do not directly pay OpenAI—the users of third-party model providers—and was criticized by the community for a long time.

But it also seems internally contradictory. It removed `chat_completion`, then recently merged the ChatGPT and Codex clients into an architecture like Claude Desktop.

Earlier, we discussed [[Learning from Bad Architecture: What Claude Desktop's Five Scheduling Systems Reveal About Separating Cowork and Code]]. This architecture makes maintenance costs rise geometrically; separate maintenance is much better than merging everything together. Recently, during host adaptation for memU, both Claude Desktop and Codex Desktop showed terrible adaptability because of the strange sandboxes and low shell permissions of their Cowork and Chat modes.

The first move looks like a pursuit of technical cleanliness, and the next turns the architecture into a pile of mess. (Perhaps the code is not all maintained in the official Codex repository; maybe the core is maintained separately, like Claude Code, with the desktop client separate.)

It is probably all driven by commercialization, yet I do not understand the pursuit or the decisions.

OpenAI is always like this: it likes doing two things at once instead of doing one thing well. While updating GPT models, it splits off `codex` models, then `o1`, `o2`, and `o3`; later it throws away Codex and focuses only on GPT. The naming is also chaotic, as if it names things whenever it feels like it. Versions 5.1, 5.2, 5.3, and 5.4 update at a frantic pace, but after all of that most people felt 5.2 was best. 5.4 speaks like a machine and has high information redundancy; it is messy enough that an ADHD reader can finish a long paragraph without absorbing a sentence.

Claude, by contrast, has consistently pursued mathematics, coding, and logic. Its naming and iteration are rigorous and romantic, drawn from Greek mythology. And when a name changes, it is a real major update—for example, Fable.

At present, GPT has only 5.6 sol and terra that I find usable. Below 5.6, there is confusion, disorder, and a lack of trust.

I do not understand OpenAI. I do not understand how it can play such a strong hand so badly. I do not understand Codex either. Perhaps its own employees do not, which is why everyone recommends connecting 5.6 to Claude Code for the best experience XD.

### What to Watch: There Is No Migration Value Yet, Only Migration Risk

What we care about more is the value of migrating.

But it appears newapi's native Responses support and translation are currently poor, with much technical debt. It only makes sure replies can get through without error; almost none of the real features are preserved. Instead, quite a few things are stripped away.

Most people currently cannot reach a true Responses API. In other words, continuing to use `chat_completion` is best for us. newapi's support for it has matured for more than three years; there is no need to gamble on switching to `responses`.

## What Is the Real Difference Between responses and chat_completion?

Earlier, Responses seemed to support things like `store=true`, which could hit caches across turns and preserve reasoning. Is the main optimization point only better cache hits, or is there more?

:::note[Opus]
**Far more. And caching is not “a feature”; it is a byproduct of the other changes. Reversing that causal relationship makes it impossible to see what this protocol transition actually changed.**

### A Table That Covers It

| Dimension               | Chat Completions                                | Responses                                                                                                |
| ----------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Endpoint                | `/v1/chat/completions`                          | `/v1/responses`                                                                                          |
| Input                   | `messages` array                                | `input` (string or Item array) plus top-level `instructions`                                             |
| Output                  | `choices[0].message.content`                    | **`output`**: an ordered array of typed Items, each with its own `id`                                    |
| Tool definitions        | Nested `{type:"function", function:{name,...}}` | Flat `{type:"function", name:...}`                                                                       |
| Tool results            | Put back into `messages`                        | Separate Items, linked by `call_id`                                                                      |
| strict                  | Off by default                                  | **On by default**; use `strict:false` only for incompatibility                                           |
| Structured output       | `response_format`                               | `text.format`                                                                                            |
| Built-in tools          | None                                            | `web_search` / `file_search` / `tool_search` / `code_interpreter` / **remote MCP**                       |
| Multi-turn              | Manually resend all `messages` each turn        | `previous_response_id` or a `conversation` object                                                        |
| State                   | None                                            | `store` (stored for 30 days by default; can be disabled)                                                 |
| reasoning               | Discarded                                       | **Native `reasoning` Items**, including `encrypted_content`                                              |
| Streaming               | Opaque `delta` chunks                           | **Semantic events**: `response.output_item.added` / `response.output_text.delta` / `response.completed`… |
| Async                   | None                                            | `background: true` plus polling                                                                          |
| Resume after disconnect | None                                            | `starting_after` cursor (SDK support “coming soon”)                                                      |

### Only Four Points Really Matter

**1. `output` is a typed Item array—the root of every other difference.**

In chat, the result of a turn must be flattened into the three slots `role`, `content`, and `tool_calls`. In Responses, it is a sequence of peer entries, each with an ID and lifecycle. The earlier `agent_message`, `namespace` tools, and encrypted task delegation do not fit in chat for this exact reason.

**2. Hosted tools run on the server, and a single request can call tools continuously.**

The documentation says the model “automatically decides whether to use a configured tool,” and “Some advanced workflows can also load more tool definitions during the interaction” (`tool_search`, GPT-5.4+ only). **This directly answers the later question of why a long ToolCall chain can appear not to involve repeated handshakes**: for built-in tools, it does not, because control never returns to the client. Your own function tools must still return to the client, and that distinction is crucial.

**3. Reasoning Items survive across turns; cache gains are a side effect.**

For stateless calls, the documentation requires you to “preserve **every** item in the response's `output` array.” Why can cache utilization improve by 40%–80%? Not because a cache was added, but because **the prefix becomes stable**: chat manually rebuilds `messages` every turn and loses reasoning, so the prefix changes constantly; Responses continues with `previous_response_id` and preserves reasoning as-is, making the prefix a chain that only grows. The +3% SWE-bench score follows for the same reason: reasoning is no longer cut off, not because of caching.

**4. Streaming changes from a black box to a white box.**

Chat SSE is just a sequence of `delta`s, so you must infer whether a segment is text or tool arguments. Responses events include a `type`: `output_item.added` explicitly tells you a new reasoning, message, or function_call Item has begun. **The token-level demonstration you want is directly readable in Responses; in chat, it must be inferred.** This may be more valuable to your later questions than caching is.

### But the Conclusion Does Not Change

I would not revise the earlier recommendation: **do not migrate yet.** What you can actually use from those four points depends on the middle hop, and newapi's fallback channel loses reasoning Items and tool metadata ([#6396](https://github.com/QuantumNous/new-api/issues/6396) / [#6449](https://github.com/QuantumNous/new-api/pull/6449) / [#5938](https://github.com/QuantumNous/new-api/issues/5938)). **You would spend effort migrating only to receive a Responses shell translated back into chat semantics, with none of the four benefits intact.**

What is worth recording is the **condition that should trigger migration**, not migration itself: when you can reach a native Responses upstream without fallback translation, point 4 (semantic streaming) and point 2 (server-side tool chains) become what your desktop companion actually needs. Cache is the least compelling reason to migrate.
:::

### Complaining Again

I think I understand.

It turns the very strange data structure of `choices[0].message.content` into a white box that looks like something Pydantic can validate. It also replaces the many `type unknown` errors I used to get while writing streaming code with native support.

When I first encountered the OpenAI library, I wondered how a PyPI package used by so many people could be full of pyright errors and require so many `type:ignore`s. Its type enforcement was a complete mess. Looking at only a short code fragment, you often could not know what it returned because every possible kind of content was wrapped in the shell of `content`.

How can such a large company design data structures so carelessly?

When I supported FastMCP, the biggest obstacle came from OpenAI's chat_completion. Its ToolCall handling was exhausting to read. Later, I removed FastMCP entirely, and it felt wonderful.

But is `responses` really designed well? Is its data structure actually cleanly validated? I do not believe it. I have too much distrust of OpenAI. Its past roughness, unreasonableness, and chaotic disorder make it feel like an amateur troupe.

## The Difference Between Anthropic Messages and the Chat Completion Tool Stream Used by My Desktop Companion

### The Confusion Around Talking While Working

I need an answer to the question above.

Why did Claude once tell me that only Anthropic Messages could truly meet my desktop companion's need to talk while working, while OpenAI could only execute all tools and reply afterward? In practice, after injecting the pre_tool_preview plugin, I saw it give a preview before executing a tool.

I have forgotten the implementation details and may need to confirm them: [XnneHangLab](https://github.com/XnneHangLab/XnneHangLab).

:::note[Opus]
**That earlier statement was half right and half wrong. Anthropic does natively talk while working, but OpenAI is not “unable to do it”—it is “unable to express multiple segments.” Your plugin did not break through the protocol; it used a field combination the protocol already permits but models do not normally choose.**

### Anthropic: Talking While Working Is the Default in the Official Example

The [official streaming documentation](https://platform.claude.com/docs/en/build-with-claude/streaming) gives this tool-use example verbatim:

```
content_block_start  index:0  {"type":"text"}
content_block_delta  index:0  "Okay" "," " let" "'s" " check" " the" " weather" ...
content_block_stop   index:0
content_block_start  index:1  {"type":"tool_use","name":"get_weather"}
content_block_delta  index:1  {"type":"input_json_delta","partial_json":"{\"location\":"}
content_block_stop   index:1
message_delta                 {"stop_reason":"tool_use"}
```

**The model itself says “Okay, let me check the weather in San Francisco” first, then emits `tool_use`—without prompt injection.** What you gained through a plugin is the first documented example on Anthropic's side.

Its `content` is also an **ordered array of blocks**, where `index` is the final array position. The web-search example is even more extreme: `text(0) → server_tool_use(1) → tool_result(2) → text(3) → …`, continuing to `index:17`. **Text and tools genuinely alternate in multiple segments within one message.**

### OpenAI: It Can Speak Once, but Cannot Express Multiple Segments

An assistant message in chat completions has `content`—a **single string**—and a `tool_calls` array as two **parallel fields**. Therefore:

- **One preview plus a batch of tool calls is completely valid.** Your plugin working is not a hack.
- **Speak → work → speak → work cannot be expressed.** There is only one `content` string, with nowhere to place a second segment.

There is a subtler point: **ordering information is lost when the message is saved back.** During streaming, you really receive `delta.content` before `delta.tool_calls`—autoregressive generation means generation order is arrival order. But once assembled, it becomes two parallel fields. In the next turn, the model sees `{content: "Let me take a screenshot", tool_calls: [...]}`. **The structure itself no longer says “I spoke first, then acted”;** it can only infer that semantically. Anthropic's `index` preserves it structurally.

### Your Implementation: Confirmed from the Repository

| Question                                        | Answer                                                                                                                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where is the injection?                         | `type = "policy"`, `injection_position = "before_tools"`, `priority = 10`. It goes through `PolicyPlugin.get_prompt_segments()` → `SystemPromptBuilder.build()`, **into the system prompt before tool definitions**. |
| When is it injected?                            | Once when creating the agent through `AgentFactory.create_core_with_profile()`, **not as a hook every turn**.                                                                                                        |
| Does the preview have the full tool schema?     | **Yes.** The prompt is in the system prompt, while tools are passed in full through `stream_with_tools(tools=tools_schema)` in the same API request.                                                                 |
| Which LLM call makes the preview?               | **The same call that decides to call the tool, not an extra call.** Preview tokens and tool_call tokens come from the same completion.                                                                               |
| Are preview tokens before or after tool tokens? | **Before.** In the `core.py` loop, `delta.content` arrives first, accumulates into `text_buf`, and is yielded directly to the user; `delta.tool_calls` arrives later and accumulates in `tool_calls_buf`.            |
| How many previews can it make?                  | **One per round** because there is only one `content`. With `max_rounds = 6`, it can make **up to six segments**.                                                                                                    |
| Are staged previews in a long chain supported?  | **Yes, at one segment per round**, not multiple segments within a single round.                                                                                                                                      |

The key assembly code is exactly the “one message carrying both a preview and tool_calls” combination:

```python
assistant_payload = {
    "role": "assistant",
    "content": text_buf or None,   # ← preview text goes here
    "tool_calls": [...],
}
```

So **you were already using a valid combination allowed by the protocol. Models simply do not do it by default; your prompt calls that behavior forth.**

### Where “OpenAI Cannot” Is Wrong and Right

|                                        | Anthropic Messages                        | OpenAI Chat Completions                |
| -------------------------------------- | ----------------------------------------- | -------------------------------------- |
| Speak once, then act, within one round | ✅ Native default                         | ✅ Possible, but needs prompt guidance |
| Multiple segments within one round     | ✅ (server-tool example reaches index 17) | ❌ Only one `content`                  |
| Ordering preserved structurally        | ✅ `index`                                | ❌ Two parallel fields                 |
| Staged previews across rounds          | ✅                                        | ✅ (your six rounds)                   |

**The right part**: Anthropic is native behavior and supports multiple segments within a round; OpenAI has neither.
**The wrong part**: “OpenAI can only execute all tools and reply afterward.” No: one spoken preview per round is protocol-legal, and your plugin proves it.

The real gap is **small in client-tool scenarios**. When Anthropic encounters a client tool, it also ends with `stop_reason: "tool_use"`, returns to the client, and produces one segment per round. The source of true multiple alternations is **server tools**: tools run on the server, control never returns to the client, and one message can proceed text → tool → result → text. Chat completions has no server tools, so it can never do this. **That is exactly the gap Responses fills.**
:::

## The Limits of pre_tool_preview Under the OpenAI Protocol

Okay, I remember. That is indeed how it worked. Multiple segments cannot be expressed: after one preview at the beginning, it gets to work in silence, and if a second tool is needed it cannot preview again.

For example, this is legal:

```shell
Let me read the recent diary.
Tool Call: Read Diary
Tool Result: {...}
I found ...
```

But this cannot be done:

```shell
Let me read the recent diary.
Tool Call: Read Diary
Tool Result: {Diary Folder is empty}
The Diary seems empty; let me check recent memories.
Tool Call: Read Memory
Tool Result: {...}
I found...
```

Instead, it becomes:

```shell
Let me read the recent diary.
Tool Call: Read Diary
Tool Result: {Diary Folder is empty}
Tool Call: Read Memory
Tool Result: {...}
I found there seems to be no diary, ...
```

That means users lose awareness after the first preview. If the tool chain becomes extremely long, we cannot perceive what it is doing midway through.

### Additional Questions

I want to understand two things.

1. Do Anthropic Messages and OpenAI both strictly alternate in sequence? In other words, will no ToolCall token be sent before all preview message tokens are complete?
2. Why does the OpenAI protocol not support alternation? Is this a limitation of model output? Do most models have it, or is the protocol simply badly designed?

:::note[Opus]
**a: Yes. Both are strictly serial; “alternation” was the wrong word from the start. b: This is purely a protocol problem, not a model limitation—and the evidence is in OpenAI's own SDK types. Also, the behavior in your example may be caused by your prompt rather than the protocol; see the final section.**

### a. Both Are Strictly Serial; There Is No Token-Level Interleaving

**Anthropic**: the [official streaming documentation](https://platform.claude.com/docs/en/build-with-claude/streaming) defines the flow strictly:

> A series of content blocks, each of which has a `content_block_start`, one or more `content_block_delta` events, and a `content_block_stop` event.

That means **block 0 must finish with `content_block_stop` before block 1 can start with `content_block_start`**. In the official example, the final `text_delta` from “Okay, let's check the weather...” arrives, then `content_block_stop index:0`, and only then does `content_block_start index:1` begin the `tool_use`. **There is no mixing of `text_delta(0)` and `input_json_delta(1)` in the stream.**

**OpenAI** is similarly autoregressive: `delta.content` arrives first, followed by `delta.tool_calls`, also in sequence.

So the accurate statement is: **both providers concatenate `[text-token segment][tool-token segment]` in sequence; the difference is only how many segments can be joined.**

|             | Shapes it can join                                                       |
| ----------- | ------------------------------------------------------------------------ |
| Anthropic   | `[text][tool][text][tool]…` (the server-tool example reaches `index:17`) |
| OpenAI chat | `[text][tool]`—only this one pair                                        |

**“Alternation” should be renamed “segmentation.”** What your original question meant by “alternating tool tokens and chat tokens” was segmentation ability, not mixed token streaming. Neither provider does the latter, and neither should; a client cannot render a half-sentence with an inserted tool call.

### b. It Is the Protocol, Not the Model—the Proof Is in OpenAI's Own Type Definitions

**Evidence one: the same model can create multiple segments when the protocol changes.** `gpt-5.x` under Responses can legally produce an output array like `message → function_call → message → function_call`; the same model under chat completions cannot. **The model is unchanged, and capability changes with the protocol.** That alone excludes model-output limitations.

**Evidence two: the asymmetry in openai-python is obvious.**

```python
# Output (what the model sends you) — chat_completion_message.py
class ChatCompletionMessage(BaseModel):
    content: Optional[str] = None          # ← one string

# Input (what you send back) — chat_completion_assistant_message_param.py
ContentArrayOfContentPart: TypeAlias = Union[
    ChatCompletionContentPartTextParam,
    ChatCompletionContentPartRefusalParam,  # ← only text and refusal
]
content: Union[str, Iterable[ContentArrayOfContentPart], None]
```

Two things are true at once:

1. **Assistant content can already be an array on the input side, while output remains a string.** The array shape exists in the protocol but was never extended to model output.
2. **Even that array contains only `text` and `refusal`, not a tool_call part.** So even manually constructing it cannot represent an ordered “text → tool → text” sequence; `tool_calls` always remains another parallel field.

**That is the root problem: it is not that no array exists, but that the array has no tools.** The protocol contains nowhere that can preserve ordering information.

**Evidence three: chat completions is the odd one out among major providers.** Gemini's `Content.parts` is also a mixed array, and its documentation explicitly warns:

> the model may return a mix of `functionCall`, `toolCall`, and `toolResponse` parts in a single turn. **Don't assume the `functionCall` will always be the last item in the parts array.**

That is effectively saying that text can occur after a `functionCall`. Anthropic has ordered blocks; Gemini has ordered parts; Responses has ordered items. **Only chat completions uses two parallel fields.**

### Is It Really “Garbage Design”?

**Not garbage, but unreconstructed historical baggage.** `content: str` made perfect sense in the GPT-3.5 era, when a turn could only produce text. When function calling was added in 2023, **adding a parallel `tool_calls` field was backward compatible; changing `content` from a string to an ordered array was not**. It would have broken every client that read `choices[0].message.content`.

That locked it in. Multimodal input later received an array because it was a new field and new shape, while output remained a string forever. **This is why Responses required a new endpoint rather than adding parameters to chat completions: the change could not be compatible, so the protocol had to change.** It also explains why Codex had to remove support rather than softly preserving it.

### Finally: Your Example May Be Your Own Prompt's Fault

You said users lose awareness after the first preview. But **across rounds, the multiple-segment restriction does not apply**. The second assistant message has its own `content` field and can legally preview again:

```text
round 1: {content: "Let me read the diary.", tool_calls: [read_diary]}
round 2: {content: "The diary is empty; I will check memory.", tool_calls: [read_memory]}   ← fully legal
round 3: {content: "I found…"}
```

Why did this not happen? Look at rule five of your own `pre_tool_preview` injection:

> **“If this is the first tool call in the current round**, and the user can perceive the wait, prioritize this upfront explanation.”

The phrase **“first tool call in the current round”** may have been interpreted by the model as “only preview once in a user turn.” The behavior you observed strongly matches that prompt.

Try a control experiment first: change it to “**Before every** tool call, give an upfront explanation; if it repeats the previous one, use different wording.” Then see whether a second preview appears. **If it does, your long-chain silence came from the prompt, not the protocol—a vastly easier problem to fix.**

(And a correction to the previous section: saying “once per round, up to six segments” was correct; `max_rounds = 6` gives you six-segment budget. What actually consumed one segment and then stopped was likely this prompt rule.)
:::

### Damn!

Oh, I finally understand. I could see only one preview all this time because of my own prompt!

And in a tool loop, each OpenAI protocol tool-call segment is independent and can carry a preview message?

This matters greatly to me. My later engineering goal is to eliminate silence in long tool chains for the desktop companion. I had planned to break one tool chain into multiple steps, but now it seems I may not need to!

Is that right?

So I only need to improve the prompt and add some guardrails? I do not need a complicated implementation?

:::note[Opus]
**The overall direction is right, but do not celebrate yet—three points need calibration, and the second one is my responsibility.**

### Correction One: It Is “One per Round,” Not “One per Tool”

These two lines in your `core.py` explain it:

```python
max_rounds = 6                                    # 503
*(_exec_tool(tc, ...) for tc in ordered_tool_calls)   # 606, parallel execution
```

**In one round—one LLM call—the model can emit N tool_calls, which you execute in parallel.** That round has only one `content` field, so **N tools share one preview**.

The precise statement is: **a preview has the granularity of “one per LLM call,” not “one per tool.”**

For one-to-one previews, pass `parallel_tool_calls: false` to the API; it is a standard chat-completions parameter and openai-python types it. But that trades latency for awareness. If three tools each take five seconds, parallel execution takes five seconds while serial execution takes fifteen. **Usually that is not worth it: one preview saying “I will check the diary and memory at the same time” is enough.**

### Correction Two: My Diagnosis Was a Hypothesis, Not a Conclusion

In the previous section, I said the prompt might be at fault. That was a **high-confidence inference from reading the code, but I did not run your agent**. Do not treat it as a verified fact—**run the control experiment first**.

And even after changing the prompt, there is a second obstacle: **after getting a tool_result, models themselves tend to jump straight into the next tool call**. How malleable that behavior is depends on the model. The ones you use on the desktop companion—DeepSeek and Grok-like models—may be more stubborn than frontier models.

So set realistic expectations: **improving the prompt will probably help substantially, but may not consistently produce a preview every round.** Prepare for partial success rather than treating one edit as a complete solution.

### Correction Three: Previews Do Not Remove Silence During Tool Execution

This is easiest to overlook. A preview covers **the instant from the LLM deciding to call a tool until the tool starts**, not **the three to five seconds while the tool runs**.

The real result is therefore:

```text
Before: [say one thing] ────30 seconds of silence──── [answer]
After:  [say one thing]─5s silence─[say one thing]─5s silence─[say one thing]─5s silence─[answer]
```

**It splits one long silence into several shorter silences; it does not remove silence.** The perceived improvement is huge, but a tool that itself takes ten seconds remains silent for ten seconds. Only UI-level progress feedback—such as a spinner or “Reading…”—can cover that; the protocol cannot.

### Do You Still Need to Split It into Steps?

**If the goal is only to remove silence, no.** Your original plan to break it down would use engineering to imitate a capability the protocol already has.

**But notice one hard limit: `max_rounds = 6`.** Once a chain exceeds six rounds, your own system truncates it. If you want long tool chains to remain perceptible, raise this number first; no matter how good previews are, the current budget is only six segments.

### A Concrete Prompt Shape

Do not only write “preview before calling.” Make each round's sentence **both close the previous step and preview the next**. That is the form you actually want:

> Before every tool call, say one sentence. If this is not the first tool call in the current round, that sentence must do two things: use half a sentence to state the previous result, then explain the next action. Do not repeat the previous wording.

The output becomes the ideal form you described:

```text
Let me read the recent diary.                  ← preview only
[Read Diary] → empty
The diary is empty; I will check memory.       ← closure + preview
[Read Memory] → ...
I found...                                     ← closure
```

**This is more natural than previewing every step and uses fewer tokens: users receive a coherent narrative rather than six repeated “Let me check…” lines.**
:::

## Real and Fake “Talking While Working”

I understand now, but I do not understand what advantage Claude has beyond this.

If both are strictly serial, then they seem no different. Can you explain what truly counts as talking while working (Anthropic), and what is fake talking while working (OpenAI)?

From my perspective, reaching the form above already feels complete.

:::note[Opus]
**First, correct a framing error: the boundary between real and fake is not Anthropic versus OpenAI, but server tools versus client tools. By that line, your desktop-companion scenario cannot reach the “real” tier under either provider, so the answer is bad news for you—but it saves you a migration.**

### Fake: Segmented Speech, With a Full Round Trip per Segment

The multiple segments in chat completions are stitched together by a **client-side loop**:

```text
HTTP request 1 ──> [preview] [tool_calls]        ← connection ends; control returns to you
   You execute the tool locally
HTTP request 2 ──> [closure + preview] [tool_calls]   ← resend full history; new TTFT
   You execute the tool locally
HTTP request 3 ──> [final answer]
```

The user sees a coherent narrative, but underneath are **three requests, three full-context submissions, and three time-to-first-token delays**. It is “**segmented speech**,” not “talking while working”: between each segment, the model has actually stopped working.

### Real: Speak, Work, Speak in One Stream, Without Returning Control to the Client

Anthropic **server tools** (`web_search` / `code_execution` / MCP connector) execute on Anthropic's servers. The official streaming web-search example looks like this:

```text
content_block_start index:0   text          "I'll check the current weather in NYC for you."
content_block_start index:1   server_tool_use   web_search
content_block_start index:2   web_search_tool_result   ← server executes and inserts result directly
content_block_start index:3   text          "Here's the current weather..."
...
content_block_stop  index:17
message_stop                                  ← one HTTP request from start to finish
```

**One request, one SSE stream, seventeen blocks.** Control never returns to the client. This is the literal meaning of “talking while working”: **the work happens while it speaks, without a break in the middle.**

### The Honest Part: Anthropic Client Tools Are Fake Too

If you define your own `get_weather` tool for Anthropic, it still ends with `stop_reason: "tool_use"`, still returns to the client, and still requires another request. **It is exactly the same as OpenAI.**

The correct dividing line is therefore:

|                                             | Multiple segments in one request | Requires a client loop |
| ------------------------------------------- | -------------------------------- | ---------------------- |
| Anthropic server tools                      | ✅ Real                          | ❌                     |
| **OpenAI Responses server tools**           | ✅ Real                          | ❌                     |
| Anthropic client tools                      | ❌ Fake                          | ✅                     |
| OpenAI chat completions (client tools only) | ❌ Fake                          | ✅                     |

**Notice the second row.** Responses also has server tools (`web_search` / `code_interpreter` / remote MCP), so it can do the real version too. This has never been “Claude is stronger”; **chat completions is simply the only one of the four without a door into that capability.**

### What This Means for Your Desktop Companion

Your tools are **screenshots, diary reading, and memory reading**—all of them must execute on the local machine. **They are permanently client tools.**

**Therefore, you cannot reach the real tier by switching to Anthropic or Responses.** It is not that protocols withhold it; the tools physically run on a user's computer, so control must return there.

What advantages remain for Anthropic over chat completions? Only two:

1. **Better default behavior**—models speak before acting without requiring `pre_tool_preview`.
2. **Text-tool ordering is structural within a round** through `index`, rather than relying on the convention that `content` precedes `tool_calls`.

**Neither is worth migrating for.** You already solve the first with prompting; in your own client, the second has no material advantage over a convention and guarantee.

### A More Precise Meaning of “Handshake”

You have worried about “repeated handshakes causing first-token latency.” But **multi-round exchanges do not normally redo TCP/TLS handshakes**: `openai-python` uses a shared httpx client and reuses keep-alive connections.

The actual cost of each round is:

- **Resubmitting full context** (token cost, mostly offset by prompt caching)
- **Server-side prefill again** (also mostly offset by caching)
- **TTFT**, time to first token—**this really exists every round and cannot be removed by caching**

So a six-round tool chain's latency mostly comes from **6 × TTFT + 6 × tool execution time**, not six handshakes. Whether your roommate's claim that “Responses long connections can remove first-token delay” holds is a separate question. For now, remember: **you want to reduce TTFT, not handshakes.**
:::

Okay, just as I expected, the two are not really different. Reaching that form is already the limit if the connection is not kept open.

Okay, one big confusion gone, one point of clarity gained.
