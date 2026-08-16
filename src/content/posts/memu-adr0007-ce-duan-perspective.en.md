---
title: "memU's Architectural Shift Through the Eyes of a Consumer-Facing Developer"
published: 2026-07-02
category: Reflections
tags:
   - memU
   - Architecture
   - Agent
   - Memory
   - Product Thinking
description: "memU ADR 0007 overturns the earlier LLM mode: thoughts from a consumer-product developer and emotional-companion perspective."
featured: true
image: ../../assets/img/memu-adr0007-ce-duan-perspective/cover.png
series:
   - Long-Term Memory
lang: en
translationKey: memu-adr0007-ce-duan-perspective
---

## memU ADR 0007 Through the Eyes of a Consumer-Facing Developer

The reason for this started yesterday, while I was breaking down memU's source code in [[What Is memU? Let's Break It Down (An Ongoing Series)|What Is memU? Let's Break It Down]]. I found that memU's newly released ADR 0007 architecture document had almost completely overturned what I had broken down and understood =-=.

So I stopped.

And I talked with my mentor:

> I read ADR 0007. It unifies the former RAG/LLM dual retrieval modes into hybrid search (embedding + BM25). I understand the benefits: the retrieval path no longer calls an LLM, so speed and cost improve substantially.<br>
> But I have a concern. The old LLM mode's ranking had reasoning ability—for example, it could judge that an item was logically related to a query even when the keywords did not match. LLMs themselves keep improving, so retrieval could improve alongside the models. Once it switches to hybrid search, does this part become fixed?<br>
> Also, are there plans to restore LLM reasoning to the retrieval path in some other way later, such as through a reranker?

That expresses how much I liked the LLM mode design =-=. I like LLM retrieval, but it has been entirely removed in the new architecture.

Later, they asked me what I thought of this architectural change from a user's perspective.

But I am a somewhat unusual user. More exactly, I am a consumer-facing developer. I wrap projects like memU into my own project, then pass them on to users without development backgrounds. I am also my own user. I keep XnneHangLab open while playing galgames.

So my perspective is a little strange.

### Can an agent loop replace LLM mode?

Earlier, the idea was to hand reasoning to an agent loop and let the agent query multiple times. But agents lose ability in long contexts. I did something similar in XnneHangLab, relying on an agent's own ability for memory retrieval and extraction. After long conversations, tool-call completion rates dropped greatly, and skills with long tool chains triggered less often. Eventually I had to switch to several LLM calls in separate steps, breaking apart tool calls. Does merging multiple steps into an agent loop's first decision make that first step too difficult?

#### White boxes and unspeakability

Many consumer users want memory retrieval to be a white box: they want to see how their waifu's memory was awakened. memU's old LLM mode could provide a complete reasoning chain, but after ADR 0007 retrieval becomes semantic-similarity ranking plus keyword matching. Semantic similarity has a kind of unspeakability: it can only say “these two are related,” not “what is their relationship?”

That black box also means later optimization can only be judged through benchmarks, not analyzed and improved through a reasoning path.

### Why not distinguish retrieval by scene?

The conflict behind the refactor is that workspace and chat are two different input and retrieval scenarios. Supporting both LLM mode and RAG mode means maintaining isolated retrieval systems, which costs too much. So ADR 0007 unifies them under hybrid search and maintains only one retrieval path.

The architecture is tidier. But architectural tidiness and functional experience are often opposed. _Red Dead Redemption 2_ is not great only for its architecture and spirit; it is great because countless details create immersion. ADR 0007 makes one clean cut for tidiness, and at the same time cuts away many details that took a long time to polish.

These were originally different scenarios. While writing code, a workspace can stay open constantly; in a role-playing conversation, a workspace is unnecessary. Why must they use the same retrieval method?

> But as a framework layer, perhaps memU really should prioritize architectural tidiness. Leave complex features to consumer-product developers, such as Open-LLM-Vtuber and XnneHangLab.

### Two paths, two purposes

Chat follows the companionship path—personalization—while workspace follows project understanding—tooling. For chat, the LLM mode's reasoning chain and explainability are core value and should remain. Let the two paths go their own way; the architecture only needs to isolate them well.

This is fundamentally a product-positioning question: is memU only a code-memory tool for developers, or a more general memory project? I think memU can absolutely generalize—even to embodied-intelligence products when they eventually arrive. It need only leave room for other scenarios; it does not need to implement them immediately.

### The consumer-user perspective

I develop XnneHangLab. Its users are consumer users without development backgrounds; they even need to be taught how to buy a DeepSeek API. At least 80% are like this.

Before memU v1.0, LLM mode needed no embedding model and worked out of the box. After v1.0, embeddings became mandatory, raising the barrier sharply. Consumer-product developers face two choices: run embeddings on the user's host, which restricts platforms, or dump the trouble onto the user. After Open-LLM-VTuber introduced mem0, it made it optional, letting people who want to tinker handle it themselves.

Most of my users use Only-LLM plus skills and enjoy customizing skills and prompts, even when that is often negative optimization. Perhaps only 10% are truly willing to enable mem0.

---

What does ADR 0007 bring to these users? They do not write code, and their main scenario is conversation, so they receive none of workspace's benefits. Instead, memory retrieval changes from an explainable reasoning chain into score ranking: they no longer know why a memory was recalled and lose control over the retrieval process.

The speed experience is genuinely faster. That is what ADR 0007 brings.

## How Reversing Item and Category Affects Emotional Companionship and Wiki Links

This began here: https://github.com/NevaMind-AI/memU/issues/458

I opened a feature issue proposing wiki links to connect items across categories and create associative ability.

My mentor mentioned they were considering reversing category and item. The original event-flow sequence was:

```python
Raw data → LLM extracts atomic items → items enter categories → category summaries are generated from items
```

Later, it became:

```python
Raw data → LLM directly updates category documents → items are segmented from category content
```

The benefits are:

1. It avoids information loss from extracting items first; directly updating categories from raw data is more accurate.
2. Items no longer become stale, because they always reflect the latest memory result.

But the trade-offs may be:

1. Items become weaker at tracking specific events—what a user did on a particular day—because categories do not keep a ledger of events, so the items segmented from them naturally do not either.

My mentor asked what I thought as a user of emotional-companion memory.

---

After reversing item and category, each category update semantically restructures its items. They become unstable and no longer suit being link anchors. And when categories are overwritten, it becomes difficult to express the contradiction chains, causal chains, and evolution chains mentioned earlier.

The link role can only fall to resources, but resources are unrefined raw data, with many topics mixed into one conversation. For a resource-to-resource edge, it is unclear which two facts are related, and the cost of judging is high. After the reversal, links have nowhere suitable to attach.

The benefits certainly exist: information is more complete, and stale memory items almost disappear because items are generated from the latest categories each time. But the cost is that memory retains semantic state while losing contextual links. An agent remembers the fact itself but loses temporal order and causal relations unless it traverses resources.

For emotional companionship, that cost is substantial. Users care not only that “the agent knows I like cats” (a semantic state), but that “my cat stayed with me through the night I was sick, so I like cats” (a specific event). State-based categories distill events into states, and a shared experience disappears. This does not matter in tool-oriented scenarios, but in companionship scenarios, the events themselves carry the relationship.

If links must remain after the reversal, I think the better approach is to add an append-only contextual event line based on a timeline. Categories and items manage semantic state and can be overwritten; the event line manages causal and contradiction chains and is only appended to, never rewritten. This event line also makes up for the trade-off that event tracking becomes weaker—they are really the same gap. Relations such as CAUSED and SUPERSEDES are fundamentally relations between events, not between items after the reversal: relations between memories. The cost is maintaining two copies of memory.
