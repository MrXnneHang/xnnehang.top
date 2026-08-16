---
title: "Sparse vs. Dense: From BPE to Hybrid Search"
published: 2026-07-14
featured: true
category: Learning as I Build
series:
  - NLP
tags:
  - Embedding
  - BPE
  - WordPiece
  - BM25
  - Sparse Vectors
  - Dense Vectors
description: "Starting from the question of what sparse and dense really mean, this works through the embedding pipeline, subwords and vocabularies, input length, and their practical uses."
lang: en
translationKey: sparsing-and-densing-embeddings
---

![](../../assets/img/sparsing-and-densing/PixPin_2026-07-14_11-24-38.jpg)

:::note
**AI collaboration disclosure:** Xnne and [Korewaxnne](https://github.com/xnne-bot), an AI assistant, completed this article together in a Q&A format. Xnne asked the questions and organized the conclusions; Korewaxnne answered them and corrected concepts.
:::

:::tip[Who is this for?]
This is neither a beginner tutorial nor an advanced reference. If you know nothing about NLP, it may confuse you more; if you already understand embeddings and sparse versus dense, it offers nothing new. But if you are like me—roughly aware of tokenization, BM25, and embeddings, yet unable to say what sparse and dense actually mean—it may help connect the fragments.
:::

:::note
Let us fill in a little more NLP knowledge, again through Q&A, because there is no need to begin from zero this time.
Keep the present lack of confusion; have an idea, act on it, and resolve it when you encounter it.
:::

## The Initial Confusion

As usual, let me ask first.

This article mainly discusses—

> These questions may all be wrong. What I need to do is find the right path.

How can we predict whether a text chunk's embedding vector is sparse or dense?

Is it determined by the scenario—by the relationship or vector distance among the texts in a batch? If texts are weakly related, is that scenario sparse; if strongly related, dense?

Do sparse and dense describe distances among a batch of vectors, or whether values inside a single vector are sparse or dense—how many empty values it has?

Also, why are some embedding models better at dense vectors and not sparse vectors? Is that determined by architecture or pretraining? What is the reference or objective during embedding pretraining—bring similar semantics together, push different semantics apart? How is that labeled? It feels difficult.

I have also partly forgotten the embedding process. Does every term after tokenization have its own embedding, or does a whole list of terms become one embedding? I vaguely remember both happening.

What is the output for one sentence? What is the output for one document?

What scenarios suit sparse vectors, and what scenarios suit dense vectors?

---

The first time I saw sparse and dense was in Paddle, where an adorable mathematics expert wrote an operator I could not understand. I do not know whether they were a cross-dressing expert, but they had twin tails and a maid outfit and were very cute. Oh no—my entire impression of vectors is that cute face.

---

## The Embedding Pipeline

The day before yesterday, in [[Learning TF-IDF Again After Graduation]], I realized I had confused the tokenization process. I had mixed the embedding process into tokenization, but tokenization only goes as far as segmentation.

So here, we must clarify how many steps embedding actually contains.

### The complete pipeline

Does assigning token IDs to terms after tokenization count as part of embedding?

:::note[Korewaxnne]
**It does. But academically, assigning token IDs is normally called mapping or indexing, rather than embedding lookup.** First, the full pipeline:

```
Raw text
  ↓ tokenize
["毕业", "后", "我", "搬回", "了", "老家"]
  ↓ mapping (look up vocabulary and map terms to integer IDs)
[1456, 78, 23, 8901, 45, 6723]
  ↓ embedding lookup (look up vector table and turn every ID into a vector)
[[0.23, -0.45, ...], [0.12, 0.78, ...], ...]   ← one vector per token
  ↓ pooling / [CLS] (compress a row of vectors into one sentence)
[0.56, -0.12, ...]                              ← one vector for the sentence, the API result
```

Your question falls on **mapping**, assigning token IDs after segmentation. Does it count as embedding?

- **In the broad sense, yes:** it is part of the full process of making text usable by the model, and is often loosely called embedding in ordinary discussion.
- **Strictly, no:** mapping is only a lookup from term to ID and has no vector operation. In academic context, embedding specifically means **step three**, embedding lookup, mapping discrete token IDs into a continuous vector space.

So both descriptions work; they merely differ in precision. Saying that you “mixed up tokenization and embedding” is accurate enough here. There is no need to worry about where mapping belongs.

**A small tip:** token counts can indeed be read after tokenization, through `len(tokens)`. This is why models calling something a token normally mean an integer ID, not a vector.
:::

### Narrow definitions

Then let us narrow both terms: embedding means `token_id_list -> vector`; tokenization means segmentation; mapping is mapping.

## Vocabulary and Subwords

### Intuition for subwords

I remember that a modern BERT vocabulary is usually around thirty thousand words.

If a word has never been seen, and cannot even be assembled from roots, what happens when mapping it?

:::note[Korewaxnne]
Two questions can be answered together: your direction is right, but “roots” is not quite the correct term.

**BERT does not assemble roots; it uses subwords.**

For example, `Transformer` may be missing from a vocabulary, but a BERT WordPiece tokenizer may split it as:

```
Transformer → Trans + ##former
```

`##` means this part attaches to the preceding text rather than standing alone. The vocabulary has `Trans`, a common prefix, and `##former`, a common suffix, which can assemble Transformer.

This split is **not based on linguistic morphemes**, but statistics. During training, the algorithm records high-frequency substrings and includes them in the vocabulary. Sometimes they resemble roots, such as `##former`; sometimes they are merely frequent fragments, such as `##tion`.

---

**What if none of a word's subwords can be found in the vocabulary?**

With BERT WordPiece, this almost never happens because of its fallback:

```
Input: "一个完全没见过的生僻词"
   ↓ try longest vocabulary substring
"一个完全没见过的生僻词" → if "生僻词" is absent
   ↓ recursively split to individual characters
"生", "僻", "词" → if even a character is absent
   ↓ final fallback
[UNK] (Unknown token)
```

In more modern tokenizers, such as GPT-family BPE and SentencePiece, **even [UNK] does not appear**. Training includes every individual character or byte, so every input can be assembled; there is no truly unseen input.

So the answer is: **in modern tokenizers, “cannot even assemble its roots” is essentially impossible because individual characters exist in the vocabulary.** In the worst case, it degrades to one `[UNK]` token.

The practical difference between a BERT vocabulary of roughly 30k and byte-level BPE is:

| | BERT WordPiece | Byte-level BPE |
| --- | --- | --- |
| Vocabulary size | ~30k | ~100k, including every byte |
| OOV? | Possible; falls back to `[UNK]` | Almost none; bytes can always assemble input |
| Split basis | Statistical subwords plus language preference | Pure statistics at byte level |

This is why GPT-family models later abandoned WordPiece for BPE: no `[UNK]` handling, one problem removed.
:::

It is truly a good idea. I remember learning C++:

```Cpp
char a = 'a';    // 1 byte
string b = "我";  // 3 bytes (UTF-8)
string c = "你好"; // 6 bytes (UTF-8)
```

The exact byte count depends on encoding: under UTF-8, one Chinese character is three bytes; under UTF-32, four.

Anything encodable can be assembled from bytes, and multi-character words are just collections of bytes. It is beautiful: it bypasses linguistic preference and depends completely on statistics.

I want to understand further how BPE and WordPiece differ and resemble each other when learning a vocabulary.

### BPE vs. WordPiece

:::note[Korewaxnne]
Their central difference is **the merge criterion**, which changes how vocabulary is formed:

| | BPE | WordPiece |
| --- | --- | --- |
| **Merge basis** | Frequency: merge the pair that occurs most often | Likelihood: merge the pair that increases model probability most |
| **Training** | Start from single characters and repeatedly merge the most frequent adjacent pair until vocabulary size is reached | Start from single characters and merge the pair that most improves training-data likelihood each time |
| **Vocabulary** | Purely statistical: frequent fragments mix together, such as `ing`, `tion`, `ab`, and `##s` | More inclined toward linguistic boundaries, because improving likelihood often merges meaningful units |
| **OOV handling** | Almost none: every byte exists | Possible: fully unseen combinations fall back to `[UNK]` |
| **Typical models** | GPT family, LLaMA | BERT, DistilBERT |

**An intuitive comparison:**

For input `"unbelievable"`:

- **BPE, frequency-driven** → `["un", "believ", "able"]`
  `un` and `able` are merged because they occur frequently; `believ` is also frequent, though possibly less stable than `un`.
- **WordPiece, likelihood-driven** → `["un", "##believ", "##able"]`
  The result looks similar, but `##believ` carries `##` because the model finds an attached form more probable than an independent word.

**The bigger difference is the vocabulary base:**

BPE begins at the **byte level**, so its initial vocabulary contains all 256 byte values. WordPiece begins at the **character level**, with Unicode characters plus common multi-character combinations. Therefore:

- BPE naturally includes every byte → any input can be assembled → no `[UNK]`
- WordPiece does not include every Unicode character → rare characters may become `[UNK]`

Later BERT versions addressed this with full-character coverage, but that is another story.

**A blunt summary:** BPE is an illiterate statistician that cares only about “which two things occur together often.” WordPiece is half-literate: it knows what it does not know and leaves room for `[UNK]`, but its splits have more linguistic intuition.
:::

## Input Length and Output Vectors

Are there special cases where one word is embedded alone, or an entire document is embedded?

What does the length of an input `token_id_list` affect? Does it affect the sparseness or denseness of the output vector?

:::note[Korewaxnne]
**First, special cases do exist, and they are common.**

- **Single-word embedding:** when using an embedding model such as `text-embedding-3-small`, input can absolutely be one word. Input `"猫"`, and it returns one vector. A single word carries little information and usually retrieves poorly, but it is technically valid.
- **Whole-document embedding:** also valid, but constrained by length. Embedding models, like LLMs, have maximum input lengths—BGE-M3 has 8k tokens. Extra text is truncated or errors. Long documents are normally **chunked**, then either pooled into one vector or retrieved through their individual vectors.

So “usually a full sentence” is right, but it is **not fixed**. Any length from one token to `max_tokens` works.

---

**Now the main question: does input length affect output-vector sparseness or denseness?**

**No.** It is an excellent question, but the direction is reversed.

An output vector's **dimension is fixed**—1024 for BGE-M3, 1536 for OpenAI's text-embedding-3-small. Whether input is one word or a thousand, output has that fixed length and values in every dimension, so it is dense. Sparse versus dense is determined by **model structure**, not input length.

Input length actually affects:

| What it affects | Why |
| --- | --- |
| **Compute** | Longer input → more embedding lookups → slower and more expensive |
| **Output-vector quality** | Too short, one or two words, gives too little information; too long exceeds max tokens and loses information through truncation |
| **Pooling choice** | After chunking long input, average, weighted, or `[CLS]` pooling changes the final vector's center of gravity |

**An intuition:**

Input “猫” → one point.
Input “一只黑猫蹲在窗台上看雨” → another point.

Both vectors are 1024-dimensional and occupy that same 1024-dimensional space. Neither differs in sparseness or denseness. The second simply carries more semantic information, so its neighbors understand its intended meaning better during retrieval.

Your previous question—whether sparse and dense describe batch-vector spacing or values inside one vector—can now be answered: **it is whether values in a single vector's dimensions are mostly zero.** Embedding-model output has no large number of zeros, so it is dense. BM25 output is almost entirely zero, with values only for matched terms, so it is sparse.
:::

## Sparse vs. Dense: Make It Clear

My earlier understanding of sparse and dense now looks like this:

Like a matrix, it is truly about whether values are zero. It is not whether a batch of vectors is distributed densely or sparsely in space; it is simply whether one vector contains many zeros.

Sparse vectors are usually high-dimensional but use few dimensions. Dense vectors use nearly every dimension and vaguely express a “larger” semantic space.

We can discuss something else here too.

### What each suits

What scenarios suit sparse vectors?

For example:

1. A user talks with an LLM, while another LLM continuously summarizes facts and preferences from the conversation as memory.
2. A user wants to quickly capture every article related to cats, using the keyword 猫.

Which suits dense or sparse vectors?

Earlier, we mentioned that embedding a single term is possible, but normally it has too little semantic information for the vector to say anything useful and recall becomes difficult. Dense vectors are better at complex semantic expression; they handle complex query needs better, but can struggle with queries lacking semantics or context.

BM25 and TF-IDF, by contrast, are designed for term retrieval. In scenario 2, the answer is almost instant.

:::note[Korewaxnne]
Most of your intuition is right. Let me calibrate a few points.

**Does BM25 have its own vector space?**

Yes. Every term is a dimension. The dimension corresponding to “猫” has a value, while others are zero. Its vector space is an **extremely high-dimensional sparse space whose dimensions are vocabulary terms**, perhaps 50,000 dimensions, while every vector has only a few nonzero values. That is why it counts as a sparse vector.

**Which suits scenarios 1 and 2?**

| Scenario | Matching type | Better fit | Why |
| --- | --- | --- | --- |
| 1. Conversation summaries → memories | **Semantic matching:** “the user likes cats” ≈ “they own a Ragdoll” | Dense vectors | Memories need to understand meaning rather than exact words. If a user says “I own a Ragdoll,” dense vectors can associate it with “cat”; sparse vectors cannot. |
| 2. Search articles about “猫” | **Keyword matching:** title or text contains “猫” | Sparse vectors, BM25 | The query is too short for a dense vector to say much; sparse vectors can hit the exact term immediately. |

**But there is an implicit question worth expanding: why do dense vectors struggle with short queries?**

It is not because they are short, but because they **lack context**. One word is too ambiguous:

- “猫” might mean the animal, feline species, cat food, cat videos, Tom and Jerry...
- “一只黑猫蹲在窗台上看雨” tells the model the approximate scene.

The more room the model has to infer, the more accurate semantic matching becomes. A one-word query gives it no room, so its vector does not know which direction to approach.

**How does production solve this? Through hybrid search.**

Modern search engines almost never use one method only:

```
query → BM25 (exact match) + dense vector (semantic expansion) → fused ranking → return
```

BM25 handles “do what was said”; dense handles “reason by analogy.” Their scores are weighted together—BM25 gets higher weight for short queries, dense gets more for long queries. This is also the complement of related-article recommendation discussed in your TF-IDF note.
:::

From this perspective, memU and mem0 are both hybrid scenarios.

They need dense embeddings and BM25 as a supplement. But how BM25 should be used has much to discuss. Is it simply the hybrid-search use shown above, or can it do something more interesting?

When breaking down memU, we can capture how it uses BM25: simple hybrid search, or its own extension—[[What Is memU? Let's Break It Down (An Ongoing Series)|What Is memU? Let's Break It Down]].

## Claude's Additions

I raised two questions at the beginning and forgot to ask them later, so I will add them here.

:::note[Claude]
### Why are some models good at dense vectors and others at sparse ones?

**Both architecture and pretraining matter, but the pretraining objective is decisive.**

Architecturally, Transformer encoders such as BERT and BGE output fixed-dimensional vectors after attention plus pooling, with values in every dimension—naturally dense. BM25 is not a neural network at all. It works in a vocabulary-sized space, perhaps 50,000 dimensions, where only dimensions corresponding to words that appeared in a document are nonzero—naturally sparse.

But neural networks can output sparse vectors too. SPLADE, for example, also uses a Transformer but adds a sparsification operation—log-saturate plus ReLU—at the output, forcing most dimensions to zero. It ultimately outputs sparse vocabulary-dimensional vectors. So Transformers are not inherently dense; output-layer design and training objectives decide it.

### What is the objective of embedding pretraining, and how is it labeled?

The central idea is exactly what you guessed: **bring similar semantics together and push different semantics apart.** Academically, this is **contrastive learning**.

Training constructs positive and negative pairs:

| Sample type | Meaning | Sources |
| --- | --- | --- |
| **Positive pairs** | Two semantically similar texts | Query and a clicked document; question and answer; title and body; a sentence and its paraphrase |
| **Negative pairs** | Two semantically unrelated texts | Random pairing, or hard negatives that look similar but are unrelated |

The loss function pulls positive-pair vectors closer and pushes negative-pair vectors apart.

**Where do labels come from?** It is difficult, but many clever sources exist:

- **Natural supervision:** search-engine click logs, where searching X and clicking Y makes a positive pair; Q&A pairs; paper titles and abstracts
- **Human annotation:** expensive but high quality, such as MS MARCO's human query-passage relevance labels
- **Self-supervision:** adjacent paragraphs from one article become positives, while paragraphs from other articles become negatives, requiring no human labels

So embedding training does not need a similarity score manually marked for every pair of texts. It indirectly learns semantic-space structure through contrast among positive and negative pairs. This is why embedding models can keep improving in an era with enormous quantities of unlabeled text.
:::
