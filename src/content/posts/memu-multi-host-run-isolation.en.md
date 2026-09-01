---
title: "Re-Reading memU: Multi-Host Worktrees, Run Isolation, and Proactive Memorization"
published: 2026-09-01
category: technology
kind: learning-note
tags:
  - memU
  - 架构
  - Agent
  - Memory
  - 并发
description: "Starting from a five-minute trigger and a ten-minute execution time, this article re-examines memU's multi-host worktrees, marker lifecycles, Recall File mirrors, and per-run isolation for proactive memorization."
series:
  - Long-Term Memory
lang: en
translationKey: memu-multi-host-run-isolation
---

![Re-reading memU: multi-host worktrees, run isolation, and proactive memorization](../../assets/img/memu-multi-host-run-isolation/PixPin_2026-09-01_17-48-12.jpg)

:::note[AI Collaboration Disclosure]
This article was created jointly by Xnne and [Korewaxnne](https://github.com/xnne-bot) (a cyber cat). Xnne supplied the questions, architectural judgments, and final decisions; Korewaxnne helped trace the implementation, organize the argument, and prepare the Chinese and English versions.
:::

Returning to memU after some time away, I found that parts of my earlier understanding had already expired.

That is not unusual. memU has been evolving rapidly, and I have worked on its multi-host adapters, bridging pipeline, scheduled tasks, and Recall Files. Once a system keeps growing new capabilities, the easiest mistake is not failing to understand the code. It is continuing to carry an old architecture diagram in your head and unconsciously using it to explain today's behavior.

This article continues [[What Is memU? Let's Break It Down (An Ongoing Series)]] and [[memU's Architectural Shift Through the Eyes of a Consumer-Facing Developer]]. This time, however, I will not follow an ADR line by line. I will begin with one concrete scheduling question and use it to clarify memU's current concurrency boundaries, filesystem responsibilities, and next design for proactive memorization.

::github{repo="NevaMind-AI/memU"}

## Starting with “Triggered Every Five Minutes, Runs for Ten”

memU's passive memorization is performed by each coding agent itself. A scheduled task for each host launches an agent session and runs the following pipeline:

```text
prepare
  → slice new content from session logs
  → mirror Recall Files from the store
  → generate jobs

agent self-evolve
  → process jobs in order
  → modify memory / skill
  → describe resources touched during the run

commit
  → compare against the content-hash baseline
  → submit changes to the store
  → advance the cursor and clean up ephemeral run files
```

Agent self-evolution is the expensive part. It reads transcripts, makes judgments, and edits Markdown. It is not a script that finishes instantly.

That gives us a simple stress case: what happens if the scheduled task fires every five minutes while each run takes ten minutes?

Over time, close to half of the triggers will indeed do no work. More precisely, however, they are not blocked by a marker after entering `prepare`. They are skipped by the scheduling layer before a second bridging process starts:

- Windows Task Scheduler uses `-MultipleInstances IgnoreNew`. When the old instance is still running, the new trigger is ignored;
- the Unix cron wrapper acquires an atomic `mkdir .bridge.lock`. If the lock already exists, the new trigger records `skipped: another bridging run is in progress` and exits successfully.

This is therefore not a random 50 percent probability. It is a stable outcome produced by the relationship between run duration and trigger interval. If a run lasts slightly longer than ten minutes, the trigger at minute ten may also arrive before the previous run exits, so the execution ratio will no longer be exactly one in two.

This small example exposes a distinction that had remained blurred for a long time: **what do the marker, lock, and manifest each protect?**

## Three Local States That Are Easy to Confuse

| Object                                              | Scope                              | Actual responsibility                                                                 |
| --------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| `.bridging_run.<host>.json`                         | One host's bridging cycle          | Records when `prepare` started so `commit` can report the duration of the whole cycle |
| `.bridge.lock` / Windows `IgnoreNew`                | One host's official scheduled task | Keeps that host's bridging runs single-instance                                       |
| `.memory_manifest.json` / `.memorize_manifest.json` | One worktree or memorize run       | Stores the Recall File content-hash baseline used by `commit` to detect changes       |

### The Bridging Marker Is Not a Lock

The contents of `.bridging_run.<host>.json` are simple:

```json
{ "started_at": 1788253200.0 }
```

Every `prepare` overwrites it at startup. `commit` reads the timestamp and calculates the duration of the entire round—from prepare through agent self-evolution to commit. A successful commit deletes the marker; a failed commit keeps it so that a retry can still close the same cycle.

It never checks whether an old marker exists, and it never rejects a second prepare. The 24-hour limit in the code merely means that a duration longer than that is no longer trusted. It does not mean the marker expires or releases a lock after 24 hours.

The real single-instance guarantee always comes from the outer scheduler.

### The Lock Protects a Host's Long-Lived Shared Worktree

Each host now has its own runtime worktree:

```text
~/.memu/hosts/<host>/
  sessions/
  jobs/
  memory/
  skill/
  resources.md
  .session_manifest.<host>.json
  .session_manifest.<host>.json.pending
  .memory_manifest.json
  .bridging_run.<host>.json
  .resource.tmp
```

The concurrency boundary is therefore:

```text
Official bridging runs of the same host: mutually exclusive
Bridging runs of different hosts: may run concurrently
Manual prepare that bypasses the wrapper: outside scheduler protection
```

Cross-host concurrency is safe because Claude Code, Cursor, Codex, Pi, and the other hosts modify disjoint trees. Same-host concurrency is unsafe: `prepare` regenerates jobs and session slices, while a successful `commit` cleans them up. If two processes share that state, one can delete work the other has not yet processed.

The Unix wrapper treats a `.bridge.lock` older than three hours as stale. This is an explicit engineering trade-off. Never reclaiming the lock would let one crash wedge the schedule forever; reclaiming it means that a legitimate run lasting more than three hours may overlap the next trigger. An ordinary ten-minute run never approaches that boundary.

## The Store, Working Mirrors, and Hash Baselines

Before understanding the concurrency model, we also need to identify where Recall Files actually live.

The authoritative state in memU is not any Markdown directory. It is the shared persistent store: usually a database in local mode and a remote service in Cloud mode. Every host reads the same `~/.memu/config.env`, so memory learned from one host can be retrieved from another.

The local `memory/` and `skill/` directories are **mutable working mirrors**. Agents edit those Markdown files directly. The manifest is the **content-hash baseline** representing a particular point in time.

```text
Shared store                        authoritative state
Local memory/ and skill/            mutable working mirrors
.memory_manifest.json              baseline from the last successful commit
.memorize_manifest.json            baseline for the active proactive run
```

### The Host Bridging Data Flow

A complete host bridging run proceeds as follows:

1. `prepare` paginates through every Recall File in the store;
2. it atomically writes them by track into that host's `memory/` and `skill/` directories;
3. on first contact with the worktree, it bootstraps `.memory_manifest.json` from the store-derived content;
4. the agent modifies the working mirrors according to the jobs;
5. `commit` compares the current contents against the manifest and reads only new or changed files;
6. `commit_results` submits those changes to the shared store;
7. only after the store accepts them does the program take a new snapshot, promote the pending session cursor, and remove the run's jobs and session slices.

One unintuitive detail matters here: host bridging does not rebuild its baseline after every prepare. The first prepare bootstraps it; afterward, successful commits are what primarily retake it.

Suppose a run crashes after the agent edits files but before commit. If the next prepare rebuilt the baseline immediately, those uncommitted edits would be absorbed into the definition of “unchanged” and could never be diffed again. Retaining the last successful commit's baseline lets the recovery run recognize and submit the unfinished output.

### `(track, name)` Defines Conflict Semantics

The identity key of a Recall File is `(track, name)`. `memory/Profile` and `skill/Profile` are different objects, while two files with the same name in the same track refer to the same object.

Multiple hosts may begin from the same old version and independently modify the same `(track, name)`. There is no three-way merge, version check, or compare-and-swap. The later commit replaces the earlier one in full.

```text
Host A: store v1 → edit Profile → commit v2
Host B: store v1 → edit Profile → commit v3

Final state: v3
```

The word “atomic” needs a carefully limited scope here:

- local mirrors use a temporary file plus `os.replace`, so readers never see a half-written file;
- one Recall File is created or updated as a complete body rather than textually merged;
- a multi-file `commit_results` call is not necessarily one global atomic transaction;
- the current diff propagates creations and content changes, but not local deletion, because the submit API has no removal path yet.

This model is not perfect, but it is simple and recoverable. It also matches the concurrency decision already made: **allow independent working copies to evolve in parallel, and resolve conflicts with last-writer-wins at `(track, name)`.**

## Proactive Memorization Does Not Need All of the Host Complexity

Passive bridging and proactive memorization accept different kinds of input.

Host bridging must handle long-lived session logs, incremental cursors, self-session recognition, recurring schedules, and crash leftovers. Proactive memorization receives one explicit conversation from a developer and hands prepared jobs to the current agent. It does not need to inherit the host pipeline's entire lifecycle.

A developer workspace can currently be described as:

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

`.memorize_run.json` has a different meaning from the bridging marker. It means that one proactive memorization run is still unfinished in this workspace:

- prepare rejects a new run when an active one exists;
- commit requires an active run;
- a successful commit removes the marker and ephemeral files;
- a failed commit preserves the state for retry.

That protects the sequential lifecycle of one shared developer workspace, but it also turns all proactive memorization into one global gate. Once proactive memory creation becomes frequent, inputs arriving concurrently from different hosts or sessions run into the same queue.

## Target Layout: Every Memorization Is an Independent Run

The right design is not to remove all protection from a shared workspace. It is to reduce the isolation unit from a host to a run:

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

`~/.memu/developer` becomes only a namespace for runs. Each `memu memorize prepare` atomically creates a unique `<run-id>`, then returns the run ID, worktree path, executor prompt, and matching commit command. The agent, `verify-resources`, and `commit` all bind explicitly to that run afterward.

This gives us a clear concurrency boundary:

```text
Host scheduled task: remains single-instance
memorize prepare: may create different runs concurrently
One run: remains single-owner / single-lifecycle
Shared store: accepts concurrent commits; conflicts are last-writer-wins by (track, name)
```

### The Marker Becomes Per-Run Lifecycle State

Each run should still have its own `.memorize_run.json`. It no longer prevents sibling runs from starting; it describes only the lifecycle of its own run.

While the marker exists, the run remains active and normally must not be deleted. A successful commit removes it—or transitions the run explicitly to a completed state—before the directory becomes eligible for cleanup. A failed commit preserves the marker, jobs, input, and working mirrors for recovery.

Run creation must also be atomic. Instead of checking `exists()`, completing prepare, and writing the marker only at the end, the flow should:

1. allocate the unique run directory through exclusive `mkdir` or an equivalent operation;
2. create the run state before materializing input or mirroring the store;
3. keep every later state transition inside that directory.

This does not require a global lock over every run. Only one run's own lifecycle needs serialization.

Automatic cleanup cannot rely on marker age alone. A run that has been idle for a long time may be abandoned, or it may contain Recall Files from a failed commit that never reached the store. A safer state record includes the `run_id`, creation time, and phase, along with an explicit abandon or clean operation.

## Why Not Introduce a Central Worker Yet?

From a consistency perspective, the most comfortable design is a central worker: enqueue every memorization request, let one finish and refresh the latest state, then start the next. Every task would branch from the newest snapshot, and same-key concurrent replacement could disappear entirely.

But this changes far more than the location of the queue.

Coding-agent self-evolution uses each host's own agent and token. A central memU server that runs its own LLM service contradicts the goal of letting the agent perform the work with its existing capabilities. Turning it into an MCP server that only coordinates retrieval and memorization introduces a persistent process, connection availability, sandbox access, host configuration, and lifecycle management.

It would also widen the gap between the open-source local edition and a cloud service. Where the coordinator lives, who keeps it online, and how restricted sandboxes such as Codex connect to it all become new system problems—not merely solutions to commit ordering.

CLI plus per-run worktrees preserves agent-owned self-evolution without adding permanent infrastructure. It accepts store-level last-writer-wins in exchange for a much smaller deployment and architectural cost.

This is not the strongest consistency model imaginable. It is the friendlier engineering choice under the current constraints.

## Codex Already Uses the Unified Host Layout

Codex once retained `~/.memu` as its runtime worktree for compatibility, but it has since moved to:

```text
~/.memu/hosts/codex/
```

The current Codex `HostSpec` does not override `base_dir`, so it uses the same `~/.memu/hosts/<host>` default as every other host. Its jobs, sessions, memory, skill, manifests, and resources all live in that runtime directory.

It is also important to distinguish source layout from user state:

- `src/memu/hosts/codex` is the source package for the Codex adapter;
- `~/.memu/hosts/codex` is the Codex bridging worktree on the user's machine.

They share a name, but one organizes code and the other stores runtime state.

## Root Memory Is a Shared Retrieval Cache

Even after Codex moved, the root still contains:

```text
~/.memu/memory/
~/.memu/skill/
```

These are neither a host's evolve worktree nor a complete Markdown snapshot of the database. They are a shared read-through cache materialized lazily from retrieval hits.

When retrieve receives a matching Recall File from the store, it atomically writes the complete body to `~/.memu/<track>/<name>.md`, then returns an openable `path` to the agent. Every host can therefore read results through a stable location, and a deleted cache file heals the next time it is retrieved.

“Read-only” here is an ownership contract rather than an operating-system permission:

```text
The store is the only authoritative write target
Host / run mirrors may be edited by agents and written back through commit
The root retrieval mirror is refreshed only by memU; agents read it and cannot commit from it
```

The root mirror should not be described as a complete materialized database view. A file that has never been retrieved may never appear on disk, while an object removed from the store may leave stale cache behind because no full sweep or deletion reconciliation runs here.

A complete, enumerable, version-consistent read-only view would need a dedicated producer: paginate through the entire store, generate every file in a temporary directory, reconcile removals, then publish through a directory version or index switch. That reintroduces questions about refresh frequency, failure recovery, and producer ownership.

The existing read-through cache already satisfies the agent's need to open retrieved results. If the path makes it look too much like authoritative memory, it could eventually move to `~/.memu/cache/recall-files/<track>`. That would improve naming and ownership clarity, but it is not required by the concurrency model.

## Final Architecture Decision

After tracing the whole path again, the final boundary is simpler than my initial mental model:

1. **Keep host bridging single-instance.** It protects a long-lived shared worktree with cursors, jobs, and crash recovery;
2. **Keep worktrees isolated by host.** Different hosts may evolve concurrently while sharing one authoritative store;
3. **Isolate proactive memorization by run.** `~/.memu/developer` manages `runs/<run-id>`, and sibling runs remain independent;
4. **Let each marker manage only its own lifecycle.** The bridging marker measures a cycle; the memorize marker records one run's active or completed state;
5. **Retain `(track, name)` last-writer-wins for shared conflicts.** Per-run isolation provides local filesystem safety, not transactional merging;
6. **Keep root Recall Files as a memU-owned shared retrieval cache.** Agents may read it, while only host or run worktrees can affect the store through commit;
7. **Keep the CLI rather than adding a persistent central worker.** This preserves complete multi-agent, multi-host, and open-source local deployment without a new infrastructure layer.

The important change is not merely adding a `runs/` directory. It is assigning three concurrency problems to the layers that actually own them:

```text
The scheduler prevents duplicate runs of one host
Filesystem isolation prevents local competition between runs
The store's identity key determines the outcome of concurrent commits
```

Once those three layers are no longer confused, proactive memorization does not need to overturn existing bridging. It only needs to draw the boundary again at a more appropriate granularity.
