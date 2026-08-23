---
title: 'In the LLM Era, What Exactly Is My Ability?'
published: 2026-06-12
featured: true
category: thought
kind: reflection
tags:
  - AI Coding
  - 博客
description: 'After a year of heavy AI coding use, my coding ability has nearly vanished. So what ability do I still have?'
series:
  - LLM
image: ../../assets/img/covers/neko.jpg
lang: en
translationKey: what-is-my-ability-in-llm-era
---

I began relying heavily on AI coding in the GPT 5 era, entering the rabbit hole through an inexpensive team account on Linux.do. Later I encountered reverse proxies and connected GPT to Claude Code; the experience improved qualitatively.

At the end of January 2026, I encountered openclaw and bought Claude Code Max around the same time—my first time using Claude. Claude 4.6 Opus changed my worldview.

[♻️ refactor(mcp): Discussion about Tool vs Skill vs Plugin.](https://github.com/XnneHangLab/XnneHangLab/issues/260)

Claude and I completely refactored the architecture I had originally discussed with GPT. It felt like talking to a senior architect. That was the first time I experienced what it meant to “think with a model”—and using a model in place of thinking means allowing myself to leave thinking mode.

## Yielding Code Review

After OpenClaw connected to GitHub, [Korewaxnne](https://github.com/xnne-bot) took over most of the work for me. At first, it only opened PRs and wrote PR messages—my pace of two or three PRs a day was disruptive for followers. I opened a new account to separate them, but a fixed workflow gradually formed: Claude Code writes the code → Korewaxnne opens a PR and reviews it → Claude Code revises it → I confirm CI is healthy, then LGTM and merge.

For four whole months, I yielded code review. That laziness was serious: it meant that not even I could say I fully understood what my own project was made of, nor could I fully **trust** it. A large volume of code was merged as long as it worked, had no static syntax errors, and passed unit tests. I even handed judgment at the feature level to AI.

I gradually became the person who steers the direction of the project—but I was not an architect, because Claude Opus 4.6 designed even the architecture. I merely made choices.

Sometimes I felt like a user, and chatting with Claude felt more like submitting requirements. For example, during the UI design of a knowledge graph, I said:

> “This monochrome design is too dull right now. Plain orange feels a little tacky and easily makes me think of shit. I want it to be cuter, more cartoonish, and more playful.”

Claude Opus 4.6 understood my intent precisely and changed the design to an indigo inner core with dark-purple outer-ring accents. The palette was exactly to my taste.

That kind of tolerance even deprived me of my **ability to describe and express requirements properly**. Even if I am an unreasonable user, Claude seems able to accommodate me.

> [!NOTE]
> What has degraded is not only coding: coding style, algorithmic foundations, architecture design, code review, prompt writing. Layer by layer, accommodation after accommodation has coddled me into a user embryo.

If I had to write things by hand now, I could not even make sense of simple Paddle or PyTorch operators. That is already flattering myself.

## Temporarily Leaving Claude

Claude was unavailable for two days, and those were the days that made me truly stop and think: what would I have left without it?

Claude’s tolerance of me in every respect has made me spoiled. DeepSeek-V4-Pro likes making broad, irrelevant code changes, so I ruled it out immediately. GPT-5.5 is good at coding, but communicating with it feels like talking to cotton: no matter how I knead it, it calmly springs back to its original shape while soothing my emotions. Perhaps my prompts really are that bad.

So if my coding ability is not enough to count as my ability, what should? A portfolio produced through Spec Coding? It cannot be, because as mentioned above, the absence of code review gradually loses both control over a project and the sense of trust in it.

Perhaps this differs from person to person, but for me, **the urge to express myself became the final protective charm of my bottom line**. I think **thinking, and leaving traces behind**, is my real ability.

[[After Building Long-Lived Systems: Is the RAG Monster Right for Constructing a Personal Blog Graph?]]

## Where Are the Boundaries of Ability?

I do not plan to follow the algorithms path, so my thinking rarely goes deeply along the model itself. It focuses more on **the capability boundaries of technology**: what a technology does well, what it does not, and under what conditions it fails.

For RAG, for example, I focus on two fundamental limitations:

### The Inarticulateness of Relationships

Vector similarity can connect two pieces of text, but even if the author themselves stands here, it is hard to say exactly what that connection is. Some relationship exists, but the meaning of the relationship itself cannot be expressed.

### The Short-Sightedness of Relationships

After an article is chunked for input, each piece has only one or two hundred Chinese characters. The calculated relationships see only surface matches between small chunks, lacking deeper connections from the perspective of the full text. Many things are not written between the lines—for example, you may group _Norwegian Wood_ and _Three Days of Happiness_ together by feeling alone: loss, then recovery, then regret. But text-chunk similarity matching struggles to reflect that higher-level connection.

> [!NOTE]
> How I define RAG’s capability boundary: it suits low-level association analysis built on a large volume of data—associations whose meaning is unknown, inarticulate, and impossible to explain clearly. It suits factual knowledge management, not analysis of emotionally felt texts. The latter cannot be taken out of context.

This way of defining boundaries is something I believe can be attributed to my ability. My core ability should be **reflecting on, probing, and recording those boundaries while using things**. Large models usually only tell you, “this is the right way to do it.” But why specifically, why not another way, and what can be done—users do not care about those questions. Even if they do, after hearing a large model’s explanation and gaining a vague impression, they simply nod along.

**But confusion needs to be untangled, and feelings need to be examined and recorded deeply.**

After recording something, I usually talk someone’s ear off about it—normally my roommate, though perhaps I can brainwash Doubao with it in the future. When I get stuck or someone stumps me, I go back to revise and investigate further. That is probably the Feynman learning method: explain the dross to others, and keep the essence for yourself.

## Unity of Knowing and Doing

In the LLM era, my coding ability can no longer count as my core ability. Situations that require a developer to investigate boundaries on the language side—such as the differences and trade-offs between `asyncio.to_thread` and `threading` in processes, CPU use, and memory allocation—will hardly appear again. This weakening is understandable. I only need to note down anything interesting I encounter—have AI write a memo so it will be easier to review next time.

At the same time, prompt writing, context management, planning, and choosing Skills and tools count as necessary abilities, but they are still not the core. They can yield a great deal of usage experience and understanding of LLM boundaries—for example, how the Lost in the Middle phenomenon guides prompt writing, the attention-decay curve, and the causes of hallucination.

**Code review** is different. The essence of review is not staring at bugs—large models can replace that labor—but a **picky, almost obsessive sensibility** about project structure and code organization, a pursuit of better solutions. That is what I lack. [SigureMo](https://github.com/SigureMo) has always retained this habit. Their high-level fastidiousness and pursuit of elegance astonish and impress me. Perhaps opening a few PRs to a big shot now and then will let me learn something.

> [!NOTE]
> AI has almost cut away the process of learning and coding. Someone with a weak coding foundation can maintain a frontend project—for example, I maintained two desktop projects without ever writing a line of Electron or Tauri code. Coding was skipped and time was left for thinking, but I often avoided thinking: I read novels while Claude wrote. The absence of thought made me doubt my own ability.
>
> The core ability as I see it is **actively thinking, understanding, and leaving traces behind**—which, for me, means writing a blog.

Perhaps we should not judge personal ability in the future only from a project portfolio; we should also look at **what someone truly understands and expresses**. In this respect, I admire [Shige](https://www.lapis.cafe/). In my view, they have achieved **the unity of knowing and doing**, which is also what I pursue.

Why call it the unity of knowing and doing? We used to value learning first, then doing. Now it is different: do first, but truly understand what you did and why you did it—**the weight of how you did it has fallen greatly**.
