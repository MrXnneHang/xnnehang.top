---
title: Attention Is Limited — Lost in the Middle
published: 2025-07-06
shelf: '论文'
arxiv: 'https://arxiv.org/abs/2307.03172'
category: technology
kind: reflection
tags:
  - Attention
  - Transformer
description: LLM attention is limited. Starting from the difference in weighting between system and user prompts, this article explores the Lost in the Middle phenomenon and what it can teach us.
series:
  - LLM
lang: en
translationKey: attention-is-limited
---

Yesterday, I suggested that someone place repeatedly inserted knowledge-base content and memories in the user prompt rather than the system prompt.

- [❇️ A small suggestion: use user prompts instead of system prompts to insert World Info and diary entries. #4](https://github.com/AlfreScarlet/MoeChat/issues/4#issuecomment-3104493088)

I raised two properties of the system prompt: it is **globally visible and highly weighted**, so conflicts can cause the model to hallucinate. A user prompt, by contrast, is **local, with more recent content receiving greater attention weight**.

At the time, those claims came from experience and my trust in Gemini 2.5 Pro.

But they deserve a more evidence-based analysis.

First, **locality and the greater attention paid to recent content are actually properties of both system prompts and user prompts**.

One part of my view was somewhat mistaken: I thought system prompts inserted later would always receive less attention than the initial prompt. (That is not really how it works. Attention is greatest at the beginning and near the end, and lighter everywhere else; see Lost in the Middle below.)

Put simply, we can view an LLM as a Transformer with an extremely long context. It distinguishes System Prompts from User Prompts through special tokens such as (`<|system|>`, `<|user|>`, `<|assistant|>`, `<|startoftext|>`, `<|endoftext|>`), and training probably teaches it to distinguish different roles in this way. The system role also seems to carry additional penalties and constraints, which makes it appear more important.

On subsequent inputs, we still feed the entire context window back into the model. The reason the first system prompt remains well remembered even after a long conversation is explained below.

## Lost in the Middle

- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)

This paper corrected one of my earlier misconceptions. I had thought that an LLM's attention always increased toward the most recent content. In reality, its attention distribution is U-shaped: it remembers the beginning and the end clearly, while becoming `Lost in the Middle`.

### Argument:

The paper notes that we would like an LLM's attention to resemble an omniscient perspective, examining the entire context steadily and evenly. Yet the efficiency and robustness with which models use information from long contexts are questionable. The authors argue that when a model processes a long text, its performance can vary dramatically depending on **where the relevant information appears within that text**.

### Experiments:

The authors used two types of experiments:

- Multi-document question answering
- Key-value retrieval

::github{repo="nelson-liu/lost-in-the-middle"}

They placed the relevant information at the beginning, middle, or end, then asked questions to evaluate how effectively the model used its context.

### Conclusion:

**A U-shaped performance curve:** Model performance follows a pronounced “U-shaped” curve. Models perform best when the relevant information appears at the **beginning of the input (the primacy effect)** or at the **end (the recency effect)**. Performance drops significantly when the relevant information appears in the **middle**.

**Longer contexts lead to worse performance:** The study also found that even for models specifically designed to handle long contexts, overall performance falls substantially as the input grows longer.

## An Interesting Phenomenon

Every model becomes less capable in a long context. More precisely, its ability to use relevant information declines. To put it simply, we can think of its **attention as becoming diluted**.

Suppose the U-shaped function remains fixed, with **the area under the curve representing the total attention weight** and **the horizontal axis representing entries in conversational order**.

The attention weight once shared by three chronological entries in a short conversation is now divided among six or even ten, leaving less for each one. The model therefore becomes worse at extracting **the relevant information—understanding the question and the requirements**.

Alternatively, suppose the U-shaped function changes while the attention assigned to the first three and most recent three entries remains the same. The U then becomes “steeper,” meaning that the model grows more forgetful: it remembers almost nothing from the middle, and its performance naturally declines.

**A model always remembers the beginning and the present most clearly. In that respect, it resembles the way humans think.**

> [!TIP]
> Because special tokens may cause the system prompt to receive a greater share of the attention weight—which also makes it “globally visible” to some extent—we should allocate system-prompt space with particular care. We should value and make good use of a model's attention just as we do our own.

> [!NOTE]
> **Attention is limited.**

## Addendum

I have found that **proposing an idea and then correcting it step by step** gives me a much deeper and clearer understanding than simply accepting the correct answer. It also feels far more dependable than applying experience directly.

This approach also seems to echo the Feynman technique. I had already noticed that I learn better when writing blog posts as I go. Later, however, I became overly dependent on LLMs, and most of what I wrote turned into records of how a problem was solved and which path led to the solution. I find that kind of chronological logging rather discouraging. Today, by contrast, I rediscovered the pleasure of keeping a record.

When watching films or reading novels, I used to restrain myself from offering opinionated commentary. It was tiring, such opinions could wander endlessly, and everyone saw things differently, making it easy to draw attacks from people who disagreed.

For questions with definite answers, however, having an opinion seems necessary. It pushes me to keep examining and revising my own view: is it correct, or might it mislead someone? It also makes me analyze the subject more deeply and perhaps correct my own thinking along the way.

So I will give this article a Feynman-style ending: a visual explanation and a summary in simpler language.

![U-shaped attention distribution in a short context](../../assets/img/covers/attention-ushape-short.jpeg)

![U-shaped attention distribution in a long context](../../assets/img/covers/attention-ushape-long.jpeg)

We use these two function plots as an analogy for how attention weight is distributed in a short context of twenty entries and a long context of forty. This is only an analogy: I cannot first prove that the distribution is symmetrical, and for now probably no one can quantify this capacity precisely, so we will not dwell on those issues.

The model has the following initial assumptions:

- Across the entire context window, the total attention—the maximum number of context tokens—remains constant. In other words, the integrals for twenty and forty entries are assumed to be equal. (They probably should not be equal, but let us assume they are.)
- The system prompt exerts a stronger constraint on the model because of penalties applied during training; it is the red line, while the user prompt is the blue line.
- Both follow a U-shaped distribution. The model assigns more attention weight at the beginning and end: Lost in the Middle.
- Under a long context, model performance—its ability to extract relevant information—gradually declines, producing lower y-values.

No other properties of the functions in these plots should be taken literally. I cannot claim that they are symmetrical, nor can I prove that attention is lower at every point in a long context. So even if you notice those details, please pretend you did not.

Even this simple model is enough to answer why knowledge-base content and diary entries should be repeatedly inserted through User Prompts to guide the next response.

:::warning
**Repeatedly inserting guidance into separate prompts lengthens the conversation context and thereby accelerates the decline in model performance.**

At the time, one user prompt was guided by three system prompts—core mem, long mem, and knowledge base—meaning that a single conversational exchange consumed four entries in the context window.
:::

:::warning
**To some extent, system prompts are more globally visible than user prompts, so conflicting instructions are more likely to cause model hallucinations.**
:::
