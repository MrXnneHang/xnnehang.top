---
title: Learning TF-IDF Again After Graduation
published: 2026-07-12
category: Learning as I Build
tags:
   - TF-IDF
   - NLP
   - Information Retrieval
description: My plain-language explanation of TF-IDF, from terms and tokenization through TF, IDF, query scoring, BM25, and using it to recommend related posts on this blog. Apparently, it is much easier to pay back the debt of skipping NLP lectures once there is a reason to learn it.
featured: true
series:
   - NLP
lang: en
translationKey: tf-idf-and-bm25
---

![](../../assets/img/about-comeback-learn-tfidf/PixPin_2026-07-12_23-13-36.jpg)

> [!NOTE]
> **AI collaboration disclosure:** Written by Xnne, with [Korewaxnne](https://github.com/xnne-bot), an AI assistant, helping organize the structure and polish the language.

<iframe src="https://player.bilibili.com/player.html?bvid=BV1XT421Q7fw" width="100%" height="500" frameborder="0" allowfullscreen="true"></iframe>

:::note
I have returned almost all of my NLP knowledge to the teacher, apart from the part where we discussed _Lost in the Middle_. The teacher had us find a paper or something, then try to explain it clearly on our own. They would also question us about what we had presented. That experience had a deep impact on me: how thoroughly do you need to understand something before you can explain it and answer questions about it? How do you find the right point between reductivism and staying on the surface? I can never repay Teacher Guo for this =-=.
:::

The same old Feynman-learning-method opening: I will explain TF-IDF in my own plain language. There will not be much mathematics here.

If you want a systematic and detailed explanation, watch the video above. It is very good.

## TF-IDF

### Terms and tokenization

TF stands for Term Frequency.

You can think of a term as a word. In English, a term is a word. In Chinese, there seems to be a subtle distinction between the two; look it up if you are interested. It is mainly about what counts as a stop word.

For example, suppose we use jieba to segment this sentence:

```shell
毕业后我搬回了老家。
```

After tokenization:

```shell
毕业|后|我|搬回|了|老家
```

At first, assume we treat everything as a term.

We can simply count the frequency of every term in each document chunk.

We will find that stop words such as `了`, `的`, and `是` occur very often.

But nearly every article has these words. They only interfere with our calculation and provide no help at all. So TF-IDF usually does one thing right away.

It turns the tokenized terms into this:

```shell
毕业|我|搬回|老家
```

After this cleanup, the text seems more concise without changing its meaning, and there is less to compute.

But first, one thing needs to be clear: from TF-IDF's point of view, semantics do not exist. Whether something is a sentence or an article, it is only a collection of terms.

It does not care who graduated or who moved back home. It only cares about graduation, moving, and hometown. These words are discrete, and their order does not matter.

Why is it still so powerful? Its principle is actually very easy to understand.

The remaining terms can tell us something.

### TF: term frequency

The more often a term occurs in an article, the more relevant that article is to the term. That is **Term Frequency**.

TF reflects how strongly an article is associated with a term. For example, if `深度学习框架` has the highest TF in an article, that article is mainly about deep-learning frameworks.

### IDF: inverse document frequency

Now consider this case.

Suppose every article in our knowledge base is about deep-learning frameworks. Almost every article mentions them fairly often.

If we want to retrieve something specific from this collection, is that phrase still useful as a signal?

Put plainly: when a term appears at nearly the same frequency in every article, does it become as unhelpful in this collection as a stop word?

But how should we clean it up? Would removing it outright be too crude? Is there a better way?

Yes—and it is simple. We can assign every term a weight. If a term occurs frequently throughout the collection, lower its weight. Conversely, if it appears only in a particular subset of documents, raise its weight. This weight is called IDF—**Inverse Document Frequency**—and it represents the value of a term.

A term's IDF is relative. Mix an article about deep learning into a set of personal reflections, and deep-learning terminology becomes its best set of terms. Bury it among deep-learning articles, however, and IDF is what discovers and ranks the value of those terms.

### Query scoring

How does TF-IDF work in an actual query?

It normally needs a query.

For example:

```shell
我最后一次修改 XnneHangLab 是什么时候？
```

That query is also split into terms and stripped of stop words:

```shell
最后 | 一次 | 修改 | XnneHangLab | 什么时候
```

Then it calculates a TF-IDF score, which is really a summation.

For **each document and each term in the query**, it calculates TF × IDF, then **adds them up**:

$$Score = TF_1 \times IDF_1 + TF_2 \times IDF_2 + ... \text{(with len(query) terms)}$$

The document with the highest score is the most relevant to the query, so we return it directly. I will not get into the specific normalization operations here.

---

In more formal notation:

$$
\text{Score}(D, Q) = \sum_{t \in Q} \text{TF}(t, D) \times \text{IDF}(t)
$$

- $t$ = one term in the query
- $Q$ = the query's collection of terms
- $D$ = one document in the document collection
- $\sum$ = sum over every term in the query

### Recommending related posts with TF-IDF

https://xnnehang.top/

My blog uses TF-IDF to recommend related posts as well.

At this point, the principle is simple: turn an article into terms in the same way, then calculate it against every other article.

The complexity is $O(N \times |\text{BlogTerms}|^2)$—that is, $n^2$—so it is not very high.

### The relationship between BM25 and TF-IDF

BM25 is a variant of TF-IDF. The idea has not changed much, but the mathematics has changed a lot: normalization and so on. We do not need to worry about that; just think of it as a more accurate TF-IDF.

### Limitations

We have already made this clear in the analysis: it sees only words, not semantics or word order.

Still, it is pretty accurate for recommending related posts =-=.

The charm of mathematics and all that.

## Changes in tokenization

My understanding is that, after embeddings appeared, tokenization became segmentation → vectorization.

But I wondered whether tokenization itself includes the segmentation step, or whether it specifically means the step from terms to embeddings.

And what differs between tokenization for embeddings and tokenization before embeddings?

> [!NOTE] Korewaxnne
>
> First, put the pipeline in order:
>
> ```
> Raw text → **tokenize (split into tokens)** → convert to IDs → embedding lookup → vectors
> ```
>
> Tokenization **only handles the first step**: splitting text into tokens. Going from terms to vectors is done later by embedding lookup; do not mix them up.
>
> ---
>
> **1. Does tokenization itself include segmentation?**
>
> Yes. For Chinese, the central task of tokenization is segmentation.
>
> But the part you described as “term → embedding” is not tokenization. It is embedding lookup: a different step.
>
> ---
>
> **2. What differs before and after embeddings?**
>
> |                               | Tokenization in the TF-IDF era          | Tokenization in the embedding era                                                           |
> | ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
> | Granularity                   | Whole words (word-level)                | Subwords, such as BPE / WordPiece                                                           |
> | Stop words                    | Must be removed manually (`了`, `的`)   | **Do not remove them**—the model learns their use itself                                    |
> | OOV (out-of-vocabulary words) | Fails immediately on an unseen word     | Can represent them by splitting into subwords, such as `Transformer` → `Trans` + `##former` |
> | Output                        | One word corresponds to one discrete ID | One word may correspond to multiple subword IDs                                             |
> | Vocabulary size               | Tens to hundreds of thousands of words  | **Fixed**, for example, BERT has about 30,000 subwords                                      |
>
> The core difference is **granularity**. We used to split text into whole words; now we can split those words further. For example, `毕业` may occur 1,000 times while `毕业典礼` occurs only five times. With subword tokenization, a model can reuse what it learned from `毕业` when it sees `毕业典礼`.
