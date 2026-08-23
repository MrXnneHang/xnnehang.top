---
title: What Does It Mean When Someone Looks Like a Yandere?
published: 2026-08-23
description: I started experimenting with SeedVR2 just to upscale a manhua-drama character I liked.
tags:
  - 病娇
  - 图像超分
category: culture
kind: note
draft: false
featured: true
lang: en
translationKey: yandere-appearance
---

I started watching manhua dramas around the time Seedance 2.5 came out, so I have genuinely felt how quickly the medium has improved. Character models in the better productions already look remarkably polished, and plenty of independent creators on Bilibili have begun using Seedance to make their own films. In that sense, AI has dramatically expanded what individual creators can express.

I am picky about manhua dramas, though. The character design has to catch my eye immediately, and the story cannot insult my intelligence.

A few days ago, I came across a heroine who made a yandere feel real for a moment—or rather, finally gave the yandere in my mind a concrete face.

Roll the tape—

:::compare{before="Original" after="Upscaled" label="Comparison 0: original and upscaled images" autoplay}
![Original image of the yandere character 16](../../assets/img/yandere-appearance/15-before.jpg)

![Upscaled image of the yandere character 16](../../assets/img/yandere-appearance/15-after.jpg)
:::

AI manhua dramas also share a common problem. To improve production efficiency, they often lower the generation resolution and reduce visual detail, leaving faces and clothing textures that do not hold up under close inspection. Even when I want to save a screenshot, the image quality is often disappointing.

I mainly follow 3D manhua dramas. Their visuals are not a natural fit for illustration-oriented tools such as RealESRGAN, nor for upscalers that push images toward photorealism. SeedVR2 3B FP16 happens to suit what I need.

It preserves the original texture of 3D character models. The 7B model tends to add too much realistic detail to faces, which can make the image look dirty—although part of the problem is simply that my hardware can barely run 7B. The 3B result is much closer to what I want.

Another strength of SeedVR2 is that it preserves the image's existing layers. It keeps Gaussian blur and a sense of haze instead of flattening the entire frame the way RealESRGAN often does. The softness in the image above survives the upscale. The difference may look subtle, but that is exactly what I wanted: the haze was what attracted me in the first place.

Here is another example if you want to look at how it restores layers of detail—

:::compare{before="Original" after="Upscaled" label="Comparison 1: original and upscaled images" autoplay}
![Original image of the yandere character 1](../../assets/img/yandere-appearance/00-before.jpg)

![Upscaled image of the yandere character 1](../../assets/img/yandere-appearance/00-after.jpg)
:::

Enough explanation. I am going to post the screenshots.

The last time I flooded a post with screenshots was in [[Fanfic]]. Looking back, the images there could probably use an upscale too. I may eventually package my current workflow into a portable SeedVR2 runner; ComfyUI is too heavy for what I need and poorly suited to batch processing.

The whole show has a dark visual treatment, and even its characters look slightly “dirty.” I suspect that was a deliberate post-production choice, since the story itself leans dark.

:::compare{before="Original" after="Upscaled" label="Comparison 2: original and upscaled images"}
![Original image of the yandere character 2](../../assets/img/yandere-appearance/01-before.jpg)

![Upscaled image of the yandere character 2](../../assets/img/yandere-appearance/01-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 3: original and upscaled images"}
![Original image of the yandere character 3](../../assets/img/yandere-appearance/02-before.jpg)

![Upscaled image of the yandere character 3](../../assets/img/yandere-appearance/02-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 4: original and upscaled images"}
![Original image of the yandere character 4](../../assets/img/yandere-appearance/03-before.jpg)

![Upscaled image of the yandere character 4](../../assets/img/yandere-appearance/03-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 7: original and upscaled images"}
![Original image of the yandere character 7](../../assets/img/yandere-appearance/06-before.jpg)

![Upscaled image of the yandere character 7](../../assets/img/yandere-appearance/06-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 6: original and upscaled images"}
![Original image of the yandere character 6](../../assets/img/yandere-appearance/05-before.jpg)

![Upscaled image of the yandere character 6](../../assets/img/yandere-appearance/05-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 8: original and upscaled images"}
![Original image of the yandere character 8](../../assets/img/yandere-appearance/07-before.jpg)

![Upscaled image of the yandere character 8](../../assets/img/yandere-appearance/07-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 12: original and upscaled images"}
![Original image of the yandere character 12](../../assets/img/yandere-appearance/11-before.jpg)

![Upscaled image of the yandere character 12](../../assets/img/yandere-appearance/11-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 11: original and upscaled images"}
![Original image of the yandere character 11](../../assets/img/yandere-appearance/10-before.jpg)

![Upscaled image of the yandere character 11](../../assets/img/yandere-appearance/10-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 15: original and upscaled images"}
![Original image of the yandere character 15](../../assets/img/yandere-appearance/14-before.jpg)

![Upscaled image of the yandere character 15](../../assets/img/yandere-appearance/14-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 18: original and upscaled images"}
![Original image of the yandere character 18](../../assets/img/yandere-appearance/17-before.jpg)

![Upscaled image of the yandere character 18](../../assets/img/yandere-appearance/17-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 19: original and upscaled images"}
![Original image of the yandere character 19](../../assets/img/yandere-appearance/18-before.jpg)

![Upscaled image of the yandere character 19](../../assets/img/yandere-appearance/18-after.jpg)
:::

:::compare{before="Original" after="Upscaled" label="Comparison 14: original and upscaled images"}
![Original image of the yandere character 14](../../assets/img/yandere-appearance/13-before.jpg)

![Upscaled image of the yandere character 14](../../assets/img/yandere-appearance/13-after.jpg)
:::

As for what it means to “look like a yandere,” I cannot really explain it. Maybe it is when, at first sight, you already start worrying about everyone else in the story.
