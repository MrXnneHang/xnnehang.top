---
title: 'RRF vs. Hybrid Search: How Should Time-Based Retrieval Be Blended, and How Does It Fit Project and Companion Scenarios?'
published: 2026-07-21
description: 'A discussion inspired by MoeChat about RRF and Hybrid Search: how should time retrieval participate in hybrid retrieval, how should it adapt across scenarios, and where are the boundaries between wikimem and XnneHangLab?'
tags:
  - RAG
  - Hybrid Search
  - RRF
  - 记忆系统
  - 检索
category: technology
kind: learning-note
featured: true
series:
  - Long-Term Memory
  - NLP
lang: en
translationKey: RRF-vs-Hybrid-Search
---

![](../../assets/img/covers/PixPin_2026-07-21_12-26-10.jpg)

:::note
This continues the discussion in [[MoeChat: How AI Characters Remember You and Feel Emotions]].

At the time, we thought the time-based retrieval proposed by MoeChat was interesting and could be internalized into our own memory framework. This article analyzes a concrete approach and fills in some NLP knowledge along the way.
:::

## Plain-Language Summary

> This is the quick version. If you prefer my usual question-and-answer style, skip this section. We will discuss more there.

There is too little space in this article for my own conclusions, so I will summarize plainly. If you are short on time, this section is enough.

Hybrid Search specifically means combining keyword matching with semantic-similarity matching. It usually combines their scores through weighted fusion, and that weight is a manually chosen value rather than something computed automatically.

RRF is a ranking-fusion method. It cares only about rank, not score. RRF can also fuse Hybrid Search results, but there is a problem: it does not care about the actual scores. From RRF's perspective, first place beating second by 150 points and first place beating second by 2 points make no difference.

It is like this:

```python
queue_1 = ["docs2", "docs1","docs3","docs4"]
queue_2 = ["docs3", "docs2", "docs1","docs4"]

rrf_index = ["docs2", "docs3", "docs1", "docs4"]
```

It is a way of ranking that intuition alone can understand. The algorithm matters less.

Another question is whether time retrieval should become a third route.

Here, we answer no.

If it became three parallel routes, we would have to introduce RRF as the fusion ranking.

That brings many problems. Scores become indices, and we lose the actual sense of distance between documents.

Also, RRF always introduces a systemic bias from the third, time-based route. If the query is time-related, it over-elevates time-related resources. If the query is not time-related, it always introduces noise because the time route always has an RRF rank. One route may not feel significant, but it is still harmful. Imagine ten or twenty routes, with only two or three active each time: the noise brought in by RRF would hide the information that truly matters.

In the end, we considered a gate plus a decay term. As for the specific decay and how to reduce total latency in the concrete chain, we will only know after implementing the ADR in wikimem.

---

We also discuss some less concrete things here.

Memory structures, diary formats—you do not need to care about those. Even I do not care now. It was only a process of clarifying frameworks and application boundaries, and of sorting out companion and project scenarios once more. Maybe I will never read it again, because it will become my project's structure. If I need to refine it later, I will return here, draw out new questions, and discuss them again. That is all. I enjoy the process of moving from chaotic confusion to unified clarity; for me, the process of recording matters more than the recorded conclusion.

## I Know Little, but Have Many Questions

In [[MoeChat: How AI Characters Remember You and Feel Emotions]], we promised to learn a little about concrete designs for multi-route hybrid retrieval.

What I know now is limited to a few names: Hybrid Search and RRF ranking fusion. I know Hybrid Search combines keyword matching and semantic similarity. I know that when fusing scores, comparable weighted scores must be normalized, which is complicated, while RRF only cares about rank and is simple and forceful. It suits methods whose scores cannot be combined.

But I wonder whether Hybrid Search and RRF differ fundamentally. More precisely, Hybrid Search generally seems not to choose RRF for fusion. Why not? What performance loss or disastrous effects would forcing RRF onto Hybrid Search bring? Would originally interpretable semantic scores be forced into indices? What would that cause?

Then we will look at adding time beyond semantics and vectors, as we considered in MoeChat. But because time is a ranking problem without a concrete score, it seems we could only use RRF.

We will also discuss whether directly fusing three routes with RRF is preferable to using time as a gate.

Forcing time into Hybrid Search creates problems. For example, if a time window contains many memory records and the user only asks `Do you remember what I usually ate for lunch last week?`, the topic is narrow.

If we force the three routes together, after retrieving the time range we must run Hybrid Search again. Otherwise, there is too much memory. Even one evening's memories cannot all be stuffed into context, much less an entire week.

But running Hybrid Search again reveals structural redundancy: one Hybrid Search across all time and one Hybrid Search across a selected time range. In MoeChat, does it directly recall all diary content in a time range with no second filter? This needs confirmation. Is it because LTM contains too little content for a second filter to be necessary, or is there another idea?

:::note[Korewaxnne]
Confirmed, looking back at the breakdown in [[MoeChat: How AI Characters Remember You and Feel Emotions]]:

MoeChat's LTM retrieval is **pure gating with no second-stage selection**. The concrete process is:

1. A user message first goes through `jioNLP` to extract time expressions such as “yesterday” and “last Friday,” then parse them into a timestamp range.
2. A **binary search** over sorted timestamps using `bisect_left/bisect_right` locates every memory in that range in O(log n).
3. Optional: if `enableLongMemorySearchEnhance` is enabled, cosine similarity filters once using a 0.32 threshold, but this is only filtering, not an independent semantic-retrieval route.
4. **If the user message contains no time expression, LTM does not participate at all** and the function returns empty.

So your guess was right: it recalls **all** memories inside the time window without a second Hybrid Search. The reason is also what you thought—the LTM writes fact-like JSONL entries by day, with only a few entries per day, so one entire day fits into context. It does not avoid a second Hybrid Search because of some design philosophy; **the data volume is simply small enough that it does not need one.**
:::

A better derivation, then, is to make time a gate: only when the user strongly activates a specific time should it define a broad time range, and then Hybrid Search runs within that range. But this also creates a problem: Hybrid Search cannot work independently, and time processing might take a while because it is still unclear whether time reasoning should depend on an LLM.

Perhaps this must begin from purpose. For MoeChat, the original purpose of LTM and time retrieval is simple: to let the model answer concrete questions such as “What did I eat the night before last?” In its application setting, LTM writes fact-like records, which suit this kind of retrieval, and there are not many of them.

In my desktop-companion scenario, I would directly use three-route hybrid retrieval, with simple RRF fusion—not for a sophisticated reason, but so time retrieval can work independently like MoeChat's. And I have a simple mind; RRF suits my taste.

## Hybrid Search and RRF: Choosing a Two-Route Fusion Method

### The relationship between Hybrid Search and RRF

Does Hybrid Search have a particular relationship to RRF? Is it as I understand it: Hybrid Search can choose either RRF or weighted fusion as its method?

:::note[Korewaxnne]
**Yes, exactly that relationship.**

Hybrid Search is a **strategy**: “I use keyword search and semantic search at the same time, then combine the results.”

RRF is **one fusion method**: “How do I combine the two result sets?”

So Hybrid Search needs to choose a fusion method. There are two common ones:

1. **Weighted Score Fusion**: normalize both route scores, then calculate a weighted sum. For example, `0.7 × semantic score + 0.3 × keyword score`. You can tune the weight and explain why a result came first.
2. **RRF (Reciprocal Rank Fusion)**: ignore scores and use only rank. The formula is `1/(k + rank)`, then adds reciprocal ranks from each route. It is simple and forceful, and needs no normalization.

As an analogy: Hybrid Search is “I want to travel to my destination,” while RRF and weighted fusion are “take the bus or a taxi.” Both get you there, with different trade-offs.
:::

Wait, are those weighted-fusion weights not calculated automatically? Are they set manually?

:::note[Korewaxnne]
**They are set manually, not calculated automatically.**

Weights in weighted fusion—semantic 0.7 and keywords 0.3, for example—are **hyperparameters**, like a learning rate. You choose them and tune them through experiments.

The usual approach is to take annotated queries plus expected results, run different weight combinations, see which produces the best retrieval metrics such as nDCG or MRR, then use that one. There is no gradient descent optimizing the value behind the scenes.

This is also an advantage of RRF: it requires no weight tuning. You can use it immediately. Weighted fusion needs an evaluation set to tune reliable weights; without one, you can only guess by feel.
:::

Why would it not use RRF? If RRF is forcibly applied to Hybrid Search, what performance loss or disastrous impact follows? What if interpretable semantic scores are forced into indices?

:::note[Korewaxnne]
**Hybrid Search can use RRF, but in most scenarios it is not worthwhile because it throws away score information for no reason.**

Keyword search through BM25 and semantic search through cosine similarity both assign every result a **concrete score**. Those scores matter: the gap between cosine 0.95 and 0.60 conveys far more than “first versus second.”

If you use RRF, you throw away every score and retain only rank. Specifically, you lose:

1. **Score-gap information.** In RRF, semantic first place at 0.95 and second at 0.94 is exactly the same as first at 0.95 and second at 0.30: both are “first versus second.” But in the latter case, second place is not relevant at all.
2. **The ability to tune weights.** With weighted fusion, you can say “semantics contributes 70%, keywords 30%” and tune by scenario. RRF cannot offer that granularity of control.
3. **Explainability.** Under weighted fusion, you can say “this was ranked first because its semantic score was 0.92 and its keyword score was 0.85.” Under RRF, you can only say “its combined ranks were highest.”

The conclusion is simple: **when both routes have scores, weighted fusion is better** because it retains more information. RRF's natural setting is one where a route has no comparable scores, such as a time dimension, which has ordering but no relevance score.
:::

RRF does indeed ignore score and gap information. But it feels clean for inputs that have no scores themselves.

You can read [memU ADR](https://github.com/NevaMind-AI/memU/tree/main/docs/adr), especially ADR 0006, 0007, and 0008. Our retrieve is already implemented, though reading the source is the same.

Later it unexpectedly updated 9, 10, and 11 as well. That is not your responsibility; I will follow up later in [[What Is memU? Let's Break It Down (An Ongoing Series)|What Is memU? Let's Break It Down]].

:::note[Korewaxnne]
**memU uses weighted score fusion with min-max normalization, not RRF.**

According to ADR-0007: cosine embedding scores and BM25 keyword scores are each min-max normalized, then fused into one ranking. This is the classic weighted-score-fusion route.

But the source code currently runs vector-only cosine similarity; the BM25 route has not been implemented yet, so hybrid search remains at the design stage.
:::

## Adding a Time Dimension: The Challenges and Trade-Offs of Three-Route Retrieval

Now let us consider a harder problem.

If I add MoeChat-style time as a third route, it disrupts ADR 0007's established score fusion and seems to force RRF.

We can analyze this by application scenario, beginning simply with project scenarios and long-term companion desktop-companion scenarios.

Let us analyze three methods:

1. Run all three routes in parallel and fuse everything with RRF.
2. Run all three routes in parallel and do two things at once: RRF plus the original weighted fusion. If the time rank and other route ranks differ enough under RRF, use time directly; otherwise, ignore time and output the original result.
3. Treat time as a gating unit. Time defines the candidate-memory range, then Hybrid Search runs normally within it.

This feels difficult, so I will ask Teacher Fable. Teacher Fable, please analyze a better approach too if one exists.

:::note[Fable]
The conclusion first: **c is the main path, but it lacks half a piece; b can be discarded directly; and the “time working independently” that a wants is actually a degenerate case of c, so there is no need to retain three-way voting.**

### See the problem clearly first: time is not the same kind of signal as the other two routes

Semantic and keyword scores answer “**is this memory about this subject?**” That is relevance, which can be voted on. Time answers “**is this memory inside the range being asked about?**” That is a constraint. A memory outside “the night before last” is not “somewhat irrelevant”; it is **wrong**. Constraints should filter, not vote.

There is another subtler asymmetry. BM25 and vector candidate lists are **conditioned on the query**: if content does not match, it has no score and cannot enter the list, so these routes quiet down by themselves when the query is irrelevant. Time is different: every memory has a timestamp, so the time route **can always produce a complete ranking** no matter what the query asks. A voter that always has a vote in RRF creates systemic bias.

> That bias should not exist. So simple all-RRF is wrong: it both loses the precision and gap information of concrete scores and permanently introduces noise.

### a. All three routes through RRF—not disastrous, but needlessly imprecise

There are two problems:

1. For **queries without time intent**, such as “What anime do I like most?”, the time route degrades into a pure recency vote, elevating new but irrelevant memories. In project scenarios that is pure loss; in companion scenarios it barely counts as a freshness preference, at the cost of precision for every query.
2. For **queries with time intent**, such as “What did I eat the night before last?”, the time route must first parse “the night before last” into a range before it can rank by closeness to the target. In other words, a does not eliminate time parsing; you need the parser anyway. Once you have a range, voting is a detour: voting cannot guarantee the winner lies in the range. A memorable dinner from three weeks ago may semantically overwhelm an ordinary dinner from the night before last, and RRF cannot stop it. Answering “what I ate the night before last” incorrectly is a factual failure and the kind that damages trust most in a desktop companion.

> A very good correction. If we have already obtained the range, it should not enter the voting electorate at all.

### b. Dual fusion plus divergence trigger—discard directly

The trigger condition measures the wrong thing. Large differences between time ranking and semantic ranking are not a signal but **the norm**: novelty and relevance are naturally unrelated, so the lists almost always differ. That trigger either stays open or detects nothing. Evidence for whether time should be used lives **in the query**—words such as “last week” and “the day before yesterday”—not in divergence between result lists. Inferring query intent from result divergence uses the wrong sensor for the right decision.

It also requires maintaining two fusion methods plus a divergence threshold that is harder to tune than fusion weights. The original reason for choosing RRF was to avoid tuning parameters; b gives that benefit back.

> This path not only looks awkward but introduces a very difficult hyperparameter: when exactly is the gap too large? That would make the system weak.

### c. Time gating—the direction is right, and both concerns have answers

In engineering terms, c is standard **metadata pre-filtering** in a vector database: `WHERE ts BETWEEN ...`. ADR 0007's fusion formula does not need a single change; it simply runs on a filtered candidate set. Your two earlier concerns have solutions:

- **“Does time parsing need an LLM, and will it be slow?”** A desktop companion already runs an LLM each turn. Make retrieval a tool call and have the model produce `time_range` as an argument along the way, making parse cost effectively free. Common expressions—yesterday, the day before yesterday, last week, a date—can take a regex fast path. Expressions the regex cannot handle, such as “the day we last argued,” can only be handled by an LLM anyway: that is event anchoring, requiring retrieval of that event, its date, and then a window around it. This natural two-hop gate is not expressible as voting.
- **“Under a gate, time cannot work independently.”** A pure time query, such as “What happened the night before last?”, becomes: gate out the range plus an empty semantic query, then degrade into taking the top N memories in the range by time. That is MoeChat's behavior. As you observed, it is just gating; there was never a three-route fusion waiting to be copied. MoeChat can recall an entire section because its LTM is small. Your memory is larger, so Hybrid Search still runs inside the range—and that is exactly c.

Add one fallback and it is complete: when a parsed window retrieves nothing, automatically broaden it by ±1 day or use fuzzy boundaries, so one parsing mistake does not become “I do not remember.”

### But c lacks half a piece: time has two roles

Time does two different jobs in retrieval:

1. **Explicit time references**, such as “the night before last” or “last week at noon,” are hard filters—gates—as described above.
2. **Implicit freshness preference**, when the user mentions no time but what was discussed yesterday should surface more readily than something from three months ago. This does not need a third route. Add a small weighted time-decay term to the existing score fusion, for example $e^{-\Delta t/\tau}$. It has a score, can be normalized, and can be tuned, so it is fully compatible with ADR 0007's score fusion without changing to RRF.

The final shape is: **gate for role 1, decay for role 2, and the unchanged two-route weighted fusion**. The concept of a “third route” disappears completely. Time is never really a retrieval route because it cannot answer what a memory is about; it can only constrain a range or apply a small preference. RRF remains useful, but its proper setting is several genuine rankers with incomparable scores. Time is not a ranker, so it does not belong here.

### Closing by scenario

**Project scenarios:** even the gate can be simpler. Time in project memory is often really version: “what is the latest decision?” is solved by replacement relations at write time plus a recency tiebreak at read time, not by time retrieval. And the caller is already an agent; when a time query really occurs, let it pass an optional `time_range` parameter. **Do not perform intent detection inside the memory system when the query-understanding caller already did it.**

**Desktop-companion scenarios:** time is a first-class concern, with one lethal detail: contextual memory contains many semantically near-duplicate events—you ate lunch fifty times, and fifty memories are nearly identical semantically. **The only thing that distinguishes the lunch on last Wednesday is time.** The more near duplicates there are, the less reliable a soft preference or vote becomes, and the more necessary a hard constraint is. “What do I usually eat for lunch during the week?” runs cleanly through c: window equals last week, query equals lunch, top-k inside the window, then the LLM summarizes the pattern.

| Method                      | Project scenario                               | Desktop-companion scenario                                      |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| a. Three-route RRF          | ✗ Recency pollution; pure loss                 | △ It runs, but “the night before last” questions are unreliable |
| b. Dual fusion plus trigger | ✗ The trigger measures the wrong thing         | ✗ Same                                                          |
| c. Gating                   | ✓ Can simplify to an optional filter parameter | ✓ Main path                                                     |
| c plus decay                | ✓ A recency tiebreak is enough                 | ✓✓ Recommended form                                             |

One-sentence version: **explicit time filters, implicit time decays, and time is never a third route.**
:::

## Design Implementation: Time Fast Paths and Memory Structure

:::note[For readers passing by]
Up to the scenario table above, these are general conclusions worth taking away. What follows is a design workshop for our own projects, wikimem and XnneHangLab. It needs the context of [[MoeChat: How AI Characters Remember You and Feel Emotions]]; if you do not know that, skipping the second half loses no general knowledge.
:::

But I still hope the fast path for time retrieval can always activate and work independently, with intent recognition made into a tool call.

This involves quite a lot. You can look at:

::github{repo="XnneHangLab/wikimem"}

::github{repo="XnneHangLab/XnneHangLab"}

### Time fast path: regex and intent recognition as parallel tracks

I think wikimem should own a MoeChat-like fast time-retrieval path:

:::note
Several alternatives:

- **[dateparser](https://github.com/scrapinghub/dateparser)** supports more than 200 languages, including Chinese. It is rule-based and lightweight: `pip install dateparser`, then `dateparser.parse("昨天下午")` returns a datetime directly. It needs no jioNLP NER step; it works in one step.
- **[arrow](https://github.com/arrow-py/arrow)** plus handwritten regex: if time-expression patterns are enumerable—“yesterday,” “the day before yesterday,” “last week X,” “X days ago”—regex matching plus arrow's `shift()` can calculate offsets. A dozen lines can cover MoeChat's scenario with zero dependency overhead.
- **[TimeNLP](https://github.com/zhanzecheng/Time_NLP)** is a small library dedicated to Chinese time semantics, much lighter than jioNLP and focused only on time.

The most pragmatic choice is actually the second one. MoeChat needs to recognize only a dozen or so patterns—yesterday, the day before yesterday, last week X, X days ago, X month X day. Regex plus time-offset calculations are enough; it does not need a general NLP library.
:::

This was the plan we came up with last time.

I think wikimem should have a fast path like MoeChat's. Intent recognition and time analysis for expressions that a simple regex cannot hit could become a Tool Calling capability integrated into XnneHangLab. I do not want to mix responsibilities.

What does intent recognition add? It handles vague time expressions beyond a simple regex. I want us to focus on implementing the simple regex solution, then hand complex work to an intent-recognition tool call.

### Memory structure: the boundary between diaries and wikis

There is also the question of memory structure. Along a timeline, MoeChat remembers only factual contextual memories, while preferences, personas, and so on are separate structures.

But as I wrote in [[MoeChat: How AI Characters Remember You and Feel Emotions]], LTM and CoreMemory have somewhat unclear boundaries. That makes it look uncomfortable.

memU's early six memory types also make memorize very heavy. What do you recommend?

How should we store our memories? As JSONL fact fragments, or lively Markdown diaries written by a model?

More accurately, how do we define memory? What belongs in memory that can be recalled by time? Should it include every memory?

Should we use fact-only diaries like MoeChat's only for time recall? But are records of a model's emotions then unimportant? Emotion creates personality. If there are only facts and no context, there is no soul.

And since our wikimem supports both embeddings and zero-embedding mode, we need to reserve embedding storage for every retrievable memory. The embedding needs what information—dimension, embedding-model name? If names differ, should it warn users and ask them to rebuild the whole memory database?

What belongs in SQLite, and what belongs in Markdown?

Should we replace MoeChat's JSONL with SQLite for higher performance, then build a front-end system in XnneHangLab to visualize memory data, so users can browse it by time and search it by content?

But perhaps wikimem itself should provide this because wikimem is a framework. At least it should avoid insisting on a CLI, like a yutto serve RPC redesign, and expose data interfaces so other applications can wrap it. The transport protocol also needs planning.

At the same time, the Markdown diary system needs management too.

## Dividing Responsibilities Between Framework and Application

Teacher Fable, please help. We may need to update the ADRs for wikimem and XnneHangLab. We need to decide what belongs to the framework and what belongs to the application.

:::note[Fable]
I read both repositories: wikimem's current state, XnneHangLab's ADR-0001 through ADR-0003, and the wikimem plugin. First the general principle, then the parts.

### You have already drawn the boundary

ADR-0001 has a hard constraint: “retrieve makes 0 LLM calls; memorize makes ≤ 1 asynchronous LLM call, initiated by the host.” Extending that rule gives the entire answer:

**The framework handles deterministic mechanisms—rules, mathematics, and I/O. Anything requiring model judgment belongs to the application.** Embeddings are the only exception, but they are injected as pluggable, optional, and gracefully degradable; wikimem's zero-core-dependency nature is worth preserving.

Use that line to divide every question below.

### The time fast path belongs to wikimem, correctly

Design one parameter with two sources:

```python
index.retrieve(query, time_range=None)
```

- **No `time_range` given:** wikimem runs an internal regex fast path for yesterday, the day before yesterday, last week X, X days ago, and X month X day. Pure stdlib—`re` plus `datetime`—is enough. Do not introduce dateparser; a general library for “200+ languages” adds a dependency and violates the zero-dependency constraint. Arrow is unnecessary too; `timedelta` can do the calculation.
- **`time_range` given:** use it directly and skip regex. This is the application-side outlet for an intent-recognition tool call. An LLM handles expressions such as “the day we last argued” that regex can never reach, including two-hop event-anchor queries, but it finally produces the same structured parameter.

The two paths converge on the same parameter, so responsibilities do not blur: **regex is the framework's floor; the LLM is the application's ceiling; there is no third parser between them.**

### But fill one missing piece first: wikimem has no timeline yet

The code shows that wikimem has only a **state layer**—category/item wiki. It stores `ts`, but retrieval never uses it; there is no time filtering or decay. The earlier gating proposal has nothing to gate yet. **The event-stream primitive is missing.** So memory structure and time retrieval are the same problem.

### Memory structure: two primitives and one boundary rule

- **Diary, the event stream:** append-only, one file per day, time as the primary axis. This is a new primitive.
- **Wiki, the state layer:** existing category/items, content as the primary axis, editable.

The boundary rule is one sentence: **what happened goes in the diary; what is true now goes in the wiki.** MoeChat's LTM and CoreMemory are unclear because they divide by “importance” or “permanence,” which are continuous and changing and cannot make a clean boundary. “Event versus state” is discrete: a memory either has the property “when did it happen?” or it does not. The same event can appear in both: “On July 21, he said he changed jobs and sounded excited” in the diary, while the `work` wiki entry updates as state. They do not conflict.

Do not copy memU's six memory types into the framework. Those are content strategies for the state layer and belong in extraction prompts; your categories are already free. The six types make memorize heavy because each gets a separate LLM run. ADR-0001's “≤ 1 call” has already avoided that pit.

### Where emotions go: split them into two things

- **Emotions in events** belong in the diary. A diary entry should be a lively short segment written by a model—scene, emotion, and facts together. Your `diary_writing` skill prompt already does this. That is where the “soul” lives. It also answers JSONL fragments versus lively Markdown: **the diary should be lively Markdown and facts should go in the wiki. You need both, not one or the other.**
- **Current emotional state**, such as MoeChat's `emotion_state.json` valence/arousal model, is not memory. It changes every turn and does not need retrieval; it remains application runtime state.

What can be recalled by time? Only the diary. The wiki is not on a time axis. A future need such as “preferences added last week” can use `ts` as a filtering bonus, but it is not the main axis. Having every memory recalled by time is wrong: preferences should not be pulled out by “last week.”

### Storage: the filename is the time index; do not use SQLite yet

Use a Markdown file per day for diaries—`diary/2026-07-21.md`, one `## HH:MM` entry plus a timestamp comment. The easily overlooked benefit is that **the filename itself is the time index**. Gating a window means selecting files by date range, O(number of days), zero indexes and zero dependencies. MoeChat's daily JSONL proves this path. Then run existing BM25/fusion inside the window and the earlier c plan becomes complete.

SQLite's problem is not performance; it violates ADR-0001: “there can be no unreadable truth on disk.” Truth must be Markdown. SQLite can at most be a deletable derived cache, alongside `vectors.npy`. At the current scale—one desktop companion year is about ten to twenty thousand records—in-memory BM25 plus existing signature layers is milliseconds, so a cache is not needed. **Truth is always Markdown; SQLite is neither truth nor a cache for now. Revisit at one hundred thousand entries, and then use an FTS5 derived cache.** VectorIndex already leaves room as a Protocol.

### Embedding metadata: a real gap, but a lighter fix than you expect

The current `vectors.keys.jsonl` header only stores the vectors file; it records neither model name nor dimension. Your concern is correct. Add `{"model": ..., "dim": ...}` to the header, then compare it to configuration when opening.

But a mismatch should not “error and make the user rebuild the whole memory database.” Wikimem's truth is Markdown, and vectors are only a content-hash-keyed derived cache. **Changing the model means invalidating the cache and incrementally re-embedding as needed.** There is no database to rebuild. Match existing philosophy: mismatch means a warning, degradation for the current session, and a prompt to run a re-embedding command. Zero-embedding mode is naturally the end of this degraded path.

And one correction: do not reserve an embedding slot on every memory record. Putting vectors into truth files would destroy readable truth. The existing derived-cache design is right; keep it.

### serve and front end: the Python API is the contract; everything else is a shell

- **wikimem's contract is its Python API**, `MemoryStore` and `MemoryIndex`. M4 should be a thin-shell layer: both a CLI and `[serve]`—HTTP plus JSON as an extra, similar to `[embed]`—are skins over the same API. Do not create a transport protocol; HTTP plus JSON and a version are enough. Serve is for out-of-process consumers: other applications and independent browsers.
- **XnneHangLab does not need wikimem's serve** because it imports in-process already—milliseconds versus memU's two-second subprocess path. Visualization belongs on its own FastAPI/WebSocket routes.
- **The visualization UI belongs entirely to the application.** The framework guarantees data access: list dates, read a day, search, tail the journal. Its file-first design gives a free benefit: Markdown truth means Obsidian or any editor already works as a memory browser. That is enough for debugging; do not build UI in the framework.

### Put it into ADRs

wikimem currently has no ADR directory; framework decisions are all recorded in XnneHangLab ADRs. Since it is now an independent repository, its decisions should follow the framework. Also confirm whether `packages/wikimem` and the separate repository are the same code: the workspace appears to have `cli.py` while the separate repository does not. If they are two copies, they are already drifting.

(Postscript before release: I checked. It is not drift—the standalone repository checkout is merely four commits behind. The upstream already merged the zero-dependency CLI in [wikimem#12](https://github.com/XnneHangLab/wikimem/pull/12), and both are the same codebase.)

| Owner       | ADRs to write                                                                                                                                                                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| wikimem     | Diary primitive: daily Markdown, append-only; retrieval gets `time_range` plus stdlib-only regex fast path; optional recency-decay term enters fusion; vector cache records model/dimension and degrades on mismatch; M4 redefines CLI/serve as two thin shells.                         |
| XnneHangLab | Time-intent-recognition tool call for vague time and event anchors to `time_range`; elevate `diary_writing` into a formal memorize policy—when to write, what to write, and its voice; keep emotion state as application runtime; memory-visualization front end through its own routes. |

One-sentence version: **the framework manages deterministic mechanisms; the application manages costly judgment; what happened goes in the diary, what is true now goes in the wiki; truth is always Markdown, and everything else is a deletable cache or replaceable shell.**
:::

## Postscript

Thank you, Teacher Fable. While clarifying the relationship between RRF and Hybrid Search, it also made clear where wikimem should go and what XnneHangLab should own. I opened two PRs:

- [XnneHangLab#499](https://github.com/XnneHangLab/XnneHangLab/pull/499)
- [wikimem#14](https://github.com/XnneHangLab/wikimem/pull/14)
