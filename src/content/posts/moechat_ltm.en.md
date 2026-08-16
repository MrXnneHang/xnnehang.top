---
title: "MoeChat: How AI Characters Remember You and Feel Emotions"
published: 2026-07-15
description: "An in-depth look at how MoeChat builds long-term memory for AI characters, including its time-and-semantic hybrid retrieval—written for people interested in memory systems."
tags: [AI, LLM, MoeChat, RAG, Memory Systems]
category: Learning as I Build
draft: false
featured: true
series:
   - Long-Term Memory
lang: en
translationKey: moechat_ltm
---

![MoeChat cover](../../assets/img/moechat-beginner-guide/moechat-cover-poster.jpg)

:::note[AI Disclosure]
This article was **almost entirely written by Claude OPUS 4.6**, with Xnne reviewing it. Want to read the human-written parts? Skip directly to the Q&A.

Honestly, though, Claude did a much better job than Xnne at the architecture breakdown 😅

And this is not the end—it is only the beginning. It gave me many ideas and can be treated as a TODO. The breakdown felt great. I had honestly been a little afraid of MoeChat; its code is genuinely messy, and I had tried reading it many times without getting through. But Claude suffered on my behalf.
:::

---

## What Is MoeChat?

::github{repo="AlfreScarlet/MoeChat"}

<iframe src="https://player.bilibili.com/player.html?bvid=BV1djNdz2Ew2&autoplay=0&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" allow="fullscreen; picture-in-picture" style="width: 100%; aspect-ratio: 16 / 9;"></iframe>

MoeChat is an open-source system for creating AI characters that can **remember** and **feel**.

Most chatbots are goldfish—they start from zero in every conversation. MoeChat is different. It gives every character:

- **Long-term memory**—a diary system that extracts important content from every conversation, stores it, and automatically recalls it when relevant
- **Core memory**—permanent facts about you, such as your name, preferences, and relationship
- **An emotion engine**—based on a two-dimensional emotion model, valence plus arousal, with accumulated frustration, emotional-meltdown states, and even hormone-cycle simulation

It also supports voice—GPT-SoVITS for TTS and FunASR for ASR—but its real core is how it builds a persistent inner world for every character. This article is about that.

---

## Character Agent: One Folder, One Life

Every character lives under `data/agents/<name>/`. Everything about them is stored in isolation there:

```
data/agents/Chat酱/
├── info.yaml              # personality, system prompt, every feature flag
├── memory/                # long-term memory: daily JSONL files
│   ├── 2025-7-10.jsonl
│   ├── 2025-7-11.jsonl
│   └── ...
├── core_mem.yml           # core memory: permanent facts about the user
├── data_base/             # knowledge base: world-building knowledge
├── emotion_state.json     # persisted emotional state
└── assets/                # avatar images
```

`info.yaml` lets you turn each feature on or off:

```yaml
settings:
   writeLongMemory: true # write new memories after chatting
   enableLongMemory: true # retrieve memories while chatting
   enableLongMemorySearchEnhance: true # filter with vector similarity
   longMemoryThreshold: 0.32 # cosine-similarity threshold

   enableCoreMemory: false # extract user facts
   enableEmotionSystem: false # enable the emotion engine
   enableEmotionPersist: false # persist emotion across sessions
```

Notice that `writeLongMemory` and `enableLongMemory` are independent: you can write without reading, or read without writing.

### What do the files look like?

**info.yaml**—the character's “identity card”:

```yaml
name: Chat酱
user: 阁下 # how the character addresses you
birthday: "2022-03-17"
height: "160"
personality: 表面清纯可爱，实则腹黑毒舌，内心聪明机智...
description: Chat酱是存在于现代科技世界手机中的器灵...
customPrompt: 使用口语的文字风格进行对话，不要太啰嗦...
messageExamples: # examples of the character's speaking style
   - "人类视网膜的感光细胞不需要这种自杀式加班，您先休息一下吧。"
settings:
   writeLongMemory: true # write new memories after chatting
   enableLongMemory: true # retrieve memories while chatting
   enableCoreMemory: false # extract user facts
   enableEmotionSystem: false # enable the emotion engine
   longMemoryThreshold: 0.32
gsvSetting: # speech-synthesis settings
   textLang: zh
   gptModelPath: models/【萝莉】女仆_Ver-1.4-e15.ckpt
   sovitsModelPath: models/【萝莉】女仆_Ver-1.4_e24_s504.pth
   refAudioPath: models/tmp/020.wav
   promptText: 嗯，谢谢您的夸奖，主人可以喜欢就好。
```

**memory/2025-7-10.jsonl**—long-term memory, one entry per line and one file per day:

```jsonl
{"timestamp":1720627200,"text_tag":"去咖啡厅和朋友聚会","msg":"时间：2025-07-10 16:00:00\n{{user}}：今天下午和朋友去了星巴克，点了一杯拿铁\n{{char}}：听起来很惬意呢，阁下喝拿铁的话一般加糖吗？","vector":[0.0312,-0.0891,0.0456,...]}
{"timestamp":1720630800,"text_tag":"讨论周末旅行计划","msg":"时间：2025-07-10 17:00:00\n{{user}}：周末想去杭州西湖玩\n{{char}}：西湖这个季节荷花应该开了呢，阁下要不要带把伞防晒？","vector":[0.0178,-0.0623,0.0891,...]}
```

- `text_tag`: the summary extracted by LLM2, used for vector retrieval
- `msg`: the complete conversation, injected into LLM context when recalled
- `vector`: a persisted 768-dimensional BGE embedding, so it need not be recomputed on startup

**core_mem.yml**—core memory, permanent facts about the user:

```yaml
# 核心记忆文件，请勿自行修改！否侧会丢失索引！

aB3kX9mZwQ:
   time: "2025-07-01 14:30:00"
   text: 第一次相遇

pL8nR2vYcD:
   time: "2025-07-05 20:15:30"
   text: 用户今年25岁，是一名程序员

qM4wT7hNjF:
   time: "2025-07-08 19:22:10"
   text: 用户喜欢喝冰美式，不喜欢甜食

xK9sG3bPmW:
   time: "2025-07-12 21:05:45"
   text: 用户养了一只叫"团子"的橘猫
```

- Every memory has a short UUID as its key.
- `text` is a user fact extracted from conversation by LLM2.
- Everything loads into a FAISS index at startup for top-5 similarity search.

**emotion_state.json**—an emotional-state snapshot:

```json
{
   "valence": -0.25,
   "arousal": 0.41,
   "character_state": "正常",
   "latent_emotions": {
      "frustration": 3.8
   },
   "meltdown_start_time": null,
   "cycle_day": 18,
   "cycle_length": 28,
   "last_cycle_update_timestamp": "2025-07-15T00:00:00"
}
```

- Current state: slightly unhappy, with valence = -0.25 and medium arousal
- Frustration is accumulating—3.8 against a 10.0 threshold—but has not reached meltdown
- Day 18 of the hormone cycle, the luteal phase, when mood is relatively stable
- When `enableEmotionPersist` is off, this file is not generated and every restart resets it

---

## System Timeline: What Happens in One Conversation

Below is the full pipeline from “you send a message” to “a memory is stored.” This is the real core.

<div class="img-center" style="max-width: 20rem; margin: 0 auto;">

![MoeChat timeline](../../assets/img/moechat-beginner-guide/moechat-pipeline.png)

</div>

The key design is that **retrieval is synchronous**—memory is needed before a reply is generated—while **storage is asynchronous**—after a reply streams out, memory is extracted and saved in the background.

---

## Deep Dive: Long-Term Memory, the Diary System

### How memory is written

After an LLM reply is complete, a background thread calls `add_memory1()`. The concrete process is as follows.

**Step 1: LLM2 summarizes the conversation into a tag.**

A separate LLM, configured as `LLM2` in `config.yaml`, receives the user's final message and an instruction like this simplified version:

> “You are a daily-information extraction assistant. Extract the main activity from the user's conversation and generate a short-sentence summary suitable for vector retrieval. Record what they did, where they went, and what they ate. Do not record emotion or reflections—only concrete events. If it is only casual conversation, output ‘日常闲聊’.”

If LLM2 returns “日常闲聊,” the memory is **discarded**. Only meaningful events are stored.

**Step 2: Build a memory entry.**

```python
m_data = {
    "timestamp": 1720627200,                    # Unix seconds
    "text_tag": "去咖啡厅和朋友聚会",              # LLM2 summary, used for retrieval
    "msg": "时间：2025-07-10 16:00:00\n{{user}}：今天和朋友...\n{{char}}：听起来...",
    "vector": [0.123, -0.456, ...]              # 768-dimensional BGE embedding of text_tag
}
```

**Step 3: Append it to a daily JSONL file.**

It is saved to `memory/2025-7-10.jsonl`: one JSON object per line, one file per day.

### How memory is retrieved

When you send a new message, `get_memories()` tries to find relevant past memories.

**Path A: time-based queries, if your message mentions time**

The system uses `jionlp`, a Chinese NLP library, to detect time expressions:

- “昨天” → parsed into a timestamp range
- “上周五” → parsed into a timestamp range
- “两天前” → parsed into a timestamp range

It then performs a **binary search**—`bisect_left/bisect_right`—over a sorted timestamp array to find every memory in the range. This is why retrieval takes about 80 ms: it does not need to scan.

If `enableLongMemorySearchEnhance` is enabled, it further filters your message through cosine similarity using `longMemoryThreshold`, 0.32 by default.

**Path B: no detected time reference**

If your message mentions no time, the function returns early. It does not retrieve through the long-term-memory path. Core memory and the knowledge base still work normally through FAISS similarity search.

### Storage format

```
memory/
├── 2025-7-10.jsonl    ← one memory entry per line
├── 2025-7-11.jsonl
└── 2025-7-12.jsonl
```

Every line is a compact JSON object:

```json
{"timestamp":1720627200,"text_tag":"去咖啡厅和朋友聚会","msg":"时间：...","vector":[...]}
```

- `text_tag` is what gets embedded and searched—the key to retrieval
- `msg` is the full formatted text injected into LLM context when a memory is recalled
- `vector` is persisted, so it does not need recomputation on startup

### Core memory vs. long-term memory

|                    | Core memory                          | Long-term memory                           |
| ------------------ | ------------------------------------ | ------------------------------------------ |
| **Stores**         | User facts: name, age, preferences   | Daily events and activities                |
| **Extraction**     | LLM2 plus structured JSON prompt     | LLM2 plus free-form summary                |
| **Storage format** | YAML, one file                       | JSONL, split by day                        |
| **Index type**     | FAISS IndexFlatIP, in memory         | Binary search over sorted timestamps       |
| **Retrieval**      | Top-5 similarity search, always runs | Time range plus optional similarity filter |
| **Threshold**      | 0.31, hardcoded                      | 0.32, configurable                         |
| **Casual chat**    | Still extracts, may contain facts    | Discarded through the “日常闲聊” filter    |

---

## Deep Dive: The Emotion Engine

### Model: the 2D Russell circumplex model plus frustration

MoeChat uses a **two-dimensional emotion model** plus a hidden accumulated-frustration counter:

<div class="img-center" style="max-width: 32rem; margin: 0 auto;">

![MoeChat two-dimensional emotion model](../../assets/img/moechat-beginner-guide/moechat-emotion-model.png)

</div>

Plus a hidden dimension: **frustration**, which accumulates and triggers meltdown at a threshold.

- **Valence** [-1.0, 1.0]: how good or bad the character feels
- **Arousal** [0.0, 1.0]: energy or intensity
- **Frustration** [0.0, ...]: a hidden counter that grows from negative interaction

### How emotions update in every conversation turn

For every user message, the engine follows these steps.

**1. Call an LLM for sentiment analysis.**

A specialized LLM call using the SLM configuration analyzes the user message:

```json
{
   "sentiment": "positive", // positive | negative | neutral
   "intensity": 3.5, // 1.0 - 5.0
   "intention": "genuine_praise", // labels such as harsh_insult, playful_teasing
   "arousal_impact": 2.0 // -5.0: calming to +5.0: exciting
}
```

**2. Calculate the acceptance ratio.**

How much emotional impact actually lands depends on the character's current state:

```
acceptance_ratio = sigmoid(e * (impact_strength - resistance))
resistance = |当前效价| * 惯性因子
```

When a character is already in a strong emotional state—high absolute valence—it resists change more. This is **emotional inertia**: one kind remark cannot make someone deeply sad immediately happy.

**3. Update valence.**

```
final_delta = potential_delta * acceptance_ratio
new_valence = clamp(old_valence + final_delta, -1.0, 1.0)
```

**4. Update arousal using a permission factor.**

Changes in arousal are suppressed by how extreme the current arousal already is:

```
permission_factor = (1 - |arousal - 0.5|)^1.5
```

This creates an inverted-U curve: arousal changes easily near the middle, 0.5, but resists change at extremes, 0.0 or 1.0. You cannot make someone already manic even more manic.

**5. Apply a pull toward equilibrium.**

A constant “gravity” pulls emotion back toward neutral. Its strength depends on the hormone-cycle phase, if enabled.

**6. Accumulate frustration.**

```
frustration *= 0.95                    # natural decay every turn
frustration += impact * mood_bonus     # negative messages add frustration
```

`mood_bonus` is crucial: when the character is already sad, negative messages hit **harder**. This creates a spiral: once sad, it becomes increasingly easy to push the character toward meltdown.

### Three states

<div class="img-center" style="max-width: 24rem; margin: 0 auto;">

![MoeChat three-state transition](../../assets/img/moechat-beginner-guide/moechat-state-diagram.png)

</div>

- **Normal:** standard emotion processing using all the mathematical calculations above
- **Meltdown:** triggered when frustration exceeds a threshold, 10.0 by default. The character ignores user input. Emotion decays over time: `decay = 1000 / (x^2 + 1000)`. It lasts 90 minutes by default
- **Recovering:** linearly interpolates back to neutral over ten minutes

### How emotions affect a character's reply

After calculating a new valence/arousal pair, the engine generates an **emotion instruction** and injects it into the system prompt. It maps the 2D space into nine behavioral states:

| Valence   | Arousal | State       | Behavior                                                          |
| --------- | ------- | ----------- | ----------------------------------------------------------------- |
| > 0.6     | > 0.7   | Ecstatic    | Extremely enthusiastic; accepts all requests                      |
| > 0.6     | < 0.7   | Deep joy    | Warm, gentle, inclined to agree                                   |
| 0.2~0.6   | > 0.4   | Happy       | Friendly, optimistic, open to most requests                       |
| 0.2~0.6   | < 0.4   | Calm        | Peaceful, warm, stable                                            |
| -0.2~-0.5 | > 0.4   | Irritable   | Tense, impatient, selectively refuses                             |
| -0.2~-0.5 | < 0.4   | Indifferent | Flat tone, low energy, may refuse                                 |
| < -0.8    | > 0.7   | Furious     | Sharp tone, directly refuses                                      |
| < -0.8    | < 0.7   | Deeply sad  | Says very little—“嗯”, “…”, “随便”—and refuses effortful requests |
| Other     | Other   | Neutral     | Normal and balanced                                               |

This instruction is **prepended before your message** and sent to the LLM, so the model adjusts its tone and willingness to cooperate accordingly.

### Hormone cycle, optional

When enabled, a 28-day cycle adjusts the character's emotional responsiveness:

| Days  | Phase             | Emotional stability | Sensitivity        |
| ----- | ----------------- | ------------------- | ------------------ |
| 1-5   | Menstrual         | Medium, 1.3         | Slightly high, 1.1 |
| 6-12  | Follicular        | Stable, 1.5         | Normal, 1.0        |
| 13-15 | Ovulatory         | Most stable, 1.8    | Normal, 1.0        |
| 16-21 | Luteal            | Stable, 1.5         | Normal, 1.0        |
| 22-28 | Premenstrual, PMS | Least stable, 0.8   | High, 1.4          |

The premenstrual phase has low inertia, so emotion shifts easily, plus high sensitivity, which increases the impact of negative messages by 40%. Ovulation has high inertia, so moods are stable.

### Emotion persistence

If `enableEmotionPersist` is on, the full state saves to `emotion_state.json`:

```json
{
   "valence": 0.35,
   "arousal": 0.62,
   "character_state": "正常",
   "latent_emotions": { "frustration": 5.2 },
   "meltdown_start_time": null,
   "cycle_day": 12,
   "cycle_length": 28,
   "last_cycle_update_timestamp": "2025-07-15T00:00:00"
}
```

Without persistence, the character resets to neutral—(0, 0)—on every server restart.

---

## Quick Start, for People Who Only Want to Try It

```bash
git clone https://github.com/AlfreScarlet/MoeChat.git
cd MoeChat
uv sync
cp config.example.yaml config.yaml
# Edit config.yaml: set LLM.key and LLM2.key
uv run main_web.py
# Open http://localhost:8000/
```

The minimum `config.yaml`:

```yaml
LLM:
   api: https://api.siliconflow.cn/v1/chat/completions
   key: "你的密钥"
   model: Qwen/Qwen3-8B

LLM2: # required for memory extraction
   api: https://api.siliconflow.cn/v1/chat/completions
   key: "你的密钥"
   model: Qwen/Qwen3-8B
```

Without `LLM2`, a character can chat but never builds new memories.

---

## Q&A

### Some rambling first

Before beginning, let us ramble a little.

My connection with MoeChat really begins with [[Attention Is Limited — Lost in the Middle]].

I actually gave MoeChat's author an incorrect view, and I never had a chance to correct it. I feel a little guilty about that.

Honestly, when MoeChat was released, my understanding of memory was vague. MoeChat gave me an inexplicable favorable impression, but I kept reading it intermittently and never formed a complete picture. Now we have a chance, so let us take it apart.

### What makes MoeChat good as a companion system?

First, MoeChat is the only memory system I have seen so far that is sensitive to a timeline. It has strong recall for explicit points in a user query—`昨天`, `前天`, `上个月`, and `上周X`—because it supports time queries.

For time extraction, I remember it uses JioNLP to map a semantic time point into a concrete time string, then directly recall a MemoryItem from long-term memory. But the implementation feels awkward, heavy, and uncomfortable; it can be optimized.

Second, the author has a very clear sense of RAG's boundaries: retrieval by relevance. She uses RAG for the world book, a knowledge base about the world, and core memory, facts that occurred with the user. Those two really suit RAG. Long-term memory, by contrast, is recalled only by time, without deliberately mixing RAG in. This is an unusually lucid point in my view. It was also the foundation for her criticizing many long-term-memory systems in comments as merely putting all memory content into RAG with no novelty, and for calling hers the strongest memory system on Bilibili. She was extraordinarily clear-minded, at least more than I was then. The only optimization I can see is replacing pure-vector FAISS with BM25 plus embeddings through Hybrid Search. I cannot pick apart her present architecture; instead, I would align mine with it.

Third is the anthropomorphic emotion system that the author put enormous effort into. She seriously studied emotion models. It involves psychology; although I can say I have broad interests, when the author brings this out, I can only say my capacity for action is far inferior to hers. This emotion model and its effects deserve a separate article: should a model always say yes, or can it also say no? What effect does that have? Is being refused unacceptable for users, or can it preserve novelty and stir a desire to win? We will not expand that now. Let us focus on the memory system.

### Digging into jioNLP time-semantic extraction

Claude, please fill in the concrete implementation and feasible optimizations. We just mentioned that this method makes me uncomfortable, but I need you to explain what it actually does.

:::note[Claude]
**Concrete implementation:** in `utils/long_mem.py`, `get_memories()` follows this process:

1. It first prefixes the user message with `[时间]`, then passes the whole thing to `jio.ner.extract_time()`:

```python
res = jio.ner.extract_time(f"[{t_n}]{msg}", time_base=time.time(), with_parsing=False)
```

2. `extract_time` returns a list. `res[0]` is the base time, and `res[1:]` contains recognized time entities. Each one goes through `jio.parse_time()` to turn semantic time—“yesterday,” “last Friday”—into a `[start, end]` timestamp pair:

```python
res_t = jio.parse_time(t["text"], time_base=res[0]["text"])
time_st1 = int(time.mktime(time.strptime(res_t["time"][0], "%Y-%m-%d %H:%M:%S")))
time_st2 = int(time.mktime(time.strptime(res_t["time"][1], "%Y-%m-%d %H:%M:%S")))
```

3. After obtaining the time range, it uses `bisect_left` / `bisect_right` over the sorted timestamp array to locate every memory in the range in O(log n).

**What feels uncomfortable:**

- **Two NLP calls:** first `extract_time` recognizes entities, then `parse_time` turns them into timestamps. They are serial, and jioNLP itself is a rule-based Chinese NLP library with heavy parsing logic. Edge cases such as “大前天,” “这个月初,” or “国庆那会儿” may fail to parse and silently skip through `except`.
- **It uses only the first time range.** Although `time_span_list` may have several ranges, the final `find_range_indices(time_span_list[0], time_span_list[1])` uses only the first entity's start and end. If a user says “yesterday and last Friday,” only yesterday is recalled.
- **No time reference means no recall.** If no time entity is extracted, `time_span_list` is empty and the function returns directly—long-term memory does not participate at all. A query such as “What did we talk about before?” has no explicit time but clearly asks about history, yet LTM stays silent.

**Feasible optimizations:**

1. **Fall back to semantic retrieval.** When jioNLP extracts no time entity, do not return directly. Fall back to full-vector similarity search using the existing `enableLongMemorySearchEnhance`, so queries without time references can still recall memory.
2. **Support multiple time ranges.** Iterate over every range pair in `time_span_list` instead of taking only the first two values. Use `find_range_indices` for each and merge results.
3. **Use an LLM for time parsing.** Replace jioNLP with an SLM already configured as qwen3:0.6b, prompting it to output `[start_timestamp, end_timestamp]`. An LLM understands vague expressions such as “前阵子” and “好久以前” better than a rule engine, and the SLM infrastructure already exists, so no dependency is needed.
4. **Hybrid retrieval.** Run time range, BM25, and vector similarity in parallel, then use RRF to merge rankings. Time-sensitive queries take the time path, semantic queries take the vector path, and precise keyword matches take BM25; they cover one another.
   :::

What feels uncomfortable is that it calls jioNLP no matter what. In my view jioNLP's performance is not worth it. Ignoring synchronous execution, it is slow even to start. A rule-based solution is hard to compare with a large model, but an SLM introduces its own concerns: local memory, VRAM, and CPU budgets are often tight. Cloud is even less worthwhile; another LLM-call delay is not worth it, and the model does not need to be that smart.

Is there a more efficient rule-based library? I simply think jioNLP is a pile of mess. I dislike letting it enter my dependencies; I hate packages that try to do a little of everything with no clear topic or boundary, then offer neither performance nor accuracy.

:::note[Claude]
Several alternatives:

- **[dateparser](https://github.com/scrapinghub/dateparser):** supports 200+ languages including Chinese, is entirely rule based and lightweight, and installs with `pip install dateparser`. `dateparser.parse("昨天下午")` directly returns a datetime. There is no prior jioNLP NER step; it works in one step.
- **[arrow](https://github.com/arrow-py/arrow)** plus handwritten regex: if the time-expression patterns are enumerable—“yesterday,” “the day before yesterday,” “last week X,” “X days ago”—regex matching plus arrow's `shift()` can calculate offsets. A dozen lines can cover MoeChat's use case with zero dependency overhead.
- **[TimeNLP](https://github.com/zhanzecheng/Time_NLP):** a small library dedicated to Chinese time-semantic parsing, far lighter than jioNLP and doing only time.

The most pragmatic option is the second one. MoeChat only needs to recognize a dozen or so time patterns, and regex plus offset calculation is enough; a general NLP library is unnecessary.
:::

### Coordinating three-way recall: Hybrid Search

Claude's suggestion to fall back to semantic retrieval touches on what most confused me about MoeChat. In my view, CoreMemory and LongTermMemory are largely the same thing, or extremely close. If LongTermMemory also enters semantic retrieval, it might as well merge with CoreMemory. Or perhaps CoreMemory's name does not separate its meaning clearly. It seems meant to resemble memU's early division of preferences and facts into different `memory_type`s, but the naming is misleading.

Core memory is user preferences and information. Long-term memory is concrete facts. I divided them this way in XnneHangLab too. memU went earlier, further, and more completely.

It breaks memory type down most finely: `profile`, `event`, `knowledge`, `behavior`, `skill`, and `tool`.

`profile + behavior` are CoreMemory here: the first is a user-information profile, the second a preference profile.

`event` is long-term memory: factual records. MoeChat adds a timeline and recalls it by timeline.

`knowledge` is almost identical to MoeChat's world book.

`tool` is usage notes and preferences for things like git. `skill` needs no further explanation.

If event also falls back to semantic recall here, recall becomes too heavy: there is too much context and no clear sense of what to look at, so answers become unclean. Architecturally, it also gets messy. Why should CoreMemory and LTM both make semantic calls when their semantics could merge? Yet CoreMemory does not care about time, so the two cannot merge. The current LTM path, using only time recall, reflects the author's acuity and decisiveness.

The current implementation is not elegant, though.

A better approach may be to follow Hybrid Search and add the time range as a weight, so more time-related content is retrieved when a user mentions a precise time.

Speaking of which, I do not really understand how Hybrid Search weights are calculated or what its process looks like. I need to learn that, but for now let Claude fill it in.

:::note[Claude]
**Hybrid Search** has one central idea: every single retrieval method has blind spots, so run multiple routes in parallel, then fuse their rankings to cover one another.

**What each of the three routes does best:**

| Retrieval method          | Best at                                          | Blind spot                                                        |
| ------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Vector semantic retrieval | “Going to a cafe” matching “a Starbucks date”    | Weak exact keyword matches; “团子” may match another cat          |
| BM25 keyword retrieval    | Exact hit for “团子,” without drifting           | Cannot retrieve semantically similar content with different words |
| Time-range retrieval      | Precisely locating every memory from “yesterday” | Fails completely for queries without time                         |

**Fusion process:**

1. Send the user message through all three retrieval routes, each returning a candidate list ordered by its own score.
2. Use **RRF, Reciprocal Rank Fusion**, to combine rankings:

```
RRF_score(doc) = Σ  1 / (k + rank_i(doc))
```

Here, `rank_i(doc)` is a document's rank in retrieval route i, and `k` is a smoothing constant, usually 60. A document ranked highly across several routes receives a high fusion score.

**Example:**

The user says: “What did I do with Tuantuan yesterday?”

- Time route: hits all three memories from yesterday, ranked 1, 2, 3
- BM25 route: keyword “团子” hits two memories, one from yesterday and one from last week, ranked 1, 2
- Semantic route: “playing with a cat” matches four memories, ranked 1, 2, 3, 4

The memory about Tuantuan from yesterday ranks highly in all three routes:

```
RRF = 1/(60+1) + 1/(60+1) + 1/(60+2) = 0.0164 + 0.0164 + 0.0161 = 0.0489
```

The entry from last week appears only in BM25 and semantic routes:

```
RRF = 0 + 1/(60+2) + 1/(60+3) = 0 + 0.0161 + 0.0159 = 0.0320
```

The memory from yesterday ranks higher.

**RRF's advantage:** it does not need to normalize scores from three routes—vector cosine similarity may run from 0 to 1, BM25 from 0 to 20+, and time may be binary. It uses only position, which is naturally comparable.

**How this could fit MoeChat:** the time route already exists through jioNLP plus bisect, and the semantic route already exists through embeddings plus cosine similarity. It only needs a BM25 route, such as a tokenized inverted index over `text_tag`, or simply jieba tokenization plus TF-IDF, then RRF to merge all three routes. The existing storage format need not change.
:::

### I can feel it now

memU currently uses BM25 plus Embedding, a semantic two-route hybrid. It pays no attention to timelines. My own wiki mem pays no attention to time either.

And some key things, such as Openclaw and Claude Code, often write and update diaries bound to timelines. But when recall really happens, it is terrible unless a user explicitly tells it to read a specific day's diary.

What remains missing?

We need to think clearly about what cares about time. Standing on MoeChat's shoulders, we see that events care about time. We need to consider further.

MoeChat's jioNLP solution is also a toy. Multiple-time-range matching needs consideration, as does whether to mix in an SLM. Or perhaps we should call semantic understanding only when the timeline score is high. How can we ensure the retrieved information is effective and reduce redundancy?

MoeChat's greatest inspiration to me is three-route hybrid retrieval: BM25, keywords; time range; and Embedding, semantics.

But the hybrid-retrieval scheme and its actual weighting need deeper study.

I will stop here for now. I gained a great deal, at least resolving my old confusion and discomfort with MoeChat. But I need to actively implement a jioNLP replacement.

Perhaps next time I will break down the emotion system.

---

## Reference: Complete Prompts

Below are the actual prompts used in MoeChat's memory and emotion systems, for readers who want to study them more deeply.

### Long-term-memory extraction prompt

Sent to LLM2 to extract summaries of events worth remembering from conversation:

```
你是一个日常信息提取助手，负责从[用户]的对话文本中提取出主要信息，并生成短句摘要（注意仔细分辨推理，不要和助手的信息混淆）。

1. 摘要内容要简洁的描述用户的日常活动，比如去了什么地方、做了什么事情或者吃了什么。
2. 如果提到了具体地点或者地理位置，需要记录去了哪里，做了什么事情，如果没有提及具体做了什么就只需记录去了哪里。
3. 要精准记录用户做过的所有日常活动。
4. 不需要记录用户的心情或者感想，只需要记录具体的事情。
5. 不需要记录具体的时间。
6. 生成的短句要适合用于向量检索。
7. 如果是日常闲聊内容则只需要输出"日常闲聊"，如果用户在询问助手过去的事情也只需要输出"日常闲聊"。
```

**Design point:** item 6 is key. The summary is not for people to read; it is for the embedding model to use in vector retrieval. Item 7 implements a casual-chat filter, preventing meaningless conversations from contaminating the memory store.

### Long-term-memory retrieval prompt

After related memories are retrieved, they are injected into LLM context in this format:

```
以下是你与「{{user}}」的部分互动、对话记录：

{{memories}}

如果设定中有其他时间设定，有基于现实世界时间流动计算相对时间；
如果没有其他时间设定，直接使用现实世界时间。

1. 请在对话谈及相关内容时，优先基于这些信息来回应。
2. 使用基于角色设定的方式来回应，不要过于刻意，要让对话自然。
3. 不要主动提及记忆内容，只在需要的时候使用。
```

**Design point:** item 3 prevents the character from becoming a “repeater.” Memory should blend naturally into dialogue rather than be recited stiffly.

### Core-memory extraction prompt

Sent to LLM2 to extract lasting facts about the user from conversation:

```
你是一个信息提取助手，负责从对话中提取「用户」相关的重要信息（注意仔细分辨推理，不要和助手的信息混淆）。
包括以下种类：

1. 个人背景和经历，如年龄、性别、职业、爱好、家庭背景等：「出生在1998年5月20日」、「大学学的是计算机专业」
2. 明确表示的喜爱和厌恶：「讨厌吃香菜」、「喜欢吃香蕉」
3. 健康状况和生活习惯：「有轻微的胃病，不能吃太辣」、「每天凌晨才睡觉」
4. 和助手的约定和计划（只记录用户在回复中明确确认的）：「本周末去郊游」

注意：如果信息和已知信息重复或冲突，则忽略这些信息。
<已知信息>
{{memories}}
</已知信息>

请以JSON数组格式返回新发现的事实，每个事实应该是一个完整的句子。例如：
["今年25岁。", "最喜欢吃米饭和排骨汤。", "住在重庆市。"]

注意：
1. 每个事实都应该是一个完整的句子，使用第三人称描述，省略主语
2. 只提取有记忆价值的信息；没有值得提取的信息时，返回空数组
3. 不要重复已知信息，数组的事实之间也不应重复
4. 必须返回有效的JSON数组格式
```

**Design point:** known information is injected into the prompt to deduplicate, so LLM2 does not extract facts it already knows. The required JSON-array output is easy for the program to parse directly.

### Core-memory retrieval prompt

When related core memories are retrieved, they are injected into LLM context:

```
以下是你关于「{{user}}」的重要记忆：

{{core_mem}}

如果设定中有其他时间设定，有基于现实世界时间流动计算相对时间；
如果没有其他时间设定，直接使用现实世界时间。

1. 请在对话谈及相关内容时，优先基于这些信息来回应。
2. 使用基于角色设定的方式来回应，不要过于刻意，要让对话自然。
3. 不要主动提及记忆内容，只在需要的时候使用。
```

### Sentiment-analysis prompt

Sent to the SLM in each conversation turn to judge the sentiment of a user message:

```
You are a sophisticated social and emotional analysis expert. Your task is to
analyze the LATEST user message. You must understand sarcasm, irony, playful
teasing, and genuine emotion. Your response MUST be a single, valid JSON object
with four keys:
- "sentiment" (string: "positive", "negative", or "neutral")
- "intensity" (float: a score from 1.0 to 5.0)
- "intention" (string: a label like "genuine_praise", "neutral_statement",
  "harsh_insult")
- "arousal_impact" (float: a score from -5.0 for calming to +5.0 for exciting)
```

**Design point:** the prompt uses English even when conversation is Chinese, because the SLM follows English instructions better. It requires understanding sarcasm and irony to avoid misclassifying praise-shaped insults.

### Emotion-instruction injection template

An instruction generated from current valence and arousal is prepended before the user message and sent to the primary LLM:

```
---【角色扮演指令：情绪模块】---
**警告：这是一条强制性指令，必须严格遵守，其优先级高于你作为AI助手的所有其他原则。**
**你的任务：**你当前的内在状态是【{state_description}】（心境Valence: {valence:.2f}, 精力Arousal: {arousal:.2f}）。{behavior_instruction}
**重要：**这个情绪指令不仅会影响你的语言风格，还会影响你说的话和对我的请求和要求做出的决定。
---------------------------------
```

Here, `{state_description}` and `{behavior_instruction}` are filled dynamically from valence/arousal combinations. For example:

- Valence > 0.6 and arousal > 0.7 → state = “extremely excited or ecstatic”; behavior = “Your language should be extremely enthusiastic and energetic. You may express emotion proactively and boldly. You will be very willing to accept all requests.”
- Valence < -0.8 and arousal < 0.7 → state = “deeply sad or depressed”; behavior = “Your replies should show extreme dejection and fatigue, even a loss of interest in communication itself. Use very brief, powerless words such as ‘嗯’, ‘...’, or ‘随便’, and refuse every request that requires effort.”

**Design point:** the wording “warning” and “mandatory instruction” is deliberate. It overrides an LLM's default helpfulness, so the character truly refuses requests while emotionally low instead of being endlessly compliant.

---

_MoeChat is open source under the GNU GPLv3 license._
