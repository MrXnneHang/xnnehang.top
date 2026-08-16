---
title: "What Is memU? Let's Break It Down (An Ongoing Series)"
published: 2026-06-29
updated: 2026-07-14
category: Learning as I Build
tags:
   - memU
   - Memory Systems
   - Prompt Design
description: A breakdown of memU focused on its main paths and ADR architecture documents, currently following through ADR 0008.
series:
   - Long-Term Memory
featured: true
pin: false
lang: en
translationKey: memu-source-code-breakdown
---

![](../../assets/img/memu-source-code-breakdown/cover.jpeg)

> [!NOTE]
> **AI collaboration disclosure:** This post was written jointly by Xnne and [Korewaxnne](https://github.com/xnne-bot) (a cyber cat). Xnne is responsible for the direction and technical analysis; Korewaxnne helped organize the structure, polish the language, and format it.<br>
> This post will also be updated over the long term.

I had actually broken down memU once before.

But it was in the middle of an architectural iteration, and I had no reading guide for ADR 0007. So I deleted that earlier breakdown entirely. This invisibly makes the article harder to read, though I will try to keep it simple.

## Changes to the memorize / retrieve pipeline

Previously, `memorize` was a standalone Python script, and `retrieve` was another standalone Python script.

Previously, the objects handled by memorize and retrieve were a `single file (Chat)` plus a `Skill`.

Previously, retrieval used `LLM retrieve` plus `RAG retrieve`, distinguished by mode, and only one route ran at a time.

After [#466](https://github.com/NevaMind-AI/memU/pull/466):

### memorize

![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-1.png)
![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-2.png)

Memorize became two scripts: `memorize.py` plus `memorize_workspace.py`.

The objects handled by memorize and retrieve gained a `workspace`.

Simply put, memorize used to work on a collection of conversations, like mem0:

```json
{
  "user": "hi",
  "assistant": "hi,how can I help you today?",
  ...
}
```

More precisely, it was a single file. It could also be a long string, but it did not contain complex nested hierarchy.

A workspace is a folder. It can be a complex folder, such as a project directory.

I will discuss workspace retrieval later.

### retrieve

![](../../assets/img/memu-source-code-breakdown/retrieve-pipeline.png)

ADR 0007 says retrieve should implement BM25 plus hybrid search. But that method is not implemented yet; `retrieve-workspace` is still only a simple `top-k`.

I do not know whether my earlier conversation with my mentor in [[memU's Architectural Shift Through the Eyes of a Consumer-Facing Developer]] had an effect. It seems the mentor convinced the leader to retain both LLM retrieve and RAG retrieve. In [#467](https://github.com/NevaMind-AI/memU/pull/467), both were added to the CLI:

```python
memu memorize notes/meeting.md
memu memorize-workspace ./workspace
memu retrieve "What are this user's launch preferences?"
memu retrieve-workspace "deploy checklist"
memu export
```

Here, retrieve is the older path where either `RAG` or `LLM` was enabled in configuration.

Workspace was also implemented separately.

There is still a little architectural redundancy. Should retrieve retain `RAG mode`? In principle, it should, but once retained, it resembles `retrieve-workspace` in principle while doing different work.

But if it is removed in favor of reusing workspace, their meanings differ. In short, people who are sensitive to architectural asymmetry may find this uncomfortable. The most comfortable architecture would use workspace to replace `RAG/LLM retrieve` entirely, but trade-offs are necessary.

For me, though, it's okay. At least we fought for `LLM retrieve` to remain. And it does seem to be staying—hopefully it is not merely being removed through separate PRs =-=.

## Data Model Changes

### old memorize

```
Resource ──1:N──▶ RecallEntry ──N:M──▶ RecallFile
                                  (through RecallFileEntry)
```

One Resource (the original file) produces multiple RecallEntries (items extracted by the LLM). Entries connect through RecallFileEntry to RecallFiles, which are topical documents such as “Profile” or “Goals.”

### latest memorize (adding the workspace pipeline)

```
Resource ──N:M──▶ RecallFile ──1:N──▶ RecallFileSegment
              (through RecallFileResource)
```

The workspace route skips RecallEntry. A Resource connects directly to a RecallFile through RecallFileResource. Each RecallFile is then split into multiple RecallFileSegments for retrieval.

### Data Model

<div class="img-center" style="max-width: 24rem; margin: 0 auto;">

![Data model](../../assets/img/memu-source-code-breakdown/data-model.png)

</div>

### What's new?

**`RecallFileSegment`** is the most important addition. A RecallFile is split into one to N segments, and every segment has its own text and embedding. Retrieval searches segments, then rolls the hit up to the owning file. Segmentation differs by track:

- skill: one segment for the entire skill (`name: ...\ndescription: ...`)
- memory: split by line, skipping blank lines and Markdown headings

**`RecallFileResource`** is the many-to-many relation table from Resource to RecallFile: provenance. It records which source files were synthesized into a file's content. The old path linked indirectly through Entry; the new path needs this direct link.

**`Resource.track`** is a new field that identifies the source: `"chat"` / `"skill"` / `"workspace"`. Resources in the old path are `None`. Workspace retrieval uses `track="workspace"` to search only Resources originating from a workspace.

### What is track?

The term track appears three times in the data model—Resource, RecallFile, and RecallFileSegment—but it has **two layers of meaning**.

**First layer: Resource.track — “Where did this source file come from?”**

`memorize_workspace` classifies it automatically from the directory name:

| Top-level directory | Resource.track | Meaning                                  |
| ------------------- | -------------- | ---------------------------------------- |
| `chat/`             | `"chat"`       | Conversation records                     |
| `agent/`            | `"skill"`      | Agent execution logs                     |
| Other               | `"workspace"`  | Ordinary project files                   |
| (old memorize)      | `None`         | A single-file path with no track concept |

**Second layer: RecallFile.track / RecallFileSegment.track — “What kind of document is this?”**

There are only two values: `"memory"` for a topical memory document and `"skill"` for a skill document.

**The mapping between the layers:**

```
Resource.track    →    RecallFile.track
─────────────────────────────────────────
"chat"            →    "memory"
"skill"           →    "skill"
"workspace"       →    ❌ Does not generate a RecallFile
```

Workspace-track files store only Resources, with captions and embeddings, for `INDEX.md` retrieval. They do not synthesize documents or split segments.

RecallFileSegment.track is redundantly copied from the owning RecallFile, so retrieval can filter by track without a join.

:::note
It appears track will later be removed, with chat, workspace, and skill stored in separate database-table structures. That would be cleaner.
:::

### What is entry?

Entry (`RecallEntry`) is the core intermediate layer of the old memorize path: an **atomic fact** extracted by the LLM from source content.

For example, from a conversation:

```python
User: I am going to Tokyo on business next week. Help me book a flight for Monday.
Assistant: Okay, I have booked you a Monday flight to Tokyo.
```

The LLM extracts multiple entries:

| memory_type | summary                                                                |
| ----------- | ---------------------------------------------------------------------- |
| `event`     | The user will travel to Tokyo on business next Monday.                 |
| `behavior`  | The user prefers the AI to book flights directly without confirmation. |
| `profile`   | The user travels for business and may be a professional.               |

There are six `memory_type`s: `profile`, `event`, `knowledge`, `behavior`, `skill`, and `tool`. Each type has its own extraction prompt. The LLM runs once per type and extracts the entries belonging to it.

The extracted entries are embedded, then assigned through RecallFileEntry to the corresponding RecallFile, a topical document. Multiple entries are gathered into one file, whose content becomes a synthesized summary of those entries.

**Why does the workspace route skip entries?** Workspace source files—code, documents, configuration—are not conversations and do not suit extracting atomic facts by memory type. The workspace route instead has the LLM route and synthesize source content directly into RecallFiles, removing the intermediate entry layer.

## The Correspondence of the Three Memory Layers

### Data-model mapping

We all know the three-layer memory relationship: **Resource → Category → Memory Item**.

Mapped to the data model:

```python
Resource     = Resource        (raw material: one file or one conversation)
Category     = RecallFile      (a topical document such as "Profile" or "Goals")
Memory Item  = depends on the route ↓
```

The Memory Item differs between the routes:

|             | Old memorize route                                  | New workspace route                         |
| ----------- | --------------------------------------------------- | ------------------------------------------- |
| Memory Item | `RecallEntry` (an atomic fact extracted by the LLM) | `RecallFileSegment` (a slice of a document) |

:::note
ADR 0007 calls these three layers L0 / L1 / L2: L0 is Resource, L1 is Category, and L2 is Memory Item. The meaning is the same; only the numbering changes.
:::

### The execution order of the two routes is reversed

The old route has a **counterintuitive feature**: the pipeline produces a Memory Item—an Entry—before synthesizing a Category—File. It goes from fine to coarse:

```python
Old-path execution order: Resource → Entry (fine) → File (coarse)
```

> Q: I wonder whether this synthesis from old-path Entry to Category is direct concatenation, or whether it calls an LLM again.<br>
> A: It is not direct concatenation. It calls an LLM again.

The new route reverses this:

```python
New-path execution order: Resource → File (coarse) → Segment (fine)
```

> Q: I wonder whether the reversed path affects fine-grained extraction. Does combining information organization and extraction weaken its ability to extract information?<br>
> A: It does reduce that ability. The former path performed independent entry extraction for every memory type—effectively N separate runs—then called again to synthesize.<br>
> **But this is not necessarily a regression**, because:<br>
>
> 1. Workspace source files—code, documentation, configuration—do not suit “extracting atomic facts” the way conversations do. How would you extract standalone memory items from a Python file? Synthesizing a summary document first and then splitting it is more reasonable.<br>
> 2. Workspace retrieval has **segment → file roll-up**. Even if a single-line hit is imprecise, once it rolls up to the right file, the user receives the complete document and loses no information.<br>
> 3. Retrieval through old-path entries is precise, but entries are isolated. Receiving `"The user likes black coffee"` provides no context. After rolling up to a file, the new route has the complete topical document.<br>

### The question of direction: why is workspace unsuited to “divide, then synthesize”?

But the key point seems to be this:

**The coupling direction of information organization and information retrieval is reversed.**

In endless chat memory, you need only catch a few relevant fragments, then reverse-retrieve the resource to obtain all related information. The information is complete and independent. A divide-then-synthesize method suits it.

But in a workspace, a fragments-to-resource approach does not work as well. What fragments can recall are code fragments. If you retrieve a Data Model, you still need another search to learn where that Data Model is used; it does not recall all related information. Instead, it retrieves a lot of garbage—many definitions with no relation to their use sites or architecture.

What we need is a high-level document readable by both agents and humans, and then fragments cut from that document.

So workspace as a whole suits a synthesize-then-divide form. That is the new route.

Precisely because of this difference, I think the chat and workspace paths should intentionally stay distinct.

---

If chat later becomes synthesize-then-divide too,

I could still accept it, but there would be some information loss in exchange for a major speed increase and lower token consumption. That depends on the trade-off, though I truly like LLM mode.

## What's different in ADR 0008

[ADR 0008](https://github.com/NevaMind-AI/memU/commit/ff90dac6976bc920667e03d295a75d5da8626f75)

### Input-source change: a change in the focus of attention

![](../../assets/img/memu-source-code-breakdown/memorize-pipeline-1.png)

In ADR 0007, we saw this diagram. It required `chat/`, `skill/`, and `workspace/` (everything else) as three sources, each taking a different route.

But it had an uncomfortable design problem: where do those three folders come from? Or, while a conversation is happening, do they change often? Skill is likely stable most of the time. A workspace may be an entire project workspace, and for a hundred-thousand-line project, modifying twenty or thirty lines at a time is insignificant against the whole project.

That makes the model dull to contextual change. Or more exactly, the three sources are unreliable to some degree: they inevitably make the model keep attending to unimportant things, without a good way to constrain it.

After ADR 0008, **the input source returned once more to conversations with an agent and tool-call records, as the only raw input.**

But the core of 0007 was not discarded. It uses an LLM to extract the input conversation data into different pieces to be processed:

`memory`, `project`, and `skill`.

### From large files to an embedding index

The three large files defined earlier—`MEMORY.md`, `INDEX.md`, and `SKILL.md`—were split into folders of L1 child files plus ~~L2 index files~~. This avoids handling a large amount of content whenever a large file is rebuilt.

The index itself is not stored on disk as a file. It is an embedding index, which is interesting. I wonder whether it simply stores L1 embeddings, or what exactly it does.

Claude says it does not merely turn L1 files into embeddings. It slices L1, creates embeddings, and attaches metadata such as the source file and line number.

That is indeed a very good approach.

Later, it only needs to modify the appropriate child file and update the index. The troublesome part of embeddings is deletion: metadata line numbers change, and when an entry in a child file is deleted, how should L2 automatically notice, delete its corresponding embedding, and update every entry?

It sounds troublesome, but it is only an engineering-control problem. And it can be avoided: large language models do not need exact line numbers; they can grep to locate content. The best approach is not to constrain line numbers, avoiding full metadata updates in the database.

Though perhaps there were never line references in the first place; Claude only used them as an example.

### CLI simplification

The originally defined `memorize-workspace` and `retrieve-workspace` were removed.

What I care about is whether hybrid search now directly replaces the old `old-retrieve`.

And I need to confirm whether every `on_turn` memorize step first calls an operation that semantically separates a conversation into three tracks. That consumption is not small, though it is invisible when asynchronous.

### The trade-off in on_turn frequency

After discussing it with Claude, since `retrieve-workspace` has been removed, hybrid search must fall onto the former `retrieve` design. In other words, `old-retrieve` will be directly replaced because it is too heavy.

That is indeed a more comfortable architecture, because when workspace and chat were initially separated, some part of the architecture always felt wrong to me.

But whether the three-way separation happens every conversational turn or is submitted in accumulated batches is still under discussion. It affects whether the process is too heavy, and directly changes how many turns occur before memU runs. mem0 runs once every conversation turn; for memU, splitting memories every several rounds changes its runtime frequency. Users could configure it. If I designed it, I would do that.

And following this design philosophy, I cannot imagine what it would do without splitting into three paths first.

Also, if it splits into three paths every turn, does it need at least four LLM calls?

Claude says yes. It is not light. According to Claude's analysis, old memorize generally did not run every turn; it would manually process an entire long conversation in a batch. ADR 0008's on_turn design hopes to trigger automatically, but frequency becomes the problem. If it runs every turn, users may find that their memory files consume more tokens than their conversations.

I suddenly thought that a lightweight LLM call could decide whether enough messages have accumulated since the last memorize. That would avoid fixing the number of rounds while still triggering automatically.

Claude added that token count could decide whether to memorize.

## What's new in ADR 0009 and 00010?

Although I have not followed the ADRs recently, I have actually already been working on them.

Most of my work over the last few days has been:

- Aligning memU commit's embedding return contract: [#504](https://github.com/NevaMind-AI/memU/pull/504)
- Removing environment, turn, and repeatedly injected `AGENTS.md` information from Codex classification to avoid token waste and extracting memories from irrelevant content: [#511](https://github.com/NevaMind-AI/memU/pull/511)
- Adding a fast agentic-install workflow for the latest HEAD: inheriting old configuration, checking for new configuration, and inheriting the memory database. It is very convenient, especially in OpenClaw: [#527](https://github.com/NevaMind-AI/memU/pull/527)
- Fixing duplicate and empty memorize input for OpenClaw: [#533](https://github.com/NevaMind-AI/memU/pull/533)

These are all interesting, especially the last one. It made me decide to inspect the input classified by every adapter and its final output, looking at what redundancy each contains.

And today I wrote [[RRF vs. Hybrid Search: How Should Time-Based Retrieval Be Blended, and How Does It Fit Project and Companion Scenarios?]] here, because debugging without pause makes me lose myself. I need to let things settle.

There is another article in progress as well.

But the source-code progress feels strange. The content of 0009, 00010, and 00011 is almost implemented, only rather hastily; all vibe has been doing intensive QA lately.

Yet the Hybrid Search and BM25 promised in 0007 still have not landed, though the improvement should be substantial.

I now want to align the source code and ADR documents, then see what gaps and mismatches there are in the implementation of 0009 and 00010.

For example, the source code added a WorkBuddy adapter, which was unexpected.

:::note[claude]

### What aligns

The behavior declarations for the five hosts in ADR 0010 align with the source code line by line, with no deviation:

- Every host's session path, instruction-file path, `classify()` semantics, and timestamp handling match the ADR table.
- Hermes really does open SQLite read-only with `?mode=ro` (`hermes/sessions.py:72`), and a test verifies that writes raise `OperationalError`.
- Cursor truly has no timestamp, inherits the base `timestamp()` returning `None`, and records null in the manifest.
- OpenClaw truly handles both ISO strings and epoch milliseconds in timestamps (`openclaw/sessions.py:82-93`), distinguishing them with a `> 1e11` threshold.
- `TranscriptSource.exists()` defaults to `root().is_dir()`, while Hermes overrides it as `self._db.is_file()`; both behave as ADR describes.
- At the configuration layer, `build_service_from_env()` truly raises `ConfigError` when `MEMU_DB` is missing through `require()` in `env.py:94-99`; it does not silently fall back.

### What diverges

**1. `memu retrieve` is not at all the heavy LLM-routed path ADR 0009 describes**

ADR 0009 spends considerable space on lines 89–92 emphasizing that the inject hook must **never** call `memu retrieve`, because it is an “LLM-routed path (intention routing, sufficiency checks, summarization), far too heavy to run on every turn.” It therefore needs a dedicated `progressive_retrieve` path.

But opening `src/memu/cli.py:92` shows that `memu retrieve` calls `service.progressive_retrieve()`—the **same function** called by host adapters through `memu-codex retrieve`. The description at `cli.py:145` even says `"Single-shot embedding retrieval ... (LLM-free, fast)"`.

In other words, the premise ADR 0009 uses to explain why host adapters need their own retrieve subcommand—that `memu retrieve` is too heavy—**does not exist in the code**. The heavy LLM-routed retrieval does not exist anywhere in the codebase. There is a hollow layer of reasoning between the ADR's architectural narrative and its implementation.

**2. “Every entry point calls `build_service_from_env()`”—the `memu` CLI itself does not**

ADR 0009 lines 121–125 claim that “every entrypoint calls it: the `memu` CLI, `memu-codex retrieve`, and the bridging pipeline's prepare and commit.” The bridging pipeline does call it (`pipeline.py:55` and `pipeline.py:103`), and host-adapter retrieval does too (`retrieval.py:31`).

But the `memu` CLI itself uses its own `_build_service()` in `cli.py:68-83`, constructing the service through argv parsing rather than `build_service_from_env()`. It reads `config.env` as a fallback, so the normal result is consistent—but this differs from ADR's claim of a single source of truth and one function serving every entry point. Two construction paths exist.

**3. `install-instruction` and `remove-instruction` are public CLI commands that ADR 0009 does not mention**

ADR 0009 lists all host CLI verbs as `retrieve`, `prepare`, `commit`, `verify-resources`, `doctor`, and `docs`. But the actual shared CLI in `host_cli.py:3-5` also has `install-instruction` and `remove-instruction`. These are registered in `instruction.py:294` and `instruction.py:314`, the entry points for users to install and remove instructions, rather than internal implementation details. ADR's scope description misses them.

**4. WorkBuddy is a sixth host adapter with no ADR coverage**

`pyproject.toml:69` registers `memu-workbuddy`, fully implemented in `src/memu/hosts/workbuddy/`. Its session format resembles Codex but has different record types: `input_text` / `output_text`, and `function_call` / `function_call_result` as separate types. It completely follows the HostSpec pattern of 0010, but ADR 0010's table and text list only five hosts.
:::

ADR 0009 says there should not be any heavy LLM retrieval, so all LLM Retrieve vanished overnight =-=.

But the Hybrid Search promised in ADR 0007 seems about ready to land. We can recently implement wikimem's ADR too and start testing.

ADR 00011 seems to involve a paradigm-level design. We will break it down separately later. It seems meant for a general scenario, and we can also look at how XnneHangLab should adopt this general paradigm.

It is worth noting that every one of our adapters triggers retrieval through Skills, not on_prompt.

Whether `CLAUDE.md` or `AGENTS.md`, they are not “absolutely safe.” Forgetting, laziness, and hallucination still happen in long documents.

We added a [simple A/B test](https://github.com/NevaMind-AI/memU/issues/507) then.
