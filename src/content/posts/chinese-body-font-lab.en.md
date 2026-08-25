---
title: A Fitting Room for Chinese Body Typefaces
draft: false
published: 2026-08-21
description: Before changing the blog's body typeface, compare five candidates using the same headings, long-form prose, punctuation, mixed scripts, and weights.
category: technology
kind: note
tags:
  - 字体
  - Web Font
  - 中文排版
series:
  - Blogging
featured: false
lang: en
translationKey: chinese-body-font-lab
---

![A pink-haired girl standing by a window at dusk](../../assets/img/chinese-body-font-lab/PixPin_2026-08-24_11-05-59.jpg)

On blogs with more mature long-form typography, Chinese text often feels heavier and more orderly than it does here. At first I wondered whether I was simply tired of seeing my own site. A closer inspection showed that the difference is not merely novelty.

This site explicitly loads only Roboto, which has no Chinese glyphs. In practice, Roboto renders Latin letters and numerals while each device supplies its own system CJK fallback. Readers on Windows, macOS, and Android may therefore see different Chinese typefaces.

Rather than declaring a winner immediately, this page puts several candidates in one type lab. Every face receives the same headings, prose, punctuation, mixed Chinese and Latin text, and weight tests, so the decision can rest on actual reading rather than a first impression.

:::fontlab{locale="en" label="Chinese body candidates · same-text proof"}

## 字的重量，也是阅读的呼吸

黄昏从窗外慢慢落进房间。屏幕上的文字并没有发出声音，却在一行一行之间维持着自己的节奏。好的正文字体不该不断提醒读者“你正在看一款字体”；它更像一条平整的路，让目光自然地向前走。

中文排版最容易在细节里露出差异：引号“是否贴得太近”，句号。是否稳稳落在右下角；数字 2026、英文 Web Font 与汉字混排时，基线和视觉重量是否仍然一致？当页面从 16 px 缩到手机上的 14 px，笔画会不会发灰，字腔会不会糊成一团？

### 字重与标点

**常规正文 400** 应该清楚、安静而耐读；**中等字重 500** 可以承担小标题和强调；**粗体 700** 则要醒目，却不能忽然像从另一套字体里借来的字。

> 「山川异域，风月同天。」——引号、逗号、句号、破折号与中文共同决定了一段话的气质。

## What the five choices represent

### Current site

This is the baseline: Roboto handles Latin text and numerals, while Chinese relies on the system fallback. It adds almost no CJK font traffic, but glyphs vary by device. That inconsistency also contributes to the current impression that Chinese text is light and mixed-script composition feels loose.

### Noto Sans SC

Noto Sans SC belongs to the same type system as Source Han Sans. Its forms are neutral, its coverage is broad, and one variable font handles regular, medium, and bold roles. The site uses WOFF2 files already partitioned with `unicode-range`; the browser requests only the chunks containing characters in this specimen instead of downloading the full CJK font.

### LXGW Neo XiHei

LXGW Neo XiHei is an open-source modern sans with the character of a mobile system typeface. Its larger face and straighter structure make it feel fuller than the Source Han family. This sample uses OFL 1.1 `unicode-range` WOFF2 chunks. It supplies only a regular weight, so headings and bold text are synthesized, and its rare-character coverage is less complete than Noto's.

### Smiley Sans

Smiley Sans is a Chinese display face built around broad curves, narrow proportions, and a pronounced oblique. Its personality is much stronger than the body candidates above; it is included to test whether a striking first impression survives a full paragraph. The lab uses `unicode-range` WOFF2 chunks generated from the official v2.0.1 font with `cn-font-split`; OFL 1.1 permits web embedding, modification, and distribution. With one oblique regular face, it is deliberately not the conservative body-text option.

### LXGW WenKai Screen

LXGW WenKai Screen has a more humanist, handwritten character. That makes it a deliberate contrast to the site's modern sans-serif interface. It is also pre-split into WOFF2 chunks. However, it supplies only a regular face, so the browser may synthesize bold text—an important limitation to inspect before choosing it for long-form reading.

## How to judge beyond first impressions

I will evaluate each candidate by asking:

1. Does it remain comfortable after three to five minutes of continuous reading?
2. Are dense characters, horizontal strokes, and diagonals clear at small sizes?
3. Do quotation marks, brackets, colons, dashes, and mixed scripts sit naturally together?
4. Do 400 body text, 500 emphasis, and 700 headings form a stable hierarchy?
5. Does switching from fallback to webfont cause a noticeable reflow?
6. How many font chunks does a real article request, and is the transfer cost justified?

This post can remain as a permanent fitting room. Future candidates can join the same specimen whenever their licences permit web embedding, subsetting, and project distribution. That gives us a better basis than screenshots or a brief burst of novelty.

> [!NOTE]
> The lab downloads no candidate CJK font by default. Selecting Noto Sans SC, LXGW Neo XiHei, Smiley Sans, or LXGW WenKai loads that candidate's CSS and requests only the WOFF2 chunks containing characters in the specimen.

:::

# The site-wide default stays unchanged for now

This phase makes the choice observable. After reading the same specimen on desktop and mobile, in both light and dark themes, the winning face can be applied to article headings and prose. Navigation, cards, and buttons may keep a tighter UI sans, while code remains in JetBrains Mono.

At that point we will have chosen more than the typeface with the strongest first impression. We will have a Chinese typography system suited to reading this blog over time.
