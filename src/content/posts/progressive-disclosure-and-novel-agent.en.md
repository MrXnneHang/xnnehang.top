---
title: "Starting with How We Use Skills: What Are Progressive Disclosure and Task Decomposition, and What Do I Want to Explore?"
published: 2026-07-03
featured: true
category: Reflections
tags:
  - Progressive Disclosure
  - Skills
  - Symbolic Language
description: "Reading notes on How We Use Skills: when you cannot put everything in front of an Agent at once, how do you keep it effective? Progressive Disclosure and Task Decomposition."
image: ../../assets/img/progressive-disclosure/cover.png
lang: en
translationKey: progressive-disclosure-and-novel-agent
---

:::note[Notes from Korewaxnne]
This is one of Xnne’s reading notes, on Anthropic’s well-known _Lessons from Building Claude Code: How We Use Skills_. But instead of obediently writing a conventional response, he starts with “progressive disclosure,” wanders into a novel Agent’s symbolic abstract language, and even detours into how the opening of _Six Records of a Floating Life_ could be broken down with a description chain. Halfway through, Claude Fable 5 pulled him into an argument; the exchange ended up clarifying the boundary between progressive disclosure and task decomposition completely. A typical Xnne-style divergence: start from one point, excavate a whole field of things he truly cares about, then argue the concepts until they become as clear as possible.
:::

## Some Digressions

I plan to read [Lessons from Building Claude Code: How We Use Skills](https://x.com/trq212/status/2033949937936085378).

Here is a Chinese translation by DeepSeek: [lessons-building-claude-code-how-we-use-skills-cn.md](https://github.com/MrXnneHang/xnnehang.top.factory/blob/main/lessons-building-claude-code-how-we-use-skills-cn.md)

But because of the special nature of submodules, GitHub cannot render images stored in another repository directly. So I can only pull it down and sync the submodule locally to view it.

Because of copyright concerns, I cannot repost someone else’s article directly on my blog. My [blog](https://xnnehang.top/) has a relatively permissive license, [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/): non-commercial reuse is fine as long as there is attribution.

## What Do I Want to Know? Ask First.

Ever since I realized that I might have ADHD, I have made a habit of asking questions first. If I do not figure out what I want to know, I will probably never finish reading an article like this.

## What Exactly Is Progressive Disclosure?

> There is a small issue with this definition itself, though it is not a big one. See Fable 5’s correction in the final section.

I think progressive disclosure can be used for more than Skill design and loading. To me, it is closer to a design philosophy: a concrete magic play built on understanding a model’s capabilities.

Once you know where a model’s ability reaches its limit, it is about taking work that cannot be finished in one input-output pass, splitting it into step-by-step inputs and outputs, and lowering the threshold for the first step and every following step. At each step, you try to bring out the model’s full ability.

For example, in something I wrote yesterday—[[memU's Architectural Shift Through the Eyes of a Consumer-Facing Developer]]—I mentioned this:

> Earlier I mentioned giving reasoning capability to an agent loop, allowing the agent to query repeatedly. But an agent’s ability degrades in long contexts. I did something similar in XnneHangLab: I relied on the agent itself to retrieve and extract memories. After a long conversation, tool-calling execution rates fell greatly, as did the trigger rate for Skills with long tool chains. In the end, I had to switch to several step-by-step LLM calls by splitting tool calls. An agent loop merges multiple steps into a single decision at the first step. Does that make the first step too difficult?

At the time, I accidentally came up with a solution to that one. It was actually an expression of progressive-disclosure thinking.

And in the blog post I am reading this time, it is a best practice for progressive disclosure in Skills.

But I do not want to see only an engineering pattern for Skills. I want to extend it.

## What Do I Want to Understand and Extend?

### How to Understand a Project Through Progressive Disclosure

> This is also what memU is doing during its refactor.

For example, can it guide how an Agent—or a group of Agents—should explore and break down a project, then form path files that can rapidly guide thinking the next time?

> Why not record everything, instead of only doing agentic search/exploration?

#### It Becomes Stale

Records are usually fragmented and documentation-like, organized as a folder tree. That means they can easily become stale once written. Maintaining docs usually requires a maintainer to remember every piece of them deeply, but LLM-written docs generally cannot achieve that.

#### Annotation-Style Docs Are Not Needed

Or perhaps docs are generated automatically from docstrings. But for an Agent, such docs are garbage docs. For ordinary people, reading code without comments or docstrings is painful because they need to read many related parts before they understand the relationship between functions and classes.

But for an Agent, comments are optional because it can understand uncommented code directly; its understanding window is much larger than a normal person’s. For an Agent, incorrect and stale comments or docstrings are the real hallucinations, the things that cause pain.

---

### Applying Progressive-Disclosure Thinking to a Novel Agent

For example, could it guide the construction of special Agents such as a novel-writing Agent?

> What is the fundamental difference between an Agent that writes novels and one that writes code?

Setting aside other independent Agents used for outlining and reviewing when writing a long novel, let us discuss only the ghostwriter: the Agent responsible for turning an outline or idea into an actual novel.

### Style and Pacing

For novels, style and pacing are the most magical things.

They are abstract. They may include describing an environment as if moving a film camera, emphasizing a “sense of imagery.”

They also include ensuring that, after reading a character’s speech or inner thoughts, a voice remains in the reader’s mind—making each character’s language distinct.

Writing must be able to move readers’ emotions. It needs empathy; its language cannot be too plain, and it must carry feeling. Perhaps humor, perhaps intensity. This sounds a little abstract, so here is an example:

> In the winter of the guǐwèi year of the Qianlong reign, on the twenty-second day of the eleventh month, I was living in an age of peace, born into a family of robes and caps, beside Canglang Pavilion in Suzhou. Heaven had been exceedingly generous to me. Su Shi said, “Events are like a spring dream, leaving no trace.” If I did not set them down in writing, I would fail Heaven’s generosity. Thinking that _The Ospreys_ stands at the head of the Three Hundred Poems, I therefore place husband and wife at the beginning of this volume, and let the rest follow in order. I regret that I missed much schooling in youth and know only a little; I merely record what truly happened. To demand that I verify its grammar would be like asking a bright mirror to inspect dirt.

I do not ask every reader to feel it, but a work must have its own readership.

There are also some quantitative measures, depending on the platform. Some want long paragraphs and little dialogue, calling it slow pacing. Others want short paragraphs and a high proportion of dialogue, calling it fast pacing.

Slow pacing especially considers cinematic, shot-like narration and the cultivation and movement of readers’ emotions.

Fast pacing especially considers character dialogue, contrast in personality, and the tension of the plot.

And if you are writing a long novel, the Agent must also keep its understanding of character personality and language, relationships, and storylines from drifting over a long text.

How hard is a novel Agent to build? Put simply, if an Agent can write long novels well, there is basically nothing that can stump Agents themselves.

The difficulty of writing a novel is that every ability mentioned above must be present and must perform well at the same time.

Unlike a coding Agent, which loads one Skill at a time, a novel Agent wants to load every Skill at once. That inevitably runs into the limitation mentioned in [Lessons from Building Claude Code: How We Use Skills](https://x.com/trq212/status/2033949937936085378).

When you give an Agent many complex and hard-to-understand rules at once, it loses its original flexibility and performs less well.

![A comparison between an overly rigid six-step cherry-pick workflow and better flexible instructions—the former hard-codes every step, while the latter states intent and lets Claude adapt](../../assets/img/lessons-building-claude-code-how-we-use-skills/06-avoid-railroading.jpg)

The better approach described there is to tell an Agent which necessary elements an elegant approach should include, rather than spelling out every step of the path you think is elegant. Come on—do you think you understand Git usage and workflow better than Claude Opus or Fable? You only need to tell it what deserves attention in your repository. For example, you expect commit messages to be entirely in English and include cute gitmoji. Add that, and you get cute gitmoji every time.

So a novel Agent still has a long way to go. Perhaps I took the wrong road from the beginning, when I built complex Skills.

But when I chatted with a roommate, we seemed to touch on some progressive-disclosure design.

We stopped pursuing a complete article in one pass—or, more precisely, stopped trying to write the body immediately. Instead, we used multiple steps. How exactly?

First, establish a symbolic abstract language.

This symbolic language includes descriptive techniques, descriptive objects, and descriptive themes.

> In the winter of the guǐwèi year of the Qianlong reign, on the twenty-second day of the eleventh month, I was living in an age of peace, born into a family of robes and caps, beside Canglang Pavilion in Suzhou. Heaven had been exceedingly generous to me. Su Shi said, “Events are like a spring dream, leaving no trace.” If I did not set them down in writing, I would fail Heaven’s generosity.<br>
> Thinking that _The Ospreys_ stands at the head of the Three Hundred Poems, I therefore place husband and wife at the beginning of this volume, and let the rest follow in order. I regret that I missed much schooling in youth and know only a little; I merely record what truly happened. To demand that I verify its grammar would be like asking a bright mirror to inspect dirt.

Still this passage.

It can be split into two segments for generation.

Turn it into a description chain like this:

> I -> lyricism@origins, “Events are like a spring dream, leaving no trace”【slow】~desolation -> self-mockery【fast】~humor<br>
> I -> discussion@classical tradition (“The Ospreys”) -> narration@placing husband and wife at the volume’s beginning【slow】~~solemnity -> self-mockery@grammar and learning~~humor

Of course, this description chain is a little abstract. I made it up from memory; my roommate was mainly researching it at the time, and I am truly not very good at specifying rules like this.

In any case, first generate this kind of description chain to avoid needing a mass of Skills to constrain an unstable writing style at once.

The intention is to specify narrative pacing and style in this way. I remember my roommate adding an example for every technique.

Then the LLM needs to be able to encode—abstracting a novel into this kind of description chain—and turn a description chain back into a novel. But not merely restore it: it must even change the phrasing, then reread it, to verify that the LLM truly understands that style and pacing itself.

## Start Reading, and Put Attention Where I Want It

What a Skill is and the specific categories of Skills.

I skipped almost all of it. I could not see anything at a glance. I concede it: I really do have a reading disorder.

### How to Write Skills

#### 1. Do Not Write the Obvious.

As I just mentioned, do not think you understand Git usage and conventions better than Anthropic does.

![A comparison between an overly rigid six-step cherry-pick workflow and better flexible instructions—the former hard-codes every step, while the latter states intent and lets Claude adapt](../../assets/img/lessons-building-claude-code-how-we-use-skills/06-avoid-railroading.jpg)

#### 2. Build a Gotchas Guide

![The Gotchas section of a billing-lib SKILL.md grows progressively from Day 1 to Week 2 to Month 3, adding one new pitfall each time](../../assets/img/lessons-building-claude-code-how-we-use-skills/04-gotchas-section.jpg)

Claude can make mistakes with personalized libraries or requirements, so tailoring gotchas for such a library pays off well.

One thing that sometimes drives me crazy about OpenClaw is that I ask it to write down a gotcha again and again, but I cannot remember why it keeps repeating the same mistake. Did it write the rule into some unknown corner, or does it simply never reread its written rules after every session refresh?

Add one entry after every pitfall, but those gotchas must be retrievable. Otherwise, the same mistake will still happen.

#### 3. Make Good Use of Progressive Disclosure in the File System

![A queue-debugging Skill folder centered on SKILL.md, linking to spoke files—stuck-jobs.md, dead-letters.md, retry-storms.md, and consumer-lag.md—plus a symptom-to-file lookup table](../../assets/img/lessons-building-claude-code-how-we-use-skills/05-progressive-disclosure.jpg)

a. Use references instead of loading a complete Skill.
b. If Markdown output is needed, use fill-in-the-blank templates instead of generating everything from scratch. Allow copying and pasting a template.

#### 4. Extract Inputs That Need User Answers from a Skill into config.json.

Some Skills may need the user to choose one or more input sources, like this:

![](../../assets/img/progressive-disclosure/config-json-example.png)

Something like this should be extracted into config.json rather than entering the context directly with Markdown.

#### 5. A Description Is Not a Summary of Tool Contents; It Describes When and Why to Trigger.

![A comparison between two babysit-pr SKILL.md descriptions: the left is a vague summary; the right is trigger-oriented and lists phrases such as “babysit,” “watch CI,” and “make sure this lands”](../../assets/img/lessons-building-claude-code-how-we-use-skills/08-description-field.jpg)

#### 6. Prepare Common Scripts Ahead of Time Instead of Writing Them When Needed.

![A lib/signups.py file with helper functions including fetch, by_referrer, and by_landing_page; each function records pitfalls in its docstring](../../assets/img/lessons-building-claude-code-how-we-use-skills/10-helper-functions.jpg)

This is especially obvious with web-based GPT. If you ask GPT to write or edit a docx directly, it will often spend more than ten minutes writing a terrible Python-based script to read and modify the docx, then mangle your document completely.

But if you use Claude Desktop in Cowork mode with a docx Skill installed in advance, it is at least fast and stable. It avoids writing a Python script from scratch every time.

#### 7. Should Skills Depend on One Another?

Should we make the Skill ecosystem resemble PyPI?

Could packages depend on other packages?

It sounds great, but as already mentioned above:

Agent capabilities vary and will only grow stronger. Some old Skills and rules work well now, but may become prompts and constraints that actively make things worse later. So Skills should be understood inside and out. Skills you wrote yourself can depend on one another, but it is best not to depend on other people’s Skills.

## Finished Reading

It gave me some things to think about.

But most importantly, it gave me an opportunity to think about what progressive disclosure is and where I want to extend it.

That is: progressive disclosure aimed at understanding projects, and progressive disclosure aimed at novel Agents.

Everything else was more like review and confirmation, turning formerly vague intuitions into definite concepts.

There were small gains too. For example, I can now clearly answer whether Skills should depend on one another and whether they should become a PyPI-like ecosystem.

Previously, that should have been a no.

## A Correction from Fable 5: Confusing Progressive Disclosure with Task Decomposition

Here is Claude Fable 5’s correction of the ideas in my post:

> Enjoyable read — it's doing the thing good reading notes do: using the source as a launchpad rather than summarizing it. My honest assessment of his core claim:
>
> His view is right in spirit, but stretches the term. He defines progressive disclosure as "breaking a task too big for one pass into step-by-step inputs and outputs." That's actually task decomposition, a sibling technique. Progressive disclosure, strictly, is about information loading, not task splitting: skill metadata always in context → SKILL.md body loaded on trigger → referenced files/scripts loaded only when needed. The distinction matters because they fix different failure modes. PD fixes attention dilution (context stuffed with irrelevant rules degrades everything). Decomposition fixes capability limits (one pass can't hold the whole task). His memU example — splitting tool calls across multiple LLM calls after long-context degradation — is decomposition. Both fight the same enemy, so his generalization is useful intuition, just imprecise vocabulary.
>
> **Where he's clearly right:**
>
> - **Skills as "what to pay attention to" rather than step-by-step instructions** — this matches how skills actually work best. Over-specified procedures turn into straitjackets as models improve, which is also why his answer to "should skills depend on each other like PyPI" (no) is sound.
> - **Gotchas being useless unless recalled** — correct diagnosis. A gotcha outside the retrieval path (trigger description or always-loaded context) may as well not exist.
> - **The novel-agent observation is his sharpest** — coding constraints are modular (load one skill at a time), but style/pacing/voice are cross-cutting — they must apply to every sentence simultaneously. That's a real architectural difference, well stated.
>
> **Where I'd push back:**
>
> - **"Comments are optional for agents, docs are garbage" overshoots.** Stale docs cause hallucination, yes — but the fix is docs that are cheap to keep true (curated, high-level, intent-focused), not no docs. Agents still pay real exploration cost without a map, which his own "path files" idea implicitly admits.
> - **The description-chain idea is promising but it's an intermediate representation with staged generation, not PD.** Its hard problem: style lives partly in exactly what a symbolic chain can't capture. The encode→decode→verify round-trip is the right test for that, though — good instinct.
>
> **Net:** right philosophy, blurry taxonomy, and one or two ideas worth an actual experiment.

---

Put simply, my intuition was right, but my phrasing and definition were not precise enough.

I defined “Progressive Disclosure” (PD) as “splitting a large task that cannot be handled in one interaction into step-by-step inputs and outputs.”

In fact, I confused **Task Decomposition** with **Progressive Disclosure (PD)**:

- **Task Decomposition** addresses **the limits of an Agent’s capability in a single pass**: when one LLM call cannot take in the whole task, split it into several interactions or LLM calls.
- **Progressive Disclosure** addresses **attention dilution, distraction, and conflicts caused by excessive redundant rules in context**: put only a metadata index in context, load the specific `SKILL.md` only when it is triggered, then read referenced scripts or files when further needed.

Both aim to resist the degradation of large-model capability, so this instinct to extend them was a good one. I was simply not rigorous enough with the terminology. I originally planned to generalize progressive disclosure, but generalized it so far that I accidentally uncovered another engineering principle I did not originally understand: task decomposition.
