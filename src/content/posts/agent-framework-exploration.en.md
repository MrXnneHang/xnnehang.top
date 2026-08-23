---
title: What We Built When Mainstream Agent Frameworks Could Not Fit Our Needs
published: 2026-06-23
featured: true
category: technology
kind: learning-note
tags:
  - Agent
  - LLM
  - 框架设计
  - 实时系统
description: Drawing on our experience building an AI companionship engine, this article compares the limitations of mainstream Agent frameworks such as LangChain, Dify, LangGraph, and Coze, and documents the core design ideas and trade-offs behind the low-level framework we built for real-time companionship.
image: ../../assets/img/agent-framework-exploration/hero-bg-1.png
lang: en
translationKey: agent-framework-exploration
---

> [!NOTE]
> **AI collaboration disclosure:** This article was co-written by Xnne and [Korewaxnne](https://github.com/xnne-bot), an AI assistant powered by Claude Opus 4.6. Xnne provided the hands-on technical experience, product thinking, and core design decisions; Korewaxnne helped organize the article's structure and technical explanations.

> We looked into every mainstream Agent framework we could find, from LangChain/LangGraph to Dify/n8n and from OpenHands/Suna to Claude Code, but not one of them fit our product requirements perfectly. Eventually, we realized that the question was not “Which framework should we choose?” but rather: **What should you do when the abstraction boundaries of mainstream frameworks do not align with your product requirements?**

## An Uncommon Agent Scenario

Most Agent framework demos follow the same pattern: the user asks a question, the LLM reasons, calls a tool, and returns an answer. One question, one answer—clean and straightforward.

Our scenario is entirely different. We are building an AI companionship engine for character roleplay, VTuber interaction, and gaming companions. A complete conversational turn for our Agent therefore involves far more than “calling an LLM.” It spans three very different stages, each with its own technical requirements:

**Before the call:** The system does not wait for the user to speak before responding. In the gaming-companion scenario, a proactive OCR conversation plugin continuously polls the screen. When it detects an important in-game event—such as the character dying, a quest being completed, or the scene changing—it proactively prompts the LLM to start a conversation instead of waiting for the user. The framework must therefore support “conversation turns not initiated by the user.”

**During the call:** The LLM's streaming output cannot simply be concatenated into a complete string and returned. Every token must enter a sentence segmenter in real time. As soon as a natural sentence is formed, it is sent to a GPT-SoVITS / Qwen-TTS engine for speech synthesis, while emotion tags are extracted to drive changes in the Live2D model's expression. This is a token-level fan-out pipeline with extremely tight latency requirements. Within the same turn, the LLM may also call multiple tools—for web searches, file operations, or screenshot analysis—and resume streaming afterward. **Even the tokens for a tool call are not accumulated into complete JSON before being parsed. The framework parses structured events as the tokens stream in and emits them alongside text tokens in the same stream.**

**After the call:** Finishing a turn does not mean simply saving it to SQLite and calling it done. The conversation is sent to the Memory Bench service, where mem0 extracts and aggregates memories while Neo4j stores them in a knowledge graph, forming structured long-term memory. Before the next conversation begins, those memories are retrieved and injected back into the context.

These three stages define the core requirements of our framework. Next, let us see what happens when we try to fit mainstream frameworks around them.

## The Trouble with Mainstream Frameworks

### Coze: The Low-Code Ceiling

Coze is an Agent-building platform launched by ByteDance; in 2024, it open-sourced its core engine as Coze Studio. Its design goal is clear: enable nontechnical users to build AI bots through a visual interface and quickly deploy them to platforms such as WeChat, Feishu, and Discord.

Coze's Workflow editor uses drag-and-drop nodes to orchestrate processes. Together with its built-in plugin marketplace and knowledge bases, it really can produce a functional customer-service bot or knowledge Q&A assistant within minutes. This is where Coze genuinely excels.

But it runs into a wall in our scenario. First, Coze Workflow has an explicit limitation: it does not support an end node with streaming output within a workflow. That prevents us from segmenting and dispatching text to TTS at the token level, breaking the entire speech-synthesis stage. Second, although Coze's plugin system supports third-party APIs, its lifecycle follows a request-response model and has no hooks such as `on_before_turn` or `on_after_turn`. There is nowhere in Coze's architecture to attach our proactive OCR trigger or post-call memory graph construction. Finally, Coze's open-source community edition and commercial edition differ in functionality. Features such as custom voices are available only in the commercial edition, whereas we need a fully controllable TTS pipeline.

In short, Coze was designed for “chatbots,” not “companion Agents.”

### Dify: The Limits of Workflow Expressiveness

Dify is an excellent LLMOps platform whose core value lies in visual workflow orchestration and all-in-one RAG management. By dragging and dropping nodes, you can quickly build an Agent application with knowledge-base retrieval, model switching, and conditional branches. Dify's Agent Node even supports custom strategy plugins such as ReAct, CoT, and ToT, while its Plugin Trigger mechanism can subscribe to external events that start a workflow.

At first glance, Dify's Plugin Trigger seems capable of meeting our need for “proactive OCR triggers”: subscribe to an external OCR event and use it to start the workflow. The problem appears downstream.

Dify's Agent Node follows a three-stage execution model: initialization, iterative loop, and final response. Each iteration is a complete LLM call. Its output is a structured JSON response rather than the token stream we need. Although Dify's Chat API supports streaming over SSE, that stream operates at the node level: you can see the result after a node finishes, but you cannot access the LLM's output token by token as it is generated and segment it in real time.

The more consequential limitation concerns memory. Dify's Agent Node uses `TokenBufferMemory` to manage context through a sliding token window. That works well for cost control, but we need semantic retrieval from an external knowledge graph: use the current conversation to recall relevant memory fragments from Neo4j, then inject them at a specific point in the user prompt. This bidirectional memory flow—retrieval before the call and graph construction afterward—falls outside the design scope of Dify's Agent Node.

What is Dify well suited to? Enterprise RAG applications, customer-service workflows, and content-generation pipelines—scenarios that are not sensitive to streaming granularity and whose memory requirements involve “recall within a window” rather than “cross-session graph relationships.”

### LangChain: The Cost of Abstraction

LangChain was an early mover in the Agent framework space. Its greatest contribution was defining the concept of a “Chain”: a composable pipeline connecting a Prompt, an LLM, an Output Parser, and Tools. In 2023 and 2024, this abstraction dramatically lowered the barrier to building LLM applications.

LangChain's central strengths are composability and its ecosystem. It offers the broadest collection of Integrations, with official adapters for hundreds of third-party tools and vector databases; a mature Document Loader / Text Splitter / Retriever stack for RAG; and LangSmith for Tracing and Eval. If you are building a conventional retrieval-augmented Q&A or document-analysis application, LangChain may still be the fastest place to start.

Yet LangChain's problem lies precisely in its core abstraction.

A Chain is linear. A standard LangChain Agent works like this: receive input → construct a Prompt → call the LLM → parse its output → execute a tool if needed → call the LLM again → produce the final output. It is a one-way pipeline. Our scenario, however, requires the token stream to be handled by several consumers simultaneously while the LLM is generating: a sentence segmenter, an action extractor, a TTS filter, and a frontend display processor. Tool calls can also interrupt the text stream, insert tool-status labels, and then resume streaming after execution finishes.

This is not a chain. It is a stream with loops, branches, interruptions, and resumptions.

More concretely, LangChain's `AgentExecutor`, which was marked deprecated by the end of 2025, blocks the entire chain while a tool call is executing. You have no opportunity to stream status information to the frontend during that execution. When our `AgentCore` encounters a tool call, it first yields a structured `ToolCallEvent(status="running")` event so the frontend can immediately display the tool's status. It then executes all tool calls concurrently, yields `ToolCallEvent(status="completed")` when they finish, and resumes streaming generation. Throughout the process, text tokens and tool events flow out of the same `AsyncIterator` as distinct types for the frontend to consume separately.

LangChain's memory abstractions, such as `ConversationBufferMemory` and `ConversationSummaryMemory`, were likewise designed for simpler scenarios. They assume memory is “some compressed form of the conversation history” that can simply be placed in the Prompt. Our memory is an independent service with its own search and write APIs. It must be queried asynchronously before a conversation begins and written to asynchronously after it ends. LangChain provides no native lifecycle hooks for this kind of external asynchronous memory service.

Finally, LangChain has too many abstraction layers. A tool call passes through `Tool` → `ToolKit` → `AgentExecutor` → `OutputParser` and several layers of wrapping. During debugging, you often need to follow five or six nested Traces in LangSmith just to locate the problem. In a real-time streaming scenario like ours, where optimization happens at the millisecond level, every abstraction layer adds latency and debugging overhead.

### LangGraph: The Closest Match, Yet Still Misaligned

LangGraph is the LangChain team's answer to the limitations of its own linear architecture. It introduces a directed graph, `StateGraph`, for orchestrating Agent workflows and supports complex control flow such as loops, branches, conditional edges, and human approval. Since LangChain and LangGraph both reached their 1.0 milestones in October 2025, LangChain's `create_react_agent()` has in fact run on top of the LangGraph engine.

Several LangGraph design choices are genuinely worth learning from. Its concept of State—a shared state object passed between graph nodes—offers more flexible data transfer than a LangChain Chain. Time-Travel Debugging lets you return to any node in a graph execution and replay it, which is extremely useful when debugging complex workflows. Its Human-in-the-Loop mechanism lets you insert human approval on any edge in the graph.

But there is a fundamental mismatch between LangGraph's graph model and our requirements: granularity.

A LangGraph Node represents “one complete operation”: one LLM call, one tool execution, or one decision. Nodes pass State to one another through Edges. This design is ideal for orchestrating multistep workflows such as “retrieve documents, summarize them, generate a report, and send it after human approval.”

Our core requirement, however, is not “orchestration between steps” but “token-level processing within a single LLM call.” As the LLM streams its output, every token must pass through a four-layer decorator pipeline: `sentence_divider → actions_extractor → tts_filter → display_processor`. This is not “one graph node finishes and passes its result to the next.” It is “the output stream is split and processed in real time inside a single node.” LangGraph's State Graph cannot express behavior at this granularity.

Moreover, our Hook system needs “lifecycle hooks for a conversational turn,” not “hooks for graph-execution nodes.” `on_before_turn` retrieves memories before the entire graph begins, `on_after_turn` writes memories after the graph finishes, and `on_after_playback` is not triggered until frontend playback ends, because some post-processing must wait for TTS playback to finish. These three hooks span three entirely different timescales: the LLM call, tool execution, and frontend playback. LangGraph's graph is designed around the “LLM + Tool” execution flow; it has no concept of “frontend playback complete.”

LangGraph also has a practical problem at scale: performance. As the number of graph nodes and edges grows, execution slows, memory usage rises, and debugging becomes harder. Its tight coupling to the LangChain ecosystem also means that if you want to use a lighter-weight LLM client, such as the `openai` SDK directly, you must write a great deal of glue code to adapt it.

### Harness Engineering: The Right Direction, but We Do Not Need a Control Plane

The hottest concept of 2026 is Harness Engineering: “Models provide raw intelligence; harnesses make that intelligence useful.” Gartner predicts that by the end of 2026, 40% of enterprise applications will include AI Agents, while flaws in the harness layer rather than inadequate model reasoning will account for 65% of Agent project failures.

Microsoft Agent Framework (MAF) reached 1.0 GA in April 2026, unifying AutoGen and Semantic Kernel while providing production-grade capabilities such as Shell access, human approval flows, and cross-session context management. The industry is also standardizing around two protocols: MCP (Model Context Protocol) for vertical interaction between Agents and Tools, and A2A (Agent-to-Agent) for horizontal delegation.

The five layers emphasized by Harness Engineering—tool orchestration, validation loops, context and memory, guardrails, and observability—align closely with our own practice. Yet these frameworks typically assume either a “single-turn request-response” or “multistep workflow” model, with security, compliance, and observability as their central concerns. They are control planes designed for scenarios such as enterprise SRE, customer-service automation, and code generation.

What we need is not a control plane, but a “presentation layer that lets an Agent accompany you like a person”: real-time speech, facial expressions, proactive conversation, and emotional memory. None of these requirements appear on the Roadmap of any Harness Engineering framework.

## So What Did We Build?

Since nothing fit, we worked backward from our product requirements and built our own low-level architecture. It is not another “general-purpose Agent framework,” but an Agent engine designed for real-time companionship.

Its core design rests on four pillars:

### Lifecycle Hooks (Hook System)

We defined three hook points that cover the full lifecycle of a conversational turn:

```python
class HookPlugin(ABC):
    async def on_before_turn(self, user_text, ctx) -> str | None:
        """Before the call: retrieve memories and inject context"""
    async def on_after_turn(self, user_text, assistant_text, ctx) -> None:
        """After the call: write memories and update the graph"""
    async def on_after_playback(self, user_text, assistant_text, ctx) -> None:
        """After playback: post-process once TTS playback has finished"""
```

`MemoryPlugin` is a typical implementation. In `on_before_turn`, it performs a semantic search against the Memory Bench service and injects the recalled memory fragments into the context. In `on_after_turn`, it asynchronously writes the current conversation to mem0 for memory extraction while updating the Neo4j knowledge graph.

`MoodChatPlugin` implements a different pattern. Rather than responding passively, it schedules conversations proactively according to an emotion score: it talks more when happy and stays quiet when feeling low. In gaming-companion mode, it also uses OCR change detection to decide whether to speak first.

One key design decision is that hook return values are concatenated and injected into the `[memory context]` block of the user prompt rather than the system prompt. This avoids treating transient information as stable fact.

### Streaming Tool-Calling Loop

`AgentCore.run_turn()` implements a multiround streaming tool-calling loop with a maximum of six iterations per turn. Its return type is `AsyncIterator[str | ToolCallEvent]`: text tokens flow out as strings, while tool calls flow out as structured events.

```python
max_rounds = 6  # A safety guardrail, not a technical limit

for _ in range(max_rounds):
    text_buf = ""
    async for chunk in chat_llm.stream_with_tools(messages, tools=schema):
        if delta.content:
            text_buf += delta.content
            yield delta.content              # Emit text tokens immediately
        if delta.tool_calls:
            accumulate(tool_calls_buf)       # Accumulate tool-call fragments

    ordered_tool_calls = _ordered_complete_tool_calls(tool_calls_buf)
    if not _should_execute_tool_calls(finish_reason, ordered_tool_calls):
        break   # No tools need to run; finish normally

    # Before execution: emit running status events
    for tc in ordered_tool_calls:
        yield ToolCallEvent(
            tool_id=tc["id"],
            tool_name=tc["name"],
            args=tc["arguments"],
            status="running",
        )

    # Execute all tools concurrently
    results = await asyncio.gather(
        *(_exec_tool(tc, tool_manager, ctx) for tc in ordered_tool_calls)
    )

    # After execution: emit completed / error status events
    for tc_info, result in zip(ordered_tool_calls, results):
        yield ToolCallEvent(
            tool_id=tc_info["id"],
            tool_name=tc_info["name"],
            args=tc_info["arguments"],
            status="completed" if result.ok else "error",
            result=result_text,
        )

    # Append tool results to the message list, then let the LLM continue
    # generating from those results in the next round
```

**The six-round limit is an empirical trade-off between latency and capability.** Voice interactions are sensitive to response time, while nearly all normal conversations finish after one or two rounds of tool calls—search → read a file → answer. Six rounds provide ample headroom without making users feel that they are waiting too long.

Two design details are worth emphasizing.

First, tool-call events flow out as **structured objects**, not textual tags. `ToolCallEvent` is a dataclass with fields including `tool_id`, `tool_name`, `args`, `status`, and `result`. Neither the frontend nor any downstream pipeline layer has to recognize tool events by parsing text tags with regular expressions; each can simply check the type. Tool status is also split into two event stages: `status="running"` before execution and `status="completed"` or `"error"` afterward. The frontend can switch its UI according to the current status.

Second, multiple tool calls within the same round execute concurrently through `asyncio.gather()` rather than waiting serially.

### Token-Level Output Pipeline

The mixed `str | ToolCallEvent` stream emitted by `AgentCore` enters the decorator pipeline in `MemoryAgent`:

```python
@tts_filter(config)           # Filter content TTS does not need (special symbols, etc.)
@display_processor(...)        # Process control tags for frontend display
@actions_extractor(live2d)     # Extract emotion/action tags to drive Live2D
@sentence_divider(...)         # Split on natural sentences and emit each immediately
async def chat_with_memory(input_data):
    async for token in core.run_turn(...):
        yield token
```

The processing logic in every decorator layer performs one crucial check:

```python
async for chunk in stream:
    if isinstance(chunk, (AudioOutput, ToolCallEvent)):
        yield chunk         # Pass structured events through unchanged
        continue
    # Otherwise, process the text token in this layer
```

As a structured event, `ToolCallEvent` **passes transparently through** the pipeline. The sentence segmenter does not split it, the TTS filter does not try to synthesize it, and the display processor does not attach tags to it. Whenever a layer encounters a `ToolCallEvent`, it simply yields the event unchanged. The final stream received by the frontend contains two kinds of messages: processed sentences, including display text, TTS text, and action tags; and structured tool-call events. This is much cleaner than the early design, now removed, that mixed `<tool>[name]</tool>` text tags into the conversation stream.

`sentence_divider` is the most latency-sensitive part of the pipeline. As soon as it has enough tokens to form a natural sentence, it yields that sentence immediately rather than waiting for the entire passage. This allows the TTS engine to begin synthesizing the first half of a response while the LLM is still generating the second, greatly reducing the delay users perceive before hearing the first sentence.

### Four Plugin Types

All capabilities are extended through plugins. We defined four plugin types:

| Type     | Responsibility             | Examples                                                                                                |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `tool`   | Register callable tools    | `web_fetch`, `screen_shot`, `web_search_ddg`                                                            |
| `hook`   | Provide lifecycle hooks    | `memory` (memory retrieval + persistence), `mood_chat` (proactive conversation)                         |
| `policy` | Inject prompt rules        | `pre_tool_preview` (announce tool calls in advance), `tool_call_integrity` (prevent hallucinated calls) |
| `skill`  | Inject behavioral guidance | `diary` (workflow for reading and writing diary entries)                                                |

Each plugin declares its identity and default configuration in a `plugin.toml` file:

```toml
[plugin]
id = "memory"
type = "hook"

[config]
base_url = "http://localhost:12393"
user_id = "xnne"
agent_id = "congyin"
search_limit = 10
```

A Profile TOML file determines which plugins are enabled and which configuration values they override:

```toml
[plugins]
enabled = ["web_search_ddg", "web_fetch", "memory", "diary"]

[plugins.memory]
agent_id = "baoqiao"     # Switch agent_id when switching characters
search_limit = 5
```

This means the same codebase can switch to an entirely different Agent persona simply by changing the Profile file: a different character Prompt, output format, set of enabled plugins, and memory space. Two characters can coexist in the same Neo4j graph while remaining isolated from one another through `agent_id`.

## The Trade-offs We Made

Every framework design involves trade-offs. To be honest, we gave up several things:

**We gave up MCP.** Early on, we used the MCP protocol for tool calls, but later migrated everything to in-process `BuiltinTool`s. The reason is practical: MCP uses interprocess communication over JSON-RPC. For frequent operations such as “read a file” or “get the current time,” the IPC overhead is not worthwhile. In-process calls have microsecond-level latency; MCP operates at the millisecond level. In real-time voice interactions, those milliseconds accumulate into noticeable stuttering.

**We gave up a separate Tool Model.** We initially used a dedicated small model to make tool-calling decisions while the chat model focused solely on generating text. We later found that mainstream models' native function calling had become good enough, and maintaining an additional tool model introduced far more complexity than benefit. PR #295 / #296 made this simplification and removed a series of components, including `AgentToolLoop` and `AgentToolLoopRunner`.

**We gave up generality.** We do not intend for this framework to fit every scenario. It contains extensive customization for real-time companionship—streaming sentence segmentation, a TTS pipeline, Live2D control, and emotion extraction—none of which is useful in a RAG question-answering or code-generation scenario. This is an opinionated framework, not a universal one.

## Returning to the Original Question

What should a good low-level Agent framework look like?

Our experience gives this answer: **It should work backward from product requirements, not forward from abstract concepts.**

LangChain's Chain, LangGraph's StateGraph, and Dify's Workflow Node all begin with an abstraction and ask users to fit their requirements inside it. When your requirements happen to fall within the abstraction's scope—linear Q&A, multistep workflows, or RAG retrieval—they are highly effective. But once your requirements cross its boundaries—when you need a token-level streaming pipeline, lifecycle hooks spanning the three timescales of LLM, Tool, and Frontend, or declarative plugin configuration capable of switching an Agent's entire behavior—these frameworks turn from “accelerators” into “obstacles.”

If we had to summarize the pattern, our experience would be:

1. **Define a lifecycle, not an execution graph.** Before the call, during the call, after the call, and after playback: each stage has explicit hook points, and plugins decide where to attach themselves. This is more flexible than drawing an execution graph because the timescales of a real product often extend beyond the LLM call itself.

2. **Streaming first, not request-response first.** From LLM calls and tool-status feedback to TTS synthesis, every stage is a stream driven by `AsyncIterator`. Blocking designs are fatal in real-time scenarios.

3. **Declarative configuration, not orchestration in code.** A `plugin.toml` declares a plugin's identity; a `profile.toml` declares the scenario's configuration. Switching an Agent's behavior means changing a file, not rewriting code.

4. **Keep plugins isolated, but let them declare dependency chains.** Plugins cannot import one another; shared logic must be elevated into the framework layer. Isolation does not mean there are no relationships, however. Some plugins genuinely require others as prerequisites: `mood_chat`, for example, depends on `vision_boost`. We distinguish **prerequisites** from **dependents**: if A is a prerequisite of B, then B is a dependent of A. Installing a dependent plugin requires installing all of its prerequisites first, and the entire dependency chain is resolved and validated at the configuration layer rather than failing only at runtime.

This is not an argument that “we are better than LangChain or Dify.” They perform very well in the scenarios they target. It is a practical record of what to do when the abstraction boundaries of mainstream frameworks do not align with your product requirements.

The answer is: do not force your needs into them. Build your own. But when you do, be clear that you are making trade-offs, not inventing something from nothing.
