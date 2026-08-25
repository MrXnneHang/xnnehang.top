---
title: "From Single-Frame Vision to Real-Time Video Conversation: The Multimodal Architecture Paths of DeepSeek, MiniCPM, and MiniMax"
published: 2026-08-25
description: "From DeepSeek visual primitives and MiniMax-M3 image TTFT to how MiniCPM-o sustains local video understanding and full-duplex speech interaction."
category: technology
kind: learning-note
tags:
   - VLM
   - 多模态
   - 视觉推理
   - 实时交互
   - MiniCPM
series:
   - LLM
draft: true
featured: true
lang: en
translationKey: from-single-frame-to-real-time-video-conversation
---

![A red-haired girl standing before a graffiti-covered wall](../../assets/img/from-single-frame-to-real-time-video-conversation/cover.jpg)

:::note[About This Article]
This is a somewhat eclectic attempt to build a basic mental model of multimodality, triggered by several practical questions. It includes some genuinely recent progress in visual understanding, a straightforward rant about MiniMax Coding Plan, and the engineering approach taken by MiniCPM-o. I had resisted multimodality for a long time even though I genuinely needed it; this article is me finally taking the first step. Opus assisted with source checking and technical explanations.
:::

On August 21, DeepSeek finally released `v4-flash-vision-exp`. I had been following it since image understanding first entered gray-box testing on the web app. I had not even graduated back then =-=, and now the next class of students is already about to start school.

In practice, the model usually begins responding quickly when an image is attached, and its understanding of intent fits my use case unusually well. The more I used it, however, the more curious I became: why can it seemingly “point exactly where it means”? What does that capability have to do with _Thinking with Visual Primitives_, the paper DeepSeek published in April and withdrew shortly afterward?

That question led to two sharply different experiences. Image requests through the MiniMax Coding Plan once left me waiting nearly ten seconds, while MiniCPM-o can watch video, listen to someone speak, and synthesize a spoken reply locally at the same time. The article therefore stopped being about one vision model and became a broader question:

> **How does a multimodal system move from “understanding one image” to “continuously observing the world and responding in time”?**

This is not an exhaustive survey of every paper and model, nor is it a benchmark under standardized hardware and inputs. It is closer to three architecture investigations prompted by first-hand experience. I will try to keep paper findings, open-source implementation details, product observations, and engineering estimates without same-machine measurements clearly separated.

## Three Paths of Investigation

| Subject    | My original question                                                                     | What the section actually examines                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| DeepSeek   | Why can it “point exactly where it means” in an image?                                   | How points and bounding boxes reduce referential loss during visual reasoning                                                |
| MiniMax-M3 | Why did image requests through Coding Plan sometimes take almost ten seconds to respond? | How a standard VLM concatenates visual tokens, and why model architecture must not be confused with product-pipeline latency |
| MiniCPM-o  | How can a local model watch, listen, and speak at once?                                  | How incremental audiovisual input is compressed and perception, text, and speech are scheduled on one timeline               |

They are not answering the same benchmark question. DeepSeek focuses on “which object am I referring to?” during reasoning. MiniMax exposed **Time to First Token** (TTFT) as a product-experience problem. MiniCPM-o changes the unit of work altogether: rather than waiting for complete input and complete output, it continuously processes whatever arrives in each time slice.

## DeepSeek: Visual Primitives Let the Model Point While It Thinks

I initially understood visual primitives as a more fundamental fusion of vision and language: perhaps the model no longer needed one module to “translate” an image first, which might reduce TTFT and even imply that the language model itself had acquired graphical understanding.

I also vaguely remembered Google proposing something similar much earlier. If coordinate tokens and visual grounding were not new, what exactly had DeepSeek done? Would it also make the model better at understanding frontend screenshots?

Those questions contained several natural but inaccurate assumptions.

### Visual primitives do not remove the vision encoder

:::note[Opus]
**Visual primitives do not eliminate the visual encoding module, nor do they turn raw visual tokens and text tokens into the same low-level primitive.** The paper still uses a LLaVA-like architecture: an image first passes through DeepSeek-ViT, and its visual features are concatenated with the language instruction before entering DeepSeek-V4-Flash.

The real novelty is that the model can insert points and bounding-box coordinates directly into its generated reasoning trace:

```text
...I find this <|ref|>bear<|/ref|><|box|>[[50,447,647,771]]<|/box|>
on the ground, so I include it in the count...
```

Coordinates are normalized to integers from 0 to 999. Bounding boxes are useful for anchoring concrete objects, while points and point sequences are better suited to trajectories, maze exploration, and backtracking.

The paper calls the underlying problem the **Reference Gap**. When a model says “the one on the left” or “the object I counted earlier,” language can lose its precise referent. Coordinates pin that step of reasoning back onto a definite location in the image. A visual primitive is therefore closer to a **spatial notation that the model can generate and continue to reference later in context**.

This also does not mean that a pure LLM suddenly learns to see without a vision module. More precisely, the multimodal large language model (MLLM) trains its language backbone to understand and generate coordinate tokens with spatial meaning. For frontend work, this could theoretically improve component localization, region references, and action planning over screenshots—for example, identifying exactly which button should be changed or clicked. The paper does not evaluate frontend code generation, however, so it cannot support the stronger claim that the model necessarily writes better frontend code.

### Low latency must be considered separately

The paper's efficiency comes primarily from two layers of compression. DeepSeek-ViT first applies 3×3 spatial compression, combining every nine patches into one visual token. After the tokens enter the language model, Compressed Sparse Attention compresses every four visual-token entries in the **key-value cache** (KV cache) into one.

For a 756×756 image, 2,916 patches are ultimately represented by only 81 visual KV entries after both compression stages. This helps reduce prefill and long-context cost, but the paper does not show that generating visual primitives itself lowers TTFT.

There is also not enough public evidence to establish that the web product `v4-flash-vision-exp` is the model described in the paper. My observation that it often starts responding in under one or two seconds is therefore a product observation, not something I can attribute directly to visual primitives.

### Has anyone done this before?

Coordinate tokens, visual grounding, and visual chains of thought all predate this work. DeepSeek's contribution is better understood as bringing several threads together and extending them into a training system built specifically for reasoning.

| Work                                                                                                                                                                                           | What it did                                                                                                                                                         | Difference from _Thinking with Visual Primitives_                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Brain's [Pix2Seq (2021)](https://arxiv.org/abs/2109.10852)                                                                                                                              | Discretized bounding-box coordinates and classes into tokens, framing object detection as language modeling                                                         | Coordinates were primarily the **final detection output**, not part of a reasoning trace; this is probably the Google work I remembered                                           |
| Microsoft's [KOSMOS-2 (2023)](https://arxiv.org/abs/2306.14824)                                                                                                                                | Used location tokens to bind text spans to image regions, accepting regions as input and emitting boxes as output                                                   | Focused on grounded captions and referring rather than using coordinates as intermediate reasoning steps                                                                          |
| [Shikra (2023)](https://arxiv.org/abs/2306.15195)                                                                                                                                              | Used ordinary numeric coordinates for references and experimented with point coordinates inside a Grounding CoT                                                     | Already very close to “pointing while reasoning,” but smaller in scale and task coverage, without DeepSeek's box/point specialist training, RL, and unified distillation pipeline |
| [Visual Sketchpad (2024)](https://arxiv.org/abs/2406.09403)                                                                                                                                    | Had the model call Python, detectors, and segmenters to draw lines, boxes, or sketches, then fed the resulting image into the next reasoning step                   | Also used visual traces as intermediate thought, but relied on tools to create raster images; DeepSeek natively emits lightweight point and box coordinates                       |
| [Thinking with Visual Primitives (2026)](https://huggingface.co/datasets/NodeLinker/deepseek-ai-Thinking-with-Visual-Primitives-deleted-repo/resolve/main/Thinking_with_Visual_Primitives.pdf) | Learned point/box formats in pretraining, trained separate box and point specialists with SFT and RL, then consolidated them through RFT and On-Policy Distillation | The objective was not merely to report coordinates, but to weave them throughout reasoning traces for counting, spatial relations, mazes, and path tracking                       |

A restrained summary would be:

> **It did not give an LLM vision for the first time, nor was it the first to represent coordinates as tokens. It elevated grounding from an output format into a reusable spatial notation within the reasoning process.**

Although the original repository was withdrawn, the surviving [repository mirror](https://huggingface.co/datasets/NodeLinker/deepseek-ai-Thinking-with-Visual-Primitives-deleted-repo) and technical report corroborate one another. The relationship between this research and the current experimental product still needs an official explanation from DeepSeek.
:::

### The simplest version once more

This is complicated =-=.

I can roughly understand work such as Transformer and ResNet that appears to overturn an old paradigm, and I can understand changes that are tiny but immediately useful. Incremental innovation across a complicated architecture is much harder for me to form an intuition for. I have an instinctive resistance to—and fear of—complex architectures.

:::note[Opus]
The simplest explanation is: **DeepSeek taught the model to “talk and point with its finger” while it thinks.**

A conventional vision model can only reason in words after looking at an image: “the bear on the left,” “the thing I counted earlier.” As the number of objects grows, it can lose track of which object it meant. DeepSeek lets the model insert point and box coordinates into its textual reasoning:

```text
This bear [bounding box] is in the tree, so do not count it;
that bear [bounding box] is on the ground, so count one.
```

Each reasoning step can then point back to an unambiguous object in the image, reducing counting errors, wrong turns in a maze, and lost tracks along a line.

It did not reinvent the vision model, and it did not make a pure LLM suddenly learn to see. What it actually did was **turn boxes and coordinates, once used mainly as final outputs, into a “visual scratchpad” that the model can repeatedly use while reasoning**.

This is incremental innovation that combines, extends, and matures existing techniques, not a Transformer-style replacement of the old paradigm. It is entirely reasonable if the core idea does not initially sound earth-shattering.
:::

Perhaps I should have reached that conclusion myself after reading the paper. Now I know it in advance =-=, which takes away a little of the fun of reading it later.

In any case, `v4-flash-vision-exp` is a good model. It is worth trying.

## MiniMax: Is It Really Cascaded “Fake Multimodality”?

I once paid for a month of MiniMax Coding Plan and abandoned it after half an hour. The reason was simple: in my use case, image requests repeatedly had TTFT as high as ten seconds, with almost no visible feedback before output began. DeepSeek on the web, by comparison, began responding to images in under a second. The difference was so severe that I could not tolerate using it.

The model I used was **MiniMax-M3**.

No matter how I asked about an image, M3 often began its reasoning by writing a complete description of the image, then read the question and answered it. I suspected that this long description was the culprit behind the slow first token. That led a classmate and me to a second hypothesis: was a separate vision model translating the image into a long description before passing that description to a text model?

### “Concatenated” can mean two very different things

:::note[Opus]
**M3 is genuinely trained as a native multimodal model, but “native” does not mean it has no separate vision encoder.**

It uses a common VLM composition. A 32-layer, hidden-size-1280 CLIP-style vision encoder splits the image into patches. Neighboring patches are merged, and a projector maps the result into the M3 language model's 6144-dimensional hidden space. The processor places dedicated image-token placeholders in the text context, replaces them with those visual vectors, and lets the same language model continue reasoning and generating the answer.

If “concatenated” means this:

```text
Image → vision encoder → visual tokens ┐
                                       ├→ one shared context → M3 generates an answer
Question → text tokens ────────────────┘
```

then that is correct. It does not make the model “fake multimodal”; many VLMs, including LLaVA, use a similar architecture.

If it means this instead:

```text
Image → another model writes a full description → text-only M3 reads it → answer
```

then the public M3 configuration, processor, and Coding Plan API documentation **do not support that conclusion**. The open processor expands an image into visual tokens; it does not generate an intermediate natural-language description. The official Anthropic-compatible endpoint likewise allows M3 to receive an `image` content block directly.

At least in the public implementation, it is not a serial cascade in which “one vision model writes an essay and hands it to a text model.”
:::

This differs from the per-image pre-summarization pipeline I deliberately designed in [[Single Image Does Not Equal Multiple Images: Why VLMs Hallucinate More with Multiple Images, and a Two-Stage Fix]]. That approach explicitly calls a vision model one extra time and passes a structured summary into a second reasoning round. M3's public path sends visual vectors directly into one language model.

So there is no public evidence for my original judgment that it was “cascaded fake multimodality.” What makes me likely never to use it again is not that architectural guess, but the fact that Coding Plan was genuinely as slow as deliberately running a two-stage summarization pipeline in my use case.

> Claude suggested adding the paragraph above as a shield. My actual feeling is much simpler: I never want to use it again.

## MiniCPM-o: Real-Time Video Is Not a Description for Every Frame

MiniCPM-o's [real-time audiovisual conversation demo](https://www.bilibili.com/video/BV1T3FhzjEAX/) makes me desperately want one.

It appears to let an LLM and TTS operate in full duplex: both text and speech stream out, and TTFT is very low. Yet when I run an independent LLM and TTS locally at the same time, the two often fight over resources until the system stalls or crashes. How does MiniCPM-o balance them?

Then there is video understanding. A conventional VLM may take several seconds end to end to produce a full description of a single frame. How can MiniCPM-o continuously process video? Does it really understand that many frames every second? How does the model process video incrementally?

I have an RTX 4060 Ti 16GB at home, so perhaps that can serve as an example.

:::note[Opus]

### Produce at the rate output can be consumed: it does not redescribe the whole frame every second

Conventional video question answering usually samples frames, sends several of them to a VLM in one batch, and waits for the model to finish looking before it answers. MiniCPM-o's real-time mode instead divides time into chunks of roughly **one second**. The new visual input, audio input, and model output for second $k$ are encoded as:

$$
g_k=[v_k;a_k;o_k]
$$

The system appends $g_1,g_2,\ldots$ to one causal language-model session. The official term is **Time-Division Multiplexing** (TDM): conceptually, video, environmental audio, and the reply are three parallel streams; computationally, they are serialized into groups of tokens with explicit time boundaries.

Each chunk first incorporates the visual and audio tokens that have just arrived, then decides whether to keep listening or produce an answer during that second. The output can therefore attend to the latest frame instead of waiting until the entire video ends.

Real-time mode does not process all 30 FPS from the camera. MiniCPM-o 4.5 trains with sampling rates from **1 to 5 FPS**. The default example uses one group of frames per second, while `stack_frames=5` enables the high-refresh mode. A frame is processed at up to 448×448: SigLIP2 first produces 1024 patch tokens, and a resampler compresses them into **64 visual tokens**.

The language model therefore receives a small, heavily compressed set of visual features each second rather than dozens of complete images. Multi-frame temporal understanding primarily comes from placing those frames into one context and KV cache in chronological order, not from running an additional 3D video model.

This is also the largest difference from the latency profile of a conventional VLM. A conventional model may perform a large visual prefill for one high-resolution image and then autoregressively generate tens or hundreds of description tokens. MiniCPM-o spreads input cost across time slices and does not require an essay-length description of every frame.

### Full duplex does not mean two large models fighting for one GPU

MiniCPM-o 4.5 is still modular:

```text
Video → SigLIP2 vision encoder ─┐
Audio → Whisper-medium ─────────┼→ Qwen3-8B → text
                                │       └→ 0.3B speech-token decoder
Reference voice ────────────────┘                 └→ streaming flow-matching vocoder → waveform
```

But this is different from starting one LLM service and a separate full TTS service. All trainable modules form one roughly 9B model, sharing a session and a timeline.

Whisper initially produces 50 audio-feature tokens per second, and the projector compresses them to **10 per second**. Qwen3-8B only needs to generate about **3–4 text tokens per second**, close to human speaking speed. The higher-frequency speech modeling—around **25 speech tokens per second**—is delegated to a roughly 0.3B speech-token decoder, after which a streaming vocoder synthesizes waveform chunks.

Full duplex here is therefore mainly **fine-grained interleaved scheduling**, not proof that CUDA runs three independent sets of vision-encoder, 8B-LLM, and TTS kernels simultaneously. Within each one-second window, the system incorporates new video and audio, predicts `[listen]` or `[speak]`, generates a small amount of text, and lets the lightweight speech decoder catch up with playback.

**Time-Aligned Interleaving** (TAIL) also adjusts the amount of text generated in the current chunk according to accumulated speech latency. It prevents the text stream from running too far ahead while the model is still speaking about something it saw several seconds ago.

This explains why combining an independent LLM and TTS can easily stall. Two full services each keep their own weights, KV cache, CUDA allocator, and temporary workspace resident, and threads may submit large kernels at the same time. Near the memory limit, fragmentation or one peak allocation can be enough to trigger an out-of-memory failure.

MiniCPM-o instead reserves most memory for a single 8B backbone, attaches smaller encoders and a speech decoder, and lets one inference framework schedule them across time slices. It avoids two heavyweight generation loops competing without coordination.

That does not make memory disappear. The official MiniCPM-o 4.5 report lists roughly **19GB for bf16 and 11GB for int4**. The native PyTorch full-duplex demo recommends at least 28GB of NVIDIA VRAM to leave room for activations and runtime overhead. The edge-oriented path is the specially optimized `llama.cpp-omni`: its official minimum is 12GB of NVIDIA VRAM, and it reports full-duplex real-time factors of 0.21, 0.32, and 0.40 on the RTX 4090, 5080, and 5070 respectively. All are below 1, meaning generation stays ahead of playback.

A 16GB RTX 4060 Ti has more capacity than the reported 11GB int4 footprint, but whether it can sustain full duplex still depends on the inference backend, runtime headroom, and actual throughput. The **8GB version cannot hold an approximately 11GB model entirely in VRAM**; it would require additional offloading or an older, smaller model such as MiniCPM-o 2.6 int4, with a corresponding performance cost.

### What MiniCPM-o actually changes

Its advantage is not that one module suddenly runs dozens of times faster than an ordinary VLM. It redesigns the **unit of work and the scheduling model**:

- Video becomes a low-frame-rate stream of heavily compressed incremental visual tokens.
- Audio is compressed to ten tokens per second.
- The 8B backbone generates text only at low frequency.
- High-frequency speech generation is delegated to a lightweight decoder.
- One-second time slices and a shared KV cache organize all the streams.

It replaces “understand the entire image again and generate a complete description” with “continuously append a small amount of new state.” That is how it can appear to watch and speak at once on local hardware.

The technical report does not disclose an explicit sliding-window or KV-eviction policy for long-term memory, however, and the context limit still exists. It also acknowledges that robustness in long, continuously changing real-world streams needs further work. This is a real-time system co-designed across training and inference, not a general solution to infinite video memory.

References: [MiniCPM-o 4.5 Technical Report](https://github.com/OpenBMB/MiniCPM-o/blob/main/docs/MiniCPM_o_45_technical_report.pdf), [MiniCPM-o official repository](https://github.com/OpenBMB/MiniCPM-o), and the [MiniCPM-o 2.6 model card](https://huggingface.co/openbmb/MiniCPM-o-2_6).
:::

## The Magic Has Not Disappeared; It Has Been Decomposed into Engineering Constraints

MiniCPM-o is essentially an advanced streaming system that allocates resources by module and time slice. It remains subject to the same basic constraint as systems such as RVC and streaming TTS: if generating a segment of audio and video takes longer than playing that segment, giving a real-time factor above 1, the system falls progressively behind until real-time interaction can no longer be sustained.

So there is not quite as much magic as it first appears.

Still, connecting what the model observes in each second with what it should say during that second is fascinating. The model must do more than answer questions. It must know when to keep listening, when to speak, and whether the words currently leaving its mouth have already fallen behind the world around it.

A conventional stateless image-question-answering API is poorly suited to uploading four or five complete images every second. Repeated uploads, visual encoding, and prefill rapidly accumulate latency. That does not mean real-time vision is impossible through an API. With a persistent session, incremental KV cache, and a long-lived WebSocket or WebRTC connection, MiniCPM-o could also run remotely and expose real-time interaction through a streaming API.

Local deployment does not inherently imply weak context or tool calling either. More precisely, today's small omni models that can run in real time on consumer devices often trade off model scale, context, tool use, visual fidelity, and speech latency. Cloud-scale models and local real-time systems optimize for different objectives.

Compute and money can certainly buy stronger models and APIs, solving some context, tool-use, and latency limitations. But if a model is merely an API that passively replies, then even the ability to understand video remains uninteresting to me. What I actually care about is how to let it perceive continuously, act on its own initiative, and finally possess something a little like a soul.
