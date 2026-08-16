---
title: 'After Building Long-Lived Systems: Is the RAG Monster Right for Constructing a Personal Blog Graph?'
published: 2026-06-06
category: Reflections
tags:
  - LLM
  - RAG
  - Memory Systems
  - Blogging
description: Starting from hands-on work on an AI desktop companion's long-term memory, this post compares three long-term-memory approaches for LLMs and asks whether RAG belongs in a personal blog's relationship graph.
series:
  - LLM
  - Blogging
lang: en
translationKey: rag-blog-graph
---

My graduation project was about long-term companionship for an AI desktop companion. The main work was the desktop-companion system itself, but to retain memory across long contexts and separate conversations while keeping its persona from drifting, I also stitched together a long-term-memory module.

---

> This section gets a little technical. I originally planned to analyze it across several posts with papers, but I lost those drafts, so this is only a concise outline of the main thread.

## Why External Memory?

Why do we need **external** long-term memory in the first place? The GPT, Claude, and DeepSeek models we use today are fundamentally **stateless inference** systems: an LLM receives all context for an input at once, then produces one output. Different LLMs have different context-window limits, usually somewhere between 200K and 1M tokens. And a context window is not the same as _effective context_: performance can decline and hallucinations can appear before the stated limit, or, as the U-shaped curve in [[Attention Is Limited — Lost in the Middle]] shows, a large model can “forget the middle.”

So whether the goal is remembering things after starting a fresh context or slowing that performance decline, a memory system is necessary. It needs to be **external** to avoid taking up context, so it can be inserted only when needed to guide the model.

---

I lost my earlier architecture analysis because of [[When My Cloud Provider Disappeared: Rethinking the Shape of a Personal Blog and What Is Worth Recording]]. So here is a brief look at the main kinds of long-term memory used by LLMs today.

## Three Memory Approaches

### Approach One: Let the LLM Manage Markdown Reads and Writes Itself (OpenClaw)

::github{repo="zilliztech/memsearch"}

MemSearch is a representative project; OpenClaw uses it, or at least works on the same principle.

It manages core information such as an Agent’s behavior, memory nodes, self-understanding, and user preferences through files like Agent.md, Memory.md, Identity.md, and User.md. Every file is read and written as Markdown.

:::note

- Source files are **directly readable** and maintainable by people.
- It avoids the overhead and complexity of an additional embedding model or database.
- It is **very effective** for controlling preferences and writing style.
  :::

:::warning

- The full files are generally injected only at startup. Over a long context, the persona gradually **drifts or resets** to the LLM’s default style.
- The timing of reads and writes—the trigger conditions—is uncontrollable. Trigger rates are low and depend heavily on the LLM’s own capability. Claude performs relatively well.
- It is unsuitable for factual records across long timelines: the more it records, the more likely it is to **dilute** what originally mattered in the prompt.
  :::

### Approach Two: RAG-Based Vectorization and Similarity Matching (Mem0)

::github{repo="mem0ai/mem0"}

It captures conversation data produced by the user and LLM in real time, then uses an LLM to extract useful information, for example:

```text
User: The long-term memory system in my desktop-companion graduation project has been really hard to build lately.
LLM: XXXXXX
```

It might extract two memories: “The user’s graduation project includes a long-term memory system” and “The user finds their graduation project difficult.”

You can define the format and content of that extraction through prompts.

Those memories are then **vectorized** and stored in a database. Whenever the user asks something new, the system compares the question vector with vectors in the database, selects the top _n_, and inserts them as context to support the LLM’s reply.

**Write on a question; inject on a question.** Memory grows like a snowball.

There are also mechanisms such as forgetting and reordering, but they are outside the scope of this discussion.

:::note

- External and **insensitive to sequence**, which makes it well suited to long-term factual records.
  :::

:::warning

- It depends on embedding as an additional step and therefore needs another model.
- Stored vectors are **not human-readable**; their direction is uncontrollable and cannot be corrected directly.
- The bar for writing is low, so people usually need repeated cleanup to maintain quality.
- It remembers facts, but does not truly have a soul (**it is hard to influence the persona**).
  :::

### Approach Three: Have Multiple Agents Continuously Organize and Consolidate Markdown (MemU)

::github{repo="NevaMind-AI/memU"}

I have not used this one in practice, but I have looked into it.

Put simply, it uses an LLM’s own understanding in place of semantic matching through an embedding model.

A conversation Agent handles the conversation, while a separate group of **memory Agents** extracts memories, structures metadata, and builds an association graph. These memory Agents do not work only while a conversation is happening. Their highlight is that, even when nothing is being said, they keep traversing, retrieving, forgetting, and optimizing the existing memory structure almost like sleepwalking. _Like people consolidating memories through sleep._

Its final output includes human-readable Markdown source files, an association graph, metadata, and more.

It leads Mem0 in several public benchmarks, but I ultimately did not choose it.

![MemU benchmark comparison with other memory systems](../../assets/img/covers/memu-benchmark.png)

:::note

- Memories are readable, and the structure is **far more elegant** than the flat structure used by something like MemSearch.
- There is no embedding black-box layer in the middle.
  :::

:::warning

- Retrieval is not especially fast. More memories do not make it faster; it **cannot be parallelized** and is constrained by the retrieval LLM’s own reading and summarization speed.
- Token consumption is high. Memory Agents are demanding about model choice, so speed, understanding, context length, and price all need to be balanced. Claude Haiku and DeepSeek-V4-Flash are good choices.
- The more memory data exceeds the LLM’s context window, the **worse the performance** becomes.
  :::

## Is RAG Suitable for a Personal Blog System?

This question arose because my blog’s content used to be messy, and simple categories and tags were not enough to summarize or distinguish it. More importantly, they made it hard to show the relationships between posts.

When I was first learning RAG, I wondered: could it uncover those relationships?

::github{repo="Lapis0x0/obsidian-yolo"}

This project does exactly that. Its author is [Shige](https://www.lapis.cafe/), who has also discussed the project extensively.

But from the standpoint of its purpose, can it really serve as an internal presentation layer for a blog system?

### The Limits of Vector Similarity

Based on what we have discussed above, RAG builds connections through retrieval similarity, whether vector semantic matching, keyword matching, or hybrid retrieval. Setting aside the complexity of computation and additional models, it ultimately returns a connection from one text chunk in an article to another text chunk in a different article. That connection _does not say what kind of relationship it is_; mathematically, it only means those two chunks are more related than a chosen threshold.

> Unlike extracting useful memories from conversation and converting them into vectors, blogs need to be processed through text chunking: each post is divided into chunks of a certain size and then converted into vectors.

So what we get is a relationship between a particular text chunk in one article and a particular text chunk in another—a relationship no one knows, and perhaps even the author cannot explain. The key point is that **the relationship still cannot be clearly named.**

That means the problem troubling me remains unresolved: I still cannot both classify my blog clearly and manage and present the relationships between different posts. Other people would still think my blog’s content organization is a mess.

RAG creates a huge number of messy relationship links between posts, but cannot explain those relationships.

### The Short-Sightedness of Text Chunking

At the same time, those relationship links themselves are **short-sighted**. Why? The issue lies in text chunking. It limits relationship analysis to a small paragraph, or even a single sentence. But authors usually want a _global view_ of a relationship, like thematic reading, or perhaps only a _feeling_. That feeling or global view is something RAG cannot express. Even when it can, it is drowned out by the many low-level connections it calculates.

At least for now, RAG itself is unsuitable for directly presenting the relationship graph of personal blog content.

### An Alternative: a Citation Graph

If you want to show associations between blog posts, use a citation graph.

If article A cites article B, or vice versa, then A and B are connected.

Such a graph may not be very deep, but it reflects a direct relationship. And that direct relationship is supplied by the author, so it is persuasive. Generating this kind of graph is simple; it does not require masses of annotations even on the edges between nodes.

Putting the complete citation chain of an article at the end can also communicate useful information and guide readers onward.

### Where Should RAG Be Used?

It is not suited to a blog system’s public presentation, but it is a useful companion for building a personal knowledge base, just as it is in YOLO.

A blog system only needs to show what its author wants readers to see: categories, tags, series, shelves, and a graph of related citations.

RAG, on the other hand, can help the author discover possible connections within their articles—connections that may be difficult even for the author to explain. Gradually turning those connections into explainable, clearly articulated themes is the author’s work.

So, **a blog system is prepared by the author for readers, while RAG is prepared for the author**. It may guide what the author writes next.

There is also one point that is easy to overlook: RAG needs data volume. With only a few dozen posts, it yields little. Once a blog reaches hundreds or thousands of posts, its value rises substantially, because those obscure connections become clearer and converge rather than remaining isolated.

In short, RAG is for insightful, prolific bloggers—not for a lazy pigeon like me, who writes only in fits and starts.
