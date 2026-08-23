---
title: 'First Impressions of Obsidian-YOLO'
published: 2026-06-18
category: technology
kind: tutorial
tags:
  - Obsidian
  - YOLO
  - AI写作
description: A hands-on introduction to using the Obsidian-YOLO plugin and why it is worth recommending.
series:
  - Blogging
lang: en
translationKey: obsidian-yolo
---

I have been getting a little tired of writing blog posts in Obsidian lately. After switching to the Fuwari blog theme ([[Fuwari Blog Theme Guide]]), my local blogging syntax needs quite a few changes to become Fuwari-theme syntax. Image references also need to be handled. I often finish writing and simply throw away the source file, but YOLO, which I came across these past few days, happened to solve that problem for me.

The project source is here:

::github{repo="Lapis0x0/obsidian-yolo"}

The good news is that its author is an active maintainer, and PRs move very quickly.

## Installation

You can install it directly from the plugin marketplace.

![Installing the YOLO plugin](<../../assets/img/obsidian-yolo/Pasted image 20260618130052.png>)

As for why it is called YOLO, see the author’s post: [YOLO Development Log (1): Why Develop YOLO?](https://www.lapis.cafe/posts/ai-and-deep-learning/yolo/yolo-releasenote-01/)

## Configuration Notes

### Provider Compatibility

Here are a few pitfalls when configuring a custom provider through newapi.

I connected deepseek-v4-flash to NewAPI and then to YOLO. Along the way, I ran into these issues:

- Without `/v1`, newapi can retrieve the model list but does not actually reach the model itself, returning 200 directly. After this was fixed in a PR, it instead showed an empty-response error and prompted me to add `/v1`.
- Turning off reasoning passes `"none"` to `"thinking"`. I do not know whether newapi or deepseek-v4-flash is responsible, but it raised an error that the `"thinking"` parameter list does not include `"none"`. I also learned something from the author’s bot cat.

![Provider configuration screen](<../../assets/img/obsidian-yolo/Pasted image 20260618134726.png>)
![Provider configuration screen 2](<../../assets/img/obsidian-yolo/Pasted image 20260618135345.png>)

I did not expect even a cat to be better at reviewing code than I am.

It pointed out that a default reasoning intensity should not stand in for disabling reasoning. That creates a semantic problem: if a provider does not support `none`, it should be reused and given a supported way to disable reasoning. A model’s default reasoning intensity is usually low or medium, which conflicts with our intended meaning of “reasoning disabled.” The cat’s review was very sensible.

Also, if you encounter an empty response, press Ctrl+Shift+I to inspect the Console output, and check whether `/v1` has been added.

> If Ctrl+Shift+I does not respond, try going to `Settings -> Appearance -> Advanced -> Window frame style`. Set it to “Obsidian style” and restart. After restarting, you will see the Obsidian icon in the upper-left corner. Click it -> View -> Toggle Developer Tools.

### Configuring Tool Calls

All tools appear enabled in the default Agent.

![Agent tool configuration](<../../assets/img/obsidian-yolo/Pasted image 20260618160903.png>)

But when you talk to the Agent, you will find that it is not actually able to run terminal shell commands. You need to enable them again in the tools for `【Agent-Agents-Default (or a new Agent)】`.

![Enabling Agent tools](<../../assets/img/obsidian-yolo/Pasted image 20260618161202.png>)

You must also make sure the command being run is not on the denylist: `【Agent-Manage tools-Terminal commands-Configure】`.

![Terminal command configuration](<../../assets/img/obsidian-yolo/Pasted image 20260618161405.png>)

I also recommend writing it a Git skill and placing it in `YOLO/skills`.

## Feature Experience

### Conversation Sidebar

![Conversation sidebar](<../../assets/img/obsidian-yolo/Pasted image 20260618162058.png>)

The sidebar’s input state seems to include the current page’s blog post, line number, and surrounding content. It does not feel fragmented like a separate tool; instead, it is integrated quite well and feels very smooth to use. It can sometimes bring inspiration, and I can hand off chores like Git synchronization to it, avoiding the situation where I am too lazy to sync a repository manually and eventually lose data.

### Quick Conversation Dialog

You can open a quick conversation dialog with `/` + `Space` to describe what you need, without taking your hands off the keyboard.

![Quick conversation dialog](<../../assets/img/obsidian-yolo/Pasted image 20260618163233.png>)

The design philosophy behind this is beautiful, because frequently switching the right hand between mouse and keyboard can easily interrupt one’s train of thought.

### Tab Completion

You can trigger automatic completion with symbols such as `，`, `。`, and `\n` (a newline). The symbols can be added or removed, and after a configurable delay the LLM completion is triggered.

![Tab completion configuration](<../../assets/img/obsidian-yolo/Pasted image 20260618163412.png>)

But perhaps my thought process is unusual: the model usually cannot keep up with it. For example, I may write down one idea while my mind has already jumped through three further associations, and the model is still on the first layer trying to guess what I will say next.

And sometimes it does not reply at all. Next time I should turn on the Console and track it.

### Memory System

#### Markdown Source Memory Files

![Memory system interface](<../../assets/img/obsidian-yolo/Pasted image 20260618163928.png>)

It records user preferences, and overall is similar to mem0. This kind of memory record has the advantage of making it easier to understand what the user needs; many things can be completed smoothly without being explicitly emphasized. But recording this kind of Memory alone cannot affect the model’s own reply style. Or rather, deliberately keeping the model’s style neutral, fair, calm, and without personality is the default.

It is quite good as assistance, but I still prefer raising a cat with personality. This can be simulated by injecting personalized Skills, and the plugin itself does an excellent job supporting and building Skills.

#### RAG + Vector Database

This needs an embedding model. I do not have a suitable stable long-term API for now, and once a model is used to build the data, you generally have to keep using that model; otherwise, old and new data are incompatible because their dimensions differ.

I have not used it yet.

## Closing Thoughts

The experience has been good. At least when I wrote blog posts before, I had never experienced such an immersive Agent plugin. Overall, it feels very fresh.

Although the Agent still cannot keep up with how my brain works, it is at least more diligent than I am. And it saves me from all the tedious things between writing a post and publishing it—uploading images to a submodule and maintaining two sets of syntax. YOLO has my back.
