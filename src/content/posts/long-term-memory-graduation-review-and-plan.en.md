---
title: "Go Build Long-Term Memory! A Review and Plan After Graduating with an AI Degree"
published: 2026-06-28
featured: true
category: Reflections
tags:
  - Reflections
  - Graduation
  - AI
  - Agent
  - Memory
  - Retrospective
description: "A simple, ordinary story: an eighteen-year-old's dream inspired by Plastic Memories became a research topic at twenty-two—along with a technical survey of long-term memory, a plan for breaking down projects, and a look ahead at life."
lang: en
translationKey: long-term-memory-graduation-review-and-plan
---

![cover](../../assets/img/graduation-review/graduation-review-cover.png)

> [Go Build Robots! An Annual Review After Graduating with an AI Degree](https://blog.nagi.fun/2025-memo?lang=zh) inspired this post. I want to begin with a RoadMap and a simple review of my undergraduate years, partly to ask myself: what am I truly pursuing?

## An Ordinary Story

In June 2022, X had just finished watching _Plastic Memories_. Carrying a dream of a cyber girlfriend, he opened Xiaojia Yu’s introductory Python course, bought a copy of _Python Basics_ that he never carefully read before graduation, and happily applied to XMUT’s Artificial Intelligence program. ChatGPT 3.5 was released on November 30, 2022—less than three months later.

During an online self-introduction after enrollment, X made a small animated introduction with Python’s pygame, but in the end he was still forced to turn on his microphone and speak. There was no escaping it; there really was no escaping it.

In November 2022, X completed a creative C++ course project: hooking the message content of TIM (QQ) through its window handle and generating replies.

<iframe src="https://player.bilibili.com/player.html?bvid=BV1wM411k7q9&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

That was the first time X realized that there was already a way to reply, but how could a reply have a soul? He then began studying PyTorch—CNN, ResNet, Transformer, ViT—and BERT on Udemy.

Before X had even figured out what BERT was, ChatGPT 3.5 arrived. Soon, someone was using ChatGPT 3.5 + Live2D + VITS + Unity to build conversational virtual humans. Productivity really does rise when the goal is a cyber girlfriend.

<iframe src="https://player.bilibili.com/player.html?bvid=BV1TD4y1E7e8&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

At the time, there were almost nothing but hard-coded system prompts and very short context windows, but to X it still felt close to a miracle.

Around then, X was writing a ResNet classifier for anime characters in a higher-math class when the professor asked whether he wanted to join their lab; they had datasets there. X innocently went along. Then came weekly meetings, dataset cleaning, hyperparameter tuning, requests to improve some Net for a particular task, and, even during winter and summer breaks, the dreaded every-two-weeks question: `Any progress lately?` Life as a graduate student began to cast a shadow over X.

At the time, X silently swore never to pursue graduate school. After two rounds of revision, he did publish a paper on using Deep-LSTMs to predict the discharge time of COVID-19 patients. He also swore never to improve neural networks again: it was boring, time-consuming, a black box, and gave no feedback.

To relax, X started playing with the VITS family, getting into BERT-VITS2 and GPT-SoVITS. This time he avoided the model networks themselves and only worked on development-oriented things. He trained a voice for a little Soyyo:

<iframe src="https://player.bilibili.com/player.html?bvid=BV1g94y1L7re&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

He also wrote a tool for quickly making VITS-family datasets—although GPT-SoVITS later provided a better official one. Still, it was the first time X experienced the joy of open source. Even though the code was rough, he kept that repository pinned in his profile. It was his starting point.

Not long afterward, X met [SigureMo](https://github.com/SigureMo), who was something like X’s teacher. They did not teach him directly, but over two or three months X completely reshaped his coding workflow around theirs: ruff, pylint, pytest. He also absorbed their approach to code review: why do this, is there a better way, and is this the smallest change without loose ends?

With SigureMo’s guidance, X also took part in Paddle’s Qihang program. There he first experienced what it felt like to work in a white box. Neural-network tuning gives no way to predict whether results will improve, but deep-learning-framework operator bug fixes or extra type support do. During that time, he was truly happy writing code. There were mishaps too: SigureMo wanted X to introduce typos through pre-commit and assigned X the reviews for those simple spelling fixes. But because X had never reviewed code before, he did not know that a review had to be submitted before anyone could see it. He left many reviews pending =-=. No one replied, and he was initially confused until SigureMo had to wrap them up every time; only then did X realize that no one could see his reviews.

SigureMo always took good care of X and gave him the closeness of finding someone similar, though X must have caused SigureMo plenty of headaches. SigureMo has always been X’s mentor in open source.

There were roughly two reasons X later left Paddle. First, X did not much like grinding LeetCode and found C++ and algorithmic principles difficult, so he could not directly take on high-star hackathon tasks. For example, he picked up an alignment task for the `torch.grad` operator and got stuck for two weeks. If Claude Opus 4.6 had existed then, X could have worked through it piece by piece and learned from it, but at the time OpenAI only had GPT-4o, which was not very capable of reading Paddle. SigureMo did not work on operators like `torch.grad` either—perhaps their math was not that good?—and X was afraid of troubling others. Was troubling SigureMo somehow acceptable? So X quietly cancelled the task assignment and quietly left.

Was that the right thing to do? X does not know. But he decided that someday he would contribute to SigureMo’s [yutto](https://github.com/yutto-dev/yutto). He also made a GUI version of yutto.

<iframe src="https://player.bilibili.com/player.html?bvid=BV1yRdBBsEGZ&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

After leaving Paddle, the dream of a cyber girlfriend from the beginning of university slowly resurfaced. Even though half of X’s university years had already passed, he wanted to go all in and put all his energy into developing a desktop companion.

That was how the XnneHangLab repository began. It is a story that is still continuing.

This project used almost everything X had learned: TTS, ASR, Live2D, and Agents.

On top of [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber), X added Skills, Tools, Memory, and proactive conversation. To do that, he built an Agent framework tailored to his own project—[[What We Built When Mainstream Agent Frameworks Could Not Fit Our Needs]].

X used this project as his graduation project. Yet even while standing at the defense podium, he still had so many plans and expectations for the application: hoping DeepSeek V4.1 would bring multimodal visual understanding and reduce the LLM-call delay for proactive conversation to a single call; hoping to unravel the mysteries of long-term memory. For performance and time, he merely reused [mem0](https://github.com/mem0ai/mem0) for RAG and [memsearch](https://github.com/zilliztech/memsearch) for Markdown-file memory. He had not had time to think more deeply. There were too many reflective posts still unwritten, including [[After Building Long-Lived Systems: Is the RAG Monster Right for Constructing a Personal Blog Graph?]]. There was still more to break down: how should memory requirements really be built, what can be learned from others, and how should many repositories be unpacked—[AlfreScarlet/MoeChat](https://github.com/AlfreScarlet/MoeChat), [Anson-Trio/BaiShou](https://github.com/Anson-Trio/BaiShou)? He had not yet properly considered how file-based memory and persona files should be arranged or layered; how they should be indexed; how documents read each time should be generated and organized; how context length should be controlled; how bidirectional references should work; or whether metadata + nodes are necessary.

This story will continue, but X still has some time. Once again, he went all in: after graduation, he joined [NevaMind-AI](https://github.com/NevaMind-AI) as a remote developer in an internship-like role. Not full-time, not job hunting—but why? Because even if he joined a small company to do Agent development, repeatedly and mechanically using LangChain or LangGraph to build and maintain applications every day would be far less interesting than thinking about Agents themselves. Or perhaps it is not a question of interestingness. Will Agent development still follow that pattern in the future? Claude Fable 5 had been available for only a day, yet it had already made many people feel that future LLMs might not need manually authored workflows at all; perhaps the details of a workflow should be decided by the model itself. Perhaps people will only need to write requirements. Then the old form of Agent-development roles will change completely, and X will have to adjust direction—again falling into an anxious, involuntary state he had known well from the days of frequent sophomore-year group meetings.

X still wants to make a cyber girlfriend; that is what keeps him moving. But after LLMs arrived, the question changed from how to make a model speak naturally to how to let it sustain, update, and maintain its persona and memory over time. That is what we will discuss next.

> A small interlude: just after X joined NevaMind AI, he unexpectedly received an invitation to talk from [https://ai-mage.jp](https://ai-mage.jp/news). The invitation said: `AI Mage is building AGI (Anime General Intelligence) that deeply understands Japanese anime contexts, and is looking for a core development partner with strong engineering ability and an interest in anime / animation content.` Was the combination of an Elaina avatar and a Frieren profile card somehow working its magic again? But X has given himself to the dream and cannot give himself to anyone else; right now he only wants to make a cyber girlfriend. More precisely, beyond the form a cyber girlfriend takes, he cares more about her soul.

And this is a simple, ordinary story: a dream that began with _Plastic Memories_ at eighteen became a research topic at twenty-two.

## The Plan

This section will probably keep being revised and expanded. It mainly revolves around long-term memory.

First, I want to build a basic understanding of the different directions in LLM long-term memory:

- **Reinforcement learning + distilled internalization** — fold memories into model parameters. Rewards are sparse and the optimization space is large; I am not personally drawn to it, and its compute cost at runtime is too high to be practical.
- **Reflection & brain-inspired approaches** — follow neuroscience and cognitive science. They make for a compelling story; experiments determine the result. This may also provide guidance for how content is organized in Markdown.
- **Hierarchical memory** — short-, medium-, and long-term; L1/L2/L3. This is currently the mainstream approach, though I do not know it well yet.
- **Knowledge graphs & vector spaces & RAG** — if it is only simple CRUD, there is not much to see. Text chunks embedded as vectors are fragmented in themselves, and the relationships produced by vector similarity are also inarticulate.
- **File-system-style memory** — organizing memory with Markdown + folders. This is also the direction I am trying now, and perhaps MemU’s position too? But the specific layers and indexes still need study.

After I understand these directions to some degree, I may need to find a representative example for each: mem0 for RAG, BaiShou for L1/L2/L3, and papers for brain-inspired approaches. Then I can study the trade-offs and design philosophies of open-source Memory Agent projects and papers, and identify what is worth learning from.

Because the points we must always balance are when long-running memory retrieval is allowed and when we want to reply as quickly as possible. There is no best memory system, only the most suitable one.

### Breaking Down Memory Agent Projects

::github{repo="AlfreScarlet/MoeChat"}

::github{repo="Anson-Trio/BaiShou"}

::github{repo="zilliztech/memsearch"}

For now, these are the ones on the list. MemU is included too, of course, because I will later take part in refactoring-oriented development.

But I think that, rather than immersing yourself in one project, it can sometimes be more beneficial to look at more projects and break down more of them. Now, Claude can arguably write code in our place, but what we should write deserves careful thought. And that is usually not something we can devise by sitting still; it is better to see more and reflect more.

The project breakdowns will become a blog series and will gradually make their way into my own XnneHangLab.

### Sleep & Fitness

The night before the graduation ceremony, my roommate and I talked late into the night.

We spoke about the feeling of gradually losing control over ourselves through revenge bedtime procrastination caused by stress, and about how going to bed at ten for several days in a row made us feel smarter and more able to act.

Because I work remotely and do not yet know what the workload will be like, I cannot draw conclusions for now. I only hope I can keep going to bed early.

As for fitness, I should probably do cardio for a month first, then consider getting a gym membership. If the weather is not good—recently it really seems not to be—I may need to get one early, or buy a treadmill myself.

### Games & Recording

As graduation approached, I did not lament wasting time by failing to study more. Instead, I lamented wasting time by failing to play more games. Why?

Teamfight Tactics and Valorant, for example: games that require multiple people, offer achievement through rank, and provide enjoyment through gaming companions become dull after you leave those companions or finally reach your rank ceiling. Or perhaps those games are dull in themselves, and only feel interesting because of the company.

They also taught me a philosophy: happiness does not come from expectation, but from experience after beginning. A book may not look interesting at first, but once you actively read a few pages, you will often keep reading many more. Once many things begin, they do not easily stop. In games this may waste time, but the phenomenon itself can be used.

I hope to keep playing games such as _Fengxin Tower_, _Volcano Princess_, _Chinese-Style Blind Date_, and _Red Dead Redemption 2_, and, if I can, write down some impressions.

For example, I recently added _Dreamy Magical Princess_ to my library but have still not played it, and _Daughter of the Bright Moon_ will be released later. It is the summer sale now: add more games, experience more things.

I hope that, this time, the wish to experience more interesting games will not remain only a fantasy or regret. Or even if it does, I should consciously leave more records like [[Fengxin Is a Good Name]].

### Novels, Films, and Afterthoughts

I read far fewer physical novels during university than I did in my three years of high school.

That includes the Raspberry Pi + projector setup I tinkered with in my sophomore year. After I finished setting it up, I did not watch more than ten films.

<iframe src="https://player.bilibili.com/player.html?bvid=BV17zDWYwEj8&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

Keep writing after watching~

But not just to write for writing’s sake.

## Finally

Thank you for reading this far~

I hope we can still be adorable in the future~

And I hope adorable things keep drawing us in~
