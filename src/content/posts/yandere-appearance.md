---
title: 什么叫做从她的长相就能看出来是病娇？
published: 2026-08-23
description: 为了给喜欢的漫剧角色做超分，我折腾起了 SeedVR2。
tags:
  - 病娇
  - 图像超分
category: 胡思乱想
draft: false
featured: true
---
我大约是在 Seedance 2.5 出来那阵子入坑看漫剧的，所以也确实能感受到漫剧成长的速度。目前精品剧的人物模型细节已经非常能打了，B 站也有不少个人制作者开始用 Seedance 做个人电影。从这方面来看，AI 极大地释放了个人创作者的表达力。

而我看漫剧很挑剔，人物建模必须在第一眼吸引我，同时剧情不侮辱智商。

比如前几天，我看到了一个女主人公。那一瞬间，我觉得病娇照进了现实；或者说，病娇在我心里终于有了具体的样子。

请看 VCR——

:::compare{before="原图" after="超分图" label="第 0 张原图与超分图对比" autoplay}
![病娇角色原图 16](../../assets/img/yandere-appearance/15-before.jpg)

![病娇角色超分图 16](../../assets/img/yandere-appearance/15-after.jpg)
:::

另外，目前 AI 漫剧有个通病：为了提高生产效率，通常会压低生成分辨率，减少画面细节，导致很多角色的脸部和衣物纹理经不起细看。所以即便想截图保存，也会发现图像质量很低。

而我关注的主要是 3D 漫剧。这类画面既不太适合面向插画的 RealESRGAN，也不适合偏写实的超分模型。恰好 SeedVR2 3B FP16 能满足我的需求——

它不会破坏三维建模人物原有的质感。7B 往往会给角色脸上补充太多写实纹理，反而让画面显得脏脏的；当然，也有一部分原因是我的设备确实有点跑不起 7B。相比之下，3B 的效果正合我意。

同时 SeedVR2 很强的一点就是不会破坏图像原本的层次，对于一些高斯模糊或者图像的朦胧感，它会保留，而不会像 RealESRGAN 那种全图抹平。比如上图的这种朦胧感没有被 SeedVR2 所破坏，虽然因此看上去变化不大但恰逢我意，吸引我的正是这份朦胧感。

如果要看细节层次的恢复，我这里也有一个例子——


:::compare{before="原图" after="超分图" label="第 1 张原图与超分图对比" autoplay}
![病娇角色原图 1](../../assets/img/yandere-appearance/00-before.jpg)

![病娇角色超分图 1](../../assets/img/yandere-appearance/00-after.jpg)
:::

话不多说，我就在这里贴截图了。

上次狂贴截图还是在 [[青春同人志]]。回头看了下，那边的图像似乎也需要超分一下。之后或许会把我现在用的流程整理成一个 SeedVR2 便携推理包；ComfyUI 那套对我来说太重，也不适合批处理。

我发现这部剧的整体画面都偏暗，人物也都有点“脏”。感觉是后期故意这么处理的，毕竟剧情走的是黑暗风。

:::compare{before="原图" after="超分图" label="第 2 张原图与超分图对比"}
![病娇角色原图 2](../../assets/img/yandere-appearance/01-before.jpg)

![病娇角色超分图 2](../../assets/img/yandere-appearance/01-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 3 张原图与超分图对比"}
![病娇角色原图 3](../../assets/img/yandere-appearance/02-before.jpg)

![病娇角色超分图 3](../../assets/img/yandere-appearance/02-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 4 张原图与超分图对比"}
![病娇角色原图 4](../../assets/img/yandere-appearance/03-before.jpg)

![病娇角色超分图 4](../../assets/img/yandere-appearance/03-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 7 张原图与超分图对比"}
![病娇角色原图 7](../../assets/img/yandere-appearance/06-before.jpg)

![病娇角色超分图 7](../../assets/img/yandere-appearance/06-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 6 张原图与超分图对比"}
![病娇角色原图 6](../../assets/img/yandere-appearance/05-before.jpg)

![病娇角色超分图 6](../../assets/img/yandere-appearance/05-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 8 张原图与超分图对比"}
![病娇角色原图 8](../../assets/img/yandere-appearance/07-before.jpg)

![病娇角色超分图 8](../../assets/img/yandere-appearance/07-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 12 张原图与超分图对比"}
![病娇角色原图 12](../../assets/img/yandere-appearance/11-before.jpg)

![病娇角色超分图 12](../../assets/img/yandere-appearance/11-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 11 张原图与超分图对比"}
![病娇角色原图 11](../../assets/img/yandere-appearance/10-before.jpg)

![病娇角色超分图 11](../../assets/img/yandere-appearance/10-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 15 张原图与超分图对比"}
![病娇角色原图 15](../../assets/img/yandere-appearance/14-before.jpg)

![病娇角色超分图 15](../../assets/img/yandere-appearance/14-after.jpg)
:::



:::compare{before="原图" after="超分图" label="第 18 张原图与超分图对比"}
![病娇角色原图 18](../../assets/img/yandere-appearance/17-before.jpg)

![病娇角色超分图 18](../../assets/img/yandere-appearance/17-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 19 张原图与超分图对比"}
![病娇角色原图 19](../../assets/img/yandere-appearance/18-before.jpg)

![病娇角色超分图 19](../../assets/img/yandere-appearance/18-after.jpg)
:::

:::compare{before="原图" after="超分图" label="第 14 张原图与超分图对比"}
![病娇角色原图 14](../../assets/img/yandere-appearance/13-before.jpg)

![病娇角色超分图 14](../../assets/img/yandere-appearance/13-after.jpg)
:::

至于什么叫做“从长相就能看出来是病娇”，我其实也说不清。大概就是看到她的第一眼，已经开始替故事里的其他人担心了。