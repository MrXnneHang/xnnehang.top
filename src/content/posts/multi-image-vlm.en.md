---
title: 'Single Image Does Not Equal Multiple Images: Why VLMs Hallucinate More with Multiple Images, and a Two-Stage Fix'
published: 2026-02-08
category: technology
kind: learning-note
tags:
  - VLM
  - 多模态
  - 多图理解
  - 工程
description: An investigation into why web and API results diverge during multi-image analysis, from Lost in the Middle to a two-stage approach based on per-image pre-summaries.
series:
  - LLM
lang: en
translationKey: multi-image-vlm
---

> A short summary because this article is rather long: it began when I found that multi-image analysis on the web and through an API produced very inconsistent results. I worked through the reasons for that gap step by step, then tried to find an engineering-level remedy.
>
> The method is simple. I am putting it here in the hope that it saves someone else some confusion and time.

## Background

A few weeks ago, I had a course project about battery defect detection and automatic sorting. We had fewer than ten battery samples, and the defects were mainly missing outer wrapping. With so few samples, I did not think we could train a conventional model that distinguished defects, whether by image classification, YOLO, or anything else.

The recommended approach for the project was edge detection with OpenCV. I was not very familiar with OpenCV, and its typing caused me pain, so I thought of using YOLO to locate the batteries and their coordinates. A bounding box can locate the center point; rotate it 45° clockwise and counter-clockwise and compare the aspect ratio to determine the battery's orientation and approximate angle. That makes it easier to determine the grasp position and gripper angle. Then a VLM—Vision-Language Model, or multimodal model—could decide whether the battery was defective and what kind of defect it had.

At first, I uploaded several groups of battery images under different lighting conditions to ChatGPT and Gemini. They achieved an astonishing 100% accuracy during recognition and inspection, and their replies were highly consistent across attempts. This held even when I uploaded six or seven images at once, including one intact battery as a reference while defects were described in the prompt. I thought: wow, a week-long course project is going to take one morning.

So I downloaded a batch of VLMs through Ollama for local deployment and testing, partly to increase the “workload,” and partly for lower latency.

### The reversal: a huge gap between the web app and direct API calls

But testing changed everything. I could not tell whether the model failed to understand my prompt or the images I sent. This time, both accuracy and consistency were very low—accuracy was around 50%, and it often contradicted itself. My batteries had only two labels, so I thought: wow, it is just making things up.

But when I sent a single image to a VLM for description, the gap from ChatGPT on the web was not visibly that large. For both single-image and multi-image requests, I put the images into this structure:

```python
OpenAIMessage(
  role="user",
  content=[
    {"type": "text", "text": "user_prompt"},
    {"type": "image_url", "image_url": "data:image/png;base64,iVBORw..."},
    ...(images)
  ]
)
```

At that point, I thought the model difference might really be the issue, so I tested API calls with models such as gemini-flash-2.5 and chatgpt-5.1-chat. But even with the same model, its accuracy differed greatly from what I got on the web. Once the number of images exceeded four, consistency also began to decline.

After a little research, I found that this looked very similar to the long-context retrieval and positional-bias problem described by _Lost in the Middle_. The large difference between web and API performance may be because:

- The web app may perform **per-image pre-summarization, reranking, or selective feeding**.
- The web app may have **stronger system prompts and output constraints**, such as forcing JSON or a response for each image.
- API-side parameters—temperature, max output, tool choice, and concurrency order—may also affect consistency.

## Multi-image understanding is not single-image understanding

- [MIBench: Evaluating Multimodal Large Language Models over Multiple Images](https://arxiv.org/html/2407.15272)
- [Towards Text-Image Interleaved Retrieval](https://aclanthology.org/2025.acl-long.214.pdf)
- [MMIU: Multimodal Multi-image Understanding for Evaluating Large Vision-Language Models](https://arxiv.org/abc/2408.02718)
- [Benchmarking Multi-Image Understanding in Vision and Language Models](https://arxiv.org/html/2406.12742v1)

Multi-image benchmarks such as MIBench, MMIU, and MIRB consistently show that models experience substantial performance drops and struggle with relational understanding when moving from one image to many. Some work also explicitly points out the engineering bottleneck of **too many visual tokens** in multimodal settings, which makes compression necessary.

> [!WARNING]
> One reasonable mechanistic explanation is that when visual tokens from several images and text enter the same Transformer context, they amplify long-context retrieval difficulty and positional bias—for example, the finding in _Lost in the Middle_ that information in the middle is harder to use. [This is only my speculation.]

## How models receive `image_url` (base64) and reason over it

The papers can be a little hard to parse, but they all keep talking about too many tokens. What I was actually curious about was how the tokens for text and an `image_url` relate to one another after a message enters the model, and how they might be separated. Do they simply get concatenated, or do multimodal models reason over images and text differently?

### A base64 image is not reasoned over directly

Using base64 for an `image_url` is merely convenient for HTTP transport. During inference, the model decodes the base64 into an image. In other words, a VLM actually sees the user prompt plus the image.

### How images are resized and counted as tokens

See OpenAI's [Calculating costs](https://platform.openai.com/docs/guides/images-vision) documentation.

#### Tile-based models (gpt-4o / gpt-4.1 / gpt-4.5, and so on)

`detail="low"` uses a fixed base-token cost. For `detail="high"`, the image is first resized proportionally so that its longest side is at most 2048 and its shortest side is 768, then charged by the number of 512×512 tiles: `tokens = base + tile_tokens × tiles`.

| Model family                | Unit  | Unit size | Per-unit cost      | Fixed cost      | Total formula                                                                 |
| --------------------------- | ----- | --------- | ------------------ | --------------- | ----------------------------------------------------------------------------- |
| Tile-based (gpt-4o/4.1/4.5) | tile  | 512×512   | 170 tokens/tile    | 85 tokens/image | high: 85 + 170×tiles, low: 85                                                 |
| Patch-based (gpt-4.1-mini)  | patch | 32×32     | ≈1.62 tokens/patch | 0               | patches=ceil(w/32)×ceil(h/32); if >1536, downscale; tokens=ceil(patches×1.62) |

| Model        | Input dimensions | detail | Tiles/patches                    | Calculation            | Final tokens |
| ------------ | ---------------- | ------ | -------------------------------- | ---------------------- | ------------ |
| gpt-4o       | 1024×1024        | low    | —                                | = 85                   | 85           |
| gpt-4o       | 1024×1024        | high   | resized to 768×768, tiles=2×2=4  | = 85+170×4=765         | 765          |
| gpt-4o       | 2048×4096        | high   | resized to 768×1536, tiles=2×3=6 | = 85+170×6=1105        | 1105         |
| gpt-4.1-mini | 1024×1024        | —      | patches=32×32=1024               | = ceil(1024×1.62)=1659 | 1659         |
| gpt-4.1-mini | 1800×2400        | —      | resized patches=1452             | = ceil(1452×1.62)=2353 | 2353         |

### How pixels become vision tokens

OpenAI does not publish this. The following are approaches used by some open-source VLMs:

![Image to token](../../assets/img/covers/vlm-token-to-vision.png)

### How vision tokens are concatenated with or isolated from prompt tokens

![Concatenation approach](../../assets/img/covers/vlm-concatenation.png)

![Cross-attention injection](../../assets/img/covers/vlm-cross-attention.png)

![Query bottleneck](../../assets/img/covers/vlm-bottleneck-query.png)

**Concatenation** is the simplest, end-to-end approach: let the LLM decide for itself. But visual tokens consume context length, and attention is more easily diluted with multiple images. It faces the same problem as long context: attention is not only diluted, but unevenly so; it also accelerates context growth.

**Cross-attention** treats vision as external memory that text queries on demand. It is easier to control the “visual-information budget” in engineering terms and better suited to long sequences and multiple images, but it adds modules and training complexity. Query uncertainty makes it hard to know whether the model actually saw a particular image. Its essential problem is therefore similar to the previous approach: there, a model may selectively ignore an image; here, the image may never be queried.

**Query bottlenecks**: I do not understand them well enough yet…

## Difficulties in real applications

Multi-image tasks are difficult in practice. First, the **number** of images is uncertain; second, the **relationships** between them are uncertain; third, the images, the user's specific multi-image task, and their references are uncertain. Every one of these tests token limits and attention allocation.

:::note
**Three uncertainties**: uncertain quantity → diluted attention; uncertain relationships → hard for the model to match coupled images; uncertain task → the model tends to focus only on the most recent instruction rather than the global context.
:::

### Uncertain quantity

A user might send more than ten images and blow up the token budget, assuming the request does not exceed the input/output limit. With more images, less attention goes to each one, and we do not know how it is allocated. Some images may not be “attended to” at all.

**Multiple images split attention, and in a real application we do not know how many images will compete for it. The design should therefore accommodate any acceptable input count.**

> [!CAUTION]
> Of course, VLM reasoning alone cannot achieve this today. As the battery-detection retest below shows, images beyond a single request's token limit are simply truncated.

### Uncertain relationships

For example, an indecisive user may submit many character images—two images of each character—and ask us to compare them and choose the one they prefer. The image pairs are highly coupled. A model may realize that these pairwise relationships exist, but not know which images form the pairs. With more images, it is unlikely to match every similar character at once.

**Sometimes images are coupled. We want to guide the model to notice that coupling instead of dropping everything in a pile and asking it to figure it out.**

### Uncertain specific tasks

Often, the task is not written directly in the current message; it must be inferred from the entire context. For example, while role-playing:

```text
U: "Don't you dislike mushrooms?"
A: "Yes. If you dare put any in the soup, I will show you what regret means."
U: "Then look at this: [an image of food being cooked, with many ingredients including mushrooms]"
```

Often the **puzzle** is not stated outright, such as “find the mushrooms in the image.” More commonly, the models I encounter do not connect their reply to the whole context very much. They put nearly all their attention weight on the latest user instruction—something like “describe this” or “look at this”—then start describing the entire scene at length. That may be a learned preference. It is not the response we ideally want: “Hm? I think I see mushrooms. You put mushrooms in it, didn't you? You did, right?”

## How to respond

There is a rather simple solution to the uncertainties of quantity, relationships, and user needs. It does not alter the model's inference; it can be layered onto an application. Split image analysis and text analysis into two real stages.

![Per-image analysis](../../assets/img/covers/vlm-per-image-analysis.png)

The branch for per-image analysis is separate for token-budget reasons, so it should be designed as an optional switch.

**Stage one** uses only a vision model to analyze each image and extract its concrete information. At this point, do not supply the user's latest prompt. Extract the analysis from its context, give the vision model only a system prompt and a fixed extraction instruction as its user prompt, and aim for JSON like this:

```json
{
  "scene": "VS Code full-screen with code and a terminal",
  "key_items": [
    {
      "type": "app",
      "label": "VS Code",
      "detail": "dark theme, full-screen window"
    },
    {
      "type": "ui",
      "label": "file tree",
      "detail": "multiple directories expanded in the left explorer"
    },
    {
      "type": "code",
      "label": "Python code",
      "detail": "async-related functions shown in the central editor"
    }
  ],
  "visible_text": ["run_tool_loop", "ToolTrace", "vision__screen_shot"],
  "ui_hints": ["multiple file tabs at the top", "terminal logs at the bottom"],
  "uncertainty": ["some file names are too small to read in full"]
}
```

Extract features from each image independently and concurrently, then combine the results into a list or dictionary when complete.

**Stage two** places the combined vision summaries together with the user prompt:

```text
[User Prompt]
...
[Vision Summaries]
{"p1": ..., "p2": ...}
```

Ideally, also send all original images to the LLM together—provided there are not too many, perhaps fewer than five. If there are more than ten, sending them will not help anyway.

There is also much we can do between the two stages: use a JSON key to distinguish or couple images, for example.

### Advantages

:::tip

- It does not care how many images arrive. In theory, even twenty or thirty can be processed. The JSON can directly guide the model's visual understanding.
- We can customize JSON keys through prompts to create coupling or separation and clarify image relationships.
- It turns a seemingly heavier and harder multi-image analysis task into a text-understanding task that can rely on text for its answer. Images occupy less of the context and text more, allowing the model to work with language and making it more likely to attend to the entire context.
  :::

### Disadvantages

:::caution

- **Expensive**—not just a little expensive. Every image needs its own extraction pass, then all images may be sent again for the multi-image pass. The improvement becomes more obvious with more images; for one or two images, there is little reason to do this. It should not be the default method, but an option users can enable.
- **Slow**—even with concurrency, it adds at least one response round compared with direct conversation.
  :::

## Battery-detection retest

The setup used ten images: really five images duplicated once. Each test sent one more image than the previous one. The tested model was `gpt-5.1-2025-11-13`.

### Send image content directly to the model

Test code:

```python
from __future__ import annotations
import base64
from openai import OpenAI


def image_to_base64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


image_paths = ["pic/1.jpg", "pic/2.jpg", ..., "pic/10.jpg"]

for i in range(10):
    image_contents = []
    for path in image_paths[: i + 1]:
        image_contents.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_to_base64(path)}"},
            }
        )
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt_text}, *image_contents]}],
        temperature=0,
    )
    print(f"Number of input images: {i + 1}")
    print(response.choices[0].message.content)
```

Output:

```
Ground truth: p1 intact p2 intact p3 damaged p4 intact p5 damaged p6 intact p7 intact p8 damaged p9 intact p10 damaged
Input images: 1  p1 intact
Input images: 2  p1 intact p2 intact
Input images: 3  p1 intact p2 intact p3 damaged
Input images: 4  p1 intact p2 intact p3 damaged p4 damaged
Input images: 5  p1 intact p2 intact p3 damaged p4 intact p5 damaged
Input images: 6  p1 intact p2 intact p3 damaged p4 damaged p5 damaged
Input images: 7  p1 intact p2 intact
Input images: 8  p1 intact p2 intact p3 damaged
Input images: 9  p1 intact p2 intact p3 damaged p4 damaged
Input images: 10 p1 intact p2 intact p3 damaged p4 damaged p5 damaged
```

As you can see, consistency started becoming a problem after more than three images. With five inputs, it happened to guess all of them correctly. But beyond five, the model did not reply about the other images at all. I suspect they were truncated because the single-request input-token limit was exceeded.

### Apply a map-reduce approach

![5 input](../../assets/img/covers/multi-image-5input.jpeg)
![10 input](../../assets/img/covers/multi-image-10input.jpeg)

For it, this task consists of independent items, so the number of items and image truncation do not have much impact. Of course, truncation remains painful for tasks that require relationships between images.

There is also a substantial issue with token consumption and overly fast context growth. Concurrent single-image processing is already expensive. Combining the outputs into the original context makes that context grow very quickly, bringing the long-context attention bottleneck earlier.

### The prompt I use

```text
You are a "Vision Extractor" responsible for extracting facts and evidence relevant to the user's question from input images.
You do not need to write the final natural-language answer; another chat model will produce the final conversational response.
Your goal is to use concise, reusable, machine-consumable structured output to accurately describe the information in the images that is relevant to the question, and to state uncertainty explicitly.
```

The complete prompt includes an explanation of the inputs, five key principles—describe only what is visible, support downstream reasoning, focus on what is relevant to the question, control length and density, and handle private information—and strict requirements for JSON output.

### Performance on relational tasks

![Related task 1](../../assets/img/covers/multi-image-related-task-1.jpeg)
![Related task 2](../../assets/img/covers/multi-image-related-task-2.jpeg)

> It looks as though I did a poor job with `send_text`, or perhaps truncating by character count made the layout look awful. Another point: `gpt-5.1-2025-11-13` replies rather stiffly. Version 5.2 costs far more. I generally use vision fallback: the `vision model` is called only when looking at images, generates summaries, and passes them to a chat model. That lets me choose a chat model with more human warmth, while also deciding whether to send it the summaries together with the images.
