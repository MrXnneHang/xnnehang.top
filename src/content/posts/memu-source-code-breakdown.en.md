---
title: "What Is memU? Let's Break It Down (An Ongoing Series)"
published: 2026-06-29
updated: 2026-09-02
category: technology
kind: learning-note
tags:
  - memU
  - 记忆系统
  - 提示词设计
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

## Returning to memU 26.9.1 after a long time

Some of what I wrote above has apparently become outdated again =-=. It is hard to correct every detail one by one: I am not good at organizing documentation, but handing all of it to AI is not very interesting either.

Earlier I mentioned that once I understand how something is put together, I become reluctant to document it completely. I have been in that state lately, and it is not a good sign. But at least there is now something worth discussing—an architectural decision, I suppose.

### Background

Previously, memorization was passive and timer-driven. Every hour, each host would start a session, send an evolve prompt, and modify its Recall Files.

The first difficulty was that if a user had several hosts locally, the scheduled `prepare` tasks starting on the hour would contend for the workspace. Since evolve is time-consuming, that contention could become frightening.

To prevent contention, a marker was added to indicate whether a task had finished. If it had not, a new task was not allowed to prepare.

#### Q1. How does the marker prevent a new task from starting, and what is its lifecycle?

Separate workspaces were then provided for different hosts, yielding `~/.memu/hosts/*`.

Even now, though, the bug could be described as merely hidden rather than gone. A simple reproduction would be to change the scheduled interval to five minutes while each run takes roughly ten minutes. Then, after a scheduled task starts, `prepare` appears to be blocked around 50% of the time.

#### Q2. Is that reproduction theoretically sound? Is this fundamentally about the marker's lifecycle and behavior—does it always reject multiple tasks in one workspace?

Also, each host has an isolated full memory snapshot. Is `~/.memu/memory` a retrieval-only snapshot, while the memory under each host is what actually gets updated?

#### Q3. When does a host take that snapshot, and when does it feed the snapshot back into the root directory?

Even now, separate snapshots across hosts can still cause memories to be lost through overwrites by `(track, name)`. But that atomic overwrite seems to be the most workable option. The ideal design would be:

A central worker would queue every task. Once one completes, it would synchronize the latest snapshot before the next begins. That would eliminate the need to distinguish read-only and writable snapshots.

Why is that not feasible? Even restoring a `memu-server` would not contain the scheduled-task behavior of all our hosts, and it would damage the original design.

We expect coding agents to use their own agent to evolve memories—through a Skill. We cannot realistically ask a Skill to connect to a local server: it cannot guarantee that the local server remains online. In addition, `memu-server` expects to run an independent LLM service inside the server, which conflicts with our hope of using each agent's own token budget. We would need something like EverMem: an MCP server that handles retrieval and memorization. That is a very heavy rewrite, and aside from making the memorize queue controllable, it does not solve much substantive—for example, the Codex sandbox problem.

The cost is enormous, because where the MCP server belongs becomes another question. By convention, it would usually end up in a closed-source repository as a cloud service. That would reduce the completeness of open-source memU and deepen the functional gap between its cloud and local versions.

Against that cost, atomically overwriting memories by `(track, name)` is already exceptionally friendly.

So the decision is to keep atomic `(track, name)` overwrites and retain the CLI.

That leaves a deeper question. Once active memorization is introduced, the old five-minute-versus-ten-minute problem returns: frequency must be resolved.

We must allow atomic overwrites produced across hosts, and also allow atomic overwrites produced within one host. In other words, we need to remove the marker restriction on evolve.

This is not an invitation to open everything completely. For hosts, we can keep the current behavior for now; changing it would be heavy and complicated.

Because the tentative plan is to use the recently added `memu memorize` CLI for active memorization, the memory snapshots and jobs created through that CLI should all live under `~/.memu/developer`. Ignoring the naming semantics for now, it seems we can put every active-memorize operation in that workspace and lift its marker restriction.

Create `~/.memu/developer/runs`, where every run is a complete workspace snapshot of the former kind. They do not share a marker.

![A proposed layout for isolated proactive-memorize runs](../../assets/img/memu-multi-host-run-isolation/PixPin_2026-09-01_17-48-12.jpg)

### Opus's first interpretation

We first need to separate three things that are easy to conflate:

1. `~/.memu/hosts/<host>/memory` and `skill` are **working mirrors** of Recall Files for an agent to operate on.
2. `.memory_manifest.json` is the **content-hash baseline** for that working mirror at the last successful commit.
3. `.bridging_run.<host>.json` is only a **timing marker** for a bridging cycle. The scheduler or wrapper outside it is what actually enforces a single running instance.

Therefore, the earlier ideas that “the marker blocks a new prepare” and “a host feeds its snapshot back into `~/.memu/memory`” do not describe the current implementation.

### Q1

The current `.bridging_run.<host>.json` **does not prevent a new task from starting**. It is not a lock, and nothing checks “the file exists, so reject `prepare`.”

At the start of every `prepare`, it writes directly:

```json
{"started_at": 1234567890.0}
```

If an older marker exists, a new `prepare` overwrites it. This write is best-effort: a failure only loses cycle observability and does not fail the task. `commit` uses the marker to decide whether that commit closes a cycle opened by `prepare`, and to calculate the total duration across prepare, agent evolve, and commit. A successful commit deletes the marker; a failed commit or a mid-process crash leaves it for a retrying commit to close the same cycle. The marker has no timeout cleanup. The 24-hour cap in the code only means that a duration beyond that is no longer trusted; it does not unlock anything after 24 hours.

The real mutual exclusion happens before the agent is started:

- When Windows Task Scheduler registers a task, it uses `-MultipleInstances IgnoreNew`. While an old instance is still running, the scheduler discards a new trigger before a second bridging process even starts.
- The Unix cron wrapper obtains an atomic directory lock with `mkdir ~/.memu/hosts/<host>/.bridge.lock`. While the lock exists and is less than 180 minutes old, a new trigger records `skipped: another bridging run is in progress` and exits with 0; a `trap` removes the lock when the process exits. A lock older than three hours is reclaimed as a crash remnant. That is an explicit trade-off between preventing one crash from permanently stopping scheduled work and allowing an extremely long job to be launched twice.

So the marker lifecycle is “written by prepare, deleted by a successful commit, retained after failure,” while the lock lifecycle is “acquired at the beginning of a scheduled task and released when the agent exits.” They are separate mechanisms.

#### Q1.1 Does the bridging task itself, rather than the marker, determine mutual exclusion?

That is: the marker is merely a hash identifier and has no locking role.

The actual lock depends on the scheduled task of each host. The conclusion therefore remains the same, and is even simpler: scheduled tasks are mutually exclusive within each host, but not across hosts.

Also, the newly added `memorize` interface's `prepare` does not introduce mutual exclusion either, right?

### Q2

The observed outcome—“trigger every five minutes, each run takes around ten minutes, and around half the triggers do not run”—is **theoretically mostly correct**, but it is not `prepare` being blocked by a marker, nor is it a random 50% probability.

On Windows, a trigger that arrives while the old instance is running is discarded by `IgnoreNew`; on Unix, the wrapper immediately skips it after failing to acquire `.bridge.lock`. Both happen before the second `prepare`, so the precise statement is “that scheduled trigger is skipped,” not “prepare blocks there.” If a run reliably takes slightly less than or about ten minutes, the trigger at five minutes is skipped, so over time roughly one in two triggers runs. If it takes slightly more than ten minutes, the trigger at ten minutes can also arrive before the old run exits, so the rate need not be exactly 50%.

The marker also **does not always reject multiple tasks in one workspace**. If the official scheduling entry point is bypassed—for example, by starting `prepare` manually while the scheduled task is running—both processes can enter; the later `prepare` merely overwrites the timing marker. This overlap is unsafe because `prepare` regenerates and clears old `jobs/*.txt` and `sessions/*.jsonl`, while a successful commit also cleans up those temporary files. On Unix, a run exceeding three hours may have its lock reclaimed as stale, creating another boundary where two runs can genuinely overlap.

That means “removing the marker's evolve restriction” cannot solve active-memorize concurrency, because the current restriction does not exist. To permit simultaneous runs within one host, the real change would be to remove or bypass the scheduler's single-instance policy and isolate mutable state—including `jobs`, `sessions`, the manifest, and the pending cursor—per run. The proposed `developer/runs/<run-id>` is actually addressing that problem.

#### Q2.1 Is the best approach to leave the existing scheduled tasks alone?

Following 1.1, does the `memu memorize` CLI itself currently have no mutual exclusion, so isolating its workspace would be enough to achieve what we want? That also matches my original expectation, and explains why I wanted to isolate `developer` outside hosts: it does not carry all the machinery of scheduled tasks.

### Q3

Here we must again distinguish a working mirror from a snapshot baseline. For Claude Code, Cursor, Pi, and hosts added later, the working root is `~/.memu/hosts/<host>`; Codex, for backward compatibility, still uses `~/.memu` directly. Therefore, `~/.memu/memory` **is not a retrieval-only root snapshot shared by all hosts**. It is effectively Codex's `memory` working mirror. The authoritative state shared by all hosts is the persistent store indicated by `~/.memu/config.env`: memU's database in local mode, or a remote service in Cloud mode.

A complete flow is:

1. `prepare` pages through `list_all_recall_files` from the shared store and mirrors every current Recall File by track into that host's `memory/` and `skill/`. Each Markdown file is replaced wholesale with a same-directory temporary file plus `os.replace`, preventing concurrent readers from seeing a partial write.
2. If this is the workspace's first prepare, the program creates `.memory_manifest.json` after mirroring and records the SHA-256 of every file. Later prepares do not rebuild this baseline; it should always represent the state after the last successful commit.
3. The agent works from `sessions/` and `jobs/`, directly modifying `memory/*.md` and `skill/*.md` in the host workspace.
4. `commit` compares the current files with `.memory_manifest.json`, reads only added or changed files, and writes through `commit_results` to the shared store. A Recall File's identity key is `(track, name)`, so an existing record with that key receives the whole new content rather than a text-level merge.
5. Only after the store accepts the commit does the program resnapshot `.memory_manifest.json`, advance the pending-session cursor, and clear that round's jobs and session slices. If the commit fails, none of those states advance, leaving them for a retry.

So there is no step where a host “feeds a snapshot back to `~/.memu/memory`.” The data path is:

```text
shared store
  ├─ prepare/retrieve → host A's working mirror
  ├─ prepare/retrieve → host B's working mirror
  └─ prepare/retrieve → Codex's ~/.memu/{memory,skill}

host working mirror ── commit → shared store
```

After one host commits successfully, another host will not see the new version in its on-disk workspace until its next prepare or retrieval-mirroring action. Thus stale snapshots can indeed create cross-host last-writer-wins behavior: if A and B begin from the same old version and both change the same `(track, name)`, the later commit overwrites the former in full. There is no three-way merge, version check, or compare-and-swap. “Atomic” here means only local replacement of a single mirrored file; `commit_results` behaves as create-or-update by `(track, name)`, not as a global atomic transaction across multiple files.

There is another boundary: the current diff submits only added and changed files. Deleting a Recall File on disk does not propagate a deletion to the store, because the commit API has no removal path yet.

#### Q3.1 Are all local Recall File trees actually snapshots, with only the database as the authoritative source?

Then each local Recall File tree aligns to the newest snapshot during prepare, and feeds changes back to the authoritative snapshot during commit, right?

## Opus's second interpretation: the follow-up questions

This round requires separating two different kinds of markers again:

- A host bridge's `.bridging_run.<host>.json` is a cycle-timing marker and does not enforce mutual exclusion.
- A developer memorize run's `.memorize_run.json` is an active-run marker and does participate in gating a workspace lifecycle.

They are both called markers, but their semantics differ.

### Q1.1

The direction—“the bridging task itself provides the real mutual exclusion”—is right, but its scope is more precisely: **each host's official scheduled task remains single-instance; different hosts are not mutually exclusive.**

On Windows, every host has its own Scheduled Task, and `IgnoreNew` blocks only a second instance of that same task. On Unix, every host's wrapper locks `.bridge.lock` below that host's working root. Thus Claude Code's bridging and Cursor's bridging can run at the same time because their tasks, lock directories, and working trees differ; but a second trigger of the same Claude Code scheduled task is skipped if the first has not ended.

So it is not “scheduled tasks are mutually exclusive across hosts,” but:

```text
one host's official bridging runs: mutually exclusive
different hosts' bridging runs: not mutually exclusive
manual prepare bypassing the wrapper: not protected by that exclusion
```

Also, `.bridging_run.<host>.json` is not a hash identifier. It stores only a `started_at` timestamp; `.memory_manifest.json` stores the Recall Files' content hashes.

`memu memorize prepare` follows a separate lifecycle. It is neither started by the OS scheduler nor uses `.bridge.lock` or `IgnoreNew`, but the current implementation is not completely ungated: its default workspace is `~/.memu/developer`, where it has `.memorize_run.json`. If `prepare` finds that file already present, it fails directly with:

```text
memorize workspace already has an active run
```

A successful prepare creates the file; `commit` requires it to exist; a successful commit deletes it; and a failed commit retains it for a retry. It is closer to a state marker for “this workspace has a round not yet committed” than to bridging's timing marker.

It is still not a strict concurrency lock. The code first checks whether `.memorize_run.json` exists, then materializes input, mirrors the store, generates jobs, and only finally writes the marker. Two near-simultaneous prepares can both pass the check before the marker exists, then overwrite each other's `input/`, `jobs/`, `memory/`, manifest, and other files. It can reject the ordinary case of opening a new round while the previous one is unfinished, but cannot safely resolve a TOCTOU race between two processes starting together.

#### Q1.2 We currently have two separate protections for single-instance execution and workspace contention

One comes from a host's scheduled task and is bound to that task.

The other is the `.memorize_run.json` check that blocks `memu memorize` preparation. I had not noticed it before, which is why I conflated it with the host mechanism.

What we should now do is change the `memu memorize` workspace to runs only, allowing multiple hosts to reuse that workspace through the interface to create their own runs. `.memorize_run.json` would no longer block another prepare; it would become a sign that this workspace's responsibility has ended and it can be cleaned up.

Keep the host scheduled tasks' single-instance strategy unchanged.

### Q2.1

Yes, **the best approach is to leave the existing host scheduled tasks' single-instance strategy unchanged**. Host bridging shares a long-lived working tree within a host: `jobs/`, `sessions/`, the pending cursor, the manifest, and the resource log. It also handles the scheduled task's own session identity, crash leftovers, and cursor advancement. Allowing overlapping scheduled tasks for one host would reintroduce cleared jobs, duplicate or missed session consumption, and other complexity that active memorization does not need to take on.

Active memorization should solve concurrency under the developer path. Your “a complete isolated workspace for every run” direction hits the existing seam exactly, because `MemorizeWorkspace` already keeps every piece of mutable local state for one round below a replaceable `base`:

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

The CLI already supports `--workspace`, so mechanically each run can be isolated by pointing it at a different directory, such as:

```text
~/.memu/developer/runs/<run-id>/
```

But the default is still the shared `~/.memu/developer`, and the CLI does not automatically create a run ID. So “isolating the workspace is enough” is the right implementation direction, but is not yet the default behavior: a caller must pass a unique `--workspace` every time, or the CLI itself must allocate `runs/<run-id>` and carry that path through the later verify and commit commands.

Nor does every run need to have no marker. A safer definition is: **every run owns its own marker, and sibling runs do not share one.** Then `.memorize_run.json` can still constrain the prepare → agent → commit state machine inside a single round without restricting another run from proceeding. To prevent two processes from preparing the same run directory, the check-and-create of its marker should be an atomic exclusive creation rather than the current `exists()` check followed by creating it only at the end of prepare.

Workspace isolation resolves local file contention; it does not isolate the shared store. Multiple runs may still start from the same old version and submit different results to the same `(track, name)`, leaving the later submission to overwrite the former in full. As long as we accept last-writer-wins for `(track, name)`, that is expected semantics rather than a problem `runs/` can eliminate. In other words:

```text
per-run workspaces solve local concurrency safety
(track, name) overwrites determine shared-store conflicts
```

This also explains why `developer` should stay separate from hosts: it needs only input materialization, Recall File mirroring, jobs, a diff baseline, and a commit lifecycle. It does not need to replicate host bridging's session cursor, self-session detection, or scheduler state.

### Q3.1

The high-level understanding is right: **the shared persistent store is authoritative, while every local file tree is a working copy built around it.** Strictly speaking, local `memory/` and `skill/` are not immutable “snapshots”; they are mutable **working mirrors** that the agent edits directly. The manifests' content-hash baselines are what represent a moment-in-time snapshot.

The three objects should therefore be named separately:

```text
shared store                         authoritative state
local memory/ and skill/             mutable working mirrors
.memory_manifest.json
or .memorize_manifest.json           diff snapshot baseline
```

“Prepare aligns and commit feeds back” is also broadly correct, but the more precise flow is:

1. `prepare` fetches the current Recall Files from the shared store into the current working mirror;
2. the program records a hash baseline for that mirror;
3. the agent modifies the mirror;
4. `commit` diffs the current content against the baseline and submits only added or changed Recall Files to the shared store;
5. after the store accepts the submission, the program updates the local baseline and clears the round's temporary state.

This does not feed files back into an “authoritative snapshot”; it submits changes to the **current state of the authoritative store**. Other workspaces do not hot-sync automatically after the store changes; they see new content at their next prepare or retrieval-mirroring action.

There is also a small difference in baseline timing between host bridging and developer memorization:

- developer memorization creates `.memorize_manifest.json` after mirroring the store during every new run's prepare, because every input and lifecycle is independent;
- host bridging creates `.memory_manifest.json` only when its workspace is first prepared, then mainly resnapshots after successful commits, ensuring failed-run changes are still detected during a later retry.

Therefore, the proposed `developer/runs/<run-id>` can be understood as each run branching from the same authoritative store into an independent mutable working mirror at startup, then merging back into the store by `(track, name)` at commit time. It is not a database-transaction-style branch merge; it is last-writer-wins submission from independent working copies.

#### Q3.2 Why does Codex retain `hosts/codex` even though it already uses `~/.memu/memory`?

Can we stop treating Codex as special and return it to `hosts/`? That would make the root directory truly read-only: something readable from the database source, rather than a strange place that is both readable and writable.

## Opus's third interpretation: Q1.2 and Q3.2

### Q1.2

Yes, we can now clearly separate the two layers of single-instance protection:

```text
host bridging
  └─ scheduler-level single instance: protects one host's long-lived shared working tree

memu memorize
  └─ workspace active run: protects one active-memorize local state machine
```

The target architecture is essentially as you described: **leave host bridging as it is; change only how developer memorization allocates workspaces.**

One phrase needs a small adjustment. `.memorize_run.json` should not entirely “stop blocking prepare”; rather, it should **stop blocking prepares for other runs**. A single run directory still must not be prepared twice, because even after different runs are isolated, a second prepare in the same run would overwrite its `input/`, `jobs/`, manifest, and working mirror.

The more precise layout and responsibilities should be:

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

Here:

- `~/.memu/developer` is only a namespace for runs, no longer the workspace of a single round;
- every `memu memorize prepare` atomically allocates a new `<run-id>`;
- different hosts and sessions can use the same CLI to create runs, without another per-host partition;
- prepare returns the run ID and concrete path, and later agent, `verify-resources`, and `commit` commands explicitly bind to that run;
- `.memorize_run.json` constrains only the run that contains it, never a sibling run.

Its role therefore narrows from a global gate for the entire developer workspace to a **per-run lifecycle marker**. But “can be cleaned up” should be understood the other way around: the presence of the marker means that round is still active and usually cannot be removed. A successful commit deletes the marker, or records an explicit completed state, after which the run can be collected. A failed commit leaves the active state and working files in place for retry.

An active marker alone cannot determine whether a long-inactive run was abandoned or awaits manual recovery. If automatic GC is ever added, it should record a `run_id`, creation time, and state, then provide an explicit abandon or clean command. It should not delete solely because a marker is old: it may contain Recall Files from a failed but not-yet-committed run.

The current `exists()` check for `.memorize_run.json` also has a TOCTOU window before the final creation. With per-run workspaces, the natural fix is not a global lock for all runs, but:

1. atomically allocate a unique run directory with an exclusive `mkdir` or equivalent;
2. atomically create the run's state file before materializing any input or mirroring the store;
3. perform all later state transitions only inside that directory.

This lets multiple hosts create different runs concurrently while preventing a single run from being prepared twice. The shared store still accepts concurrent commits with last-writer-wins behavior by `(track, name)`, but that is the accepted submission-conflict semantic, rather than workspaces corrupting one another.

The final boundary can therefore be compressed to:

```text
host scheduled tasks: remain single-instance
memorize prepare: permits concurrent creation of different runs
the same run: remains single-owner / single lifecycle
shared store: permits concurrent commits; conflicts are later-writer-wins by (track, name)
```

### Q3.2

First, an earlier conclusion based on an old comment needs correcting: **Codex no longer uses `~/.memu` as its bridging working tree; it has already moved to `~/.memu/hosts/codex`.**

Codex's current `HostSpec` does not override `base_dir`, so it uses the unified default `~/.memu/hosts/<host>`. Its guide explicitly places jobs, sessions, memory, skill, the manifest, and resources under:

```text
~/.memu/hosts/codex/
```

That migration was completed as part of the fix for different hosts trampling a shared working tree when memorizing simultaneously. References in `host_cli.py` and the older ADR saying “Codex keeps `~/.memu`” were historical documentation that was not cleaned up, not current runtime behavior.

Also, `hosts/codex` can refer to two different things:

- `src/memu/hosts/codex` is the Codex adapter package in the source tree, containing the session parser, HostSpec, and installation guide;
- `~/.memu/hosts/codex` is the Codex bridging working tree on a user's machine.

The former organizes source code; the latter is runtime state. Whether Codex uses the root directory has no relationship to why the source package exists.

The actual layering now mostly matches what you wanted:

```text
shared store                         authoritative source

~/.memu/memory and skill             shared derived retrieval mirror

~/.memu/hosts/codex/...              Codex's writable evolve working tree
~/.memu/hosts/claude-code/...        Claude Code's writable evolve working tree
~/.memu/hosts/cursor/...             Cursor's writable evolve working tree

~/.memu/developer/runs/<run-id>/     active-memorize writable working tree (target layout)
```

The root `memory/` and `skill/` are no longer written by Codex either. Once the retrieve hook receives matching Recall Files from the store, it atomically writes them to `~/.memu/<track>/<name>.md` and returns an openable `path` to the agent. All evolve writes happen in a host's or developer's own working tree.

From an **ownership-semantics** perspective, the root mirror should already be considered read-only: an agent reads it but cannot commit edits to it back into the store. The only legitimate writer is memU's own retrieval/materialization code. “Read-only” here is a consumer contract, not a filesystem permission.

If we also made it unwritable at the OS-permission level, the current implementation could not work unchanged, because retrieve needs to:

- create the mirror for an initial hit;
- refresh a file with current store content on every hit;
- regenerate a file a user has deleted by mistake;
- use atomic replacement so an agent never sees a partially written file.

More importantly, the root mirror is currently only a **lazily generated, read-through cache of retrieval hits**, not a complete materialized view of the database. Files never hit by retrieval may not exist, and records already gone from the store may leave old local files behind because there is no full sweep or deletion reconciliation. So `~/.memu/memory` cannot yet be defined as a complete readable representation of the database.

A strict, complete, read-only materialized view would require a dedicated producer that:

1. reads every record from the store with full pagination;
2. generates all memory and skill files in a temporary directory;
3. removes local remnants of store-deleted records;
4. publishes a new view by switching a directory version or index;
5. makes retrieval read that view rather than writing it itself.

That would introduce another global synchronization task and its refresh policy: who refreshes, when, and which version remains after failure. The current read-through cache avoids those concerns with a much smaller mechanism.

The more appropriate conclusion for now is:

- Codex does not need another migration; it is already under `hosts/codex`;
- root `memory/skill` should be described explicitly as a **memU-owned, agent-read-only shared retrieval cache**;
- memU may write it and every host may read it without muddling responsibilities; the key is that ordinary agent edits there cannot enter commit;
- if the directory name makes it look authoritative, it can eventually move to `~/.memu/cache/recall-files/<track>`, but that is a path migration rather than a necessary concurrency-model change;
- a dedicated producer is worth adding only when the product genuinely needs a complete, enumerable, version-consistent materialized database view—not merely to make filesystem permissions read-only.

In other words, the read/write split you want already exists. Its accurate form is not “the root directory is never written,” but:

```text
store is the only authoritative write target
host/run mirrors can be modified by agents and written back through commit
root retrieval mirrors can be refreshed only by memU; agents read them and cannot write back from them
```

That makes much more sense.
