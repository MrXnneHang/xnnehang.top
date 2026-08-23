---
title: 'When My Cloud Provider Disappeared: Rethinking the Shape of a Personal Blog and What Is Worth Recording'
published: 2026-06-01
category: thought
kind: reflection
tags:
  - 存档
description: Rethinking the shape of a blog and what it should record after a cloud provider's disappearance caused data loss.
series:
  - Blogging
lang: en
translationKey: cloud-service-provider
---

As the title says: at the end of May, the cloud provider hosting my blog system, Fox Cloud, disappeared. Without warning, it shut down and destroyed a batch of cloud-server instances, and mine happened to be among them.

I had not been paying much attention to my blog lately, so I had not backed it up in advance. Then, at the end of March, water got into my laptop and burned out its drive. Between the two, I lost quite a lot of blog archives. Those posts had never been pushed to GitHub; I wrote them locally and uploaded them directly to the blog system. So I lost both the goodnight and her.

The only material I have recovered from backups reaches March 2025, and the newest post is [[On Mortal Lives in Renegade Immortal and A Record of a Mortal's Journey to Immortality]]. But now that I think about it, I actually felt relieved, because that was the last review-like thing I wrote in a calm state of mind.

I once wrote that days spent without recording what I had watched or read seem, once they pass, to have disappeared completely without a trace.

This past year felt like that. What did I write afterward? [[Attention Is Limited — Lost in the Middle]], [[Single Image Does Not Equal Multiple Images: Why VLMs Hallucinate More with Multiple Images, and a Two-Stage Fix|Single image ≠ multiple images]]. But before discussing what deserves to be recorded, let us first look back at the shapes a personal blog can take.

# Forms of a Blog

## Depending on a Cloud Platform

[Cnblogs — Moon Rabbit](https://www.cnblogs.com/Reisentyan)

![Cnblogs interface](../../assets/img/covers/blog-platform-cnblogs.png)

Cnblogs is excellent in both appearance and freedom; it is far, far better than a certain CS platform.

But in terms of its form, the articles it presents live on the platform, while archives usually depend on users' own backups. Local data and platform data do not synchronize automatically. Synchronizing across devices is troublesome and requires some intermediary device or cloud platform. And if the device holding the archive suddenly fails, the backup cannot quickly be restored and synchronized from the cloud to local storage.

There is also the question of whether the platform itself will survive. There were earlier moments when Cnblogs seemed close to shutting down.

And with better-run CSDN, I do not think you want people to see jumping advertisements beside what you wrote, paid-unlock prompts suddenly appearing below it, or a requirement to log in before reading the full text.

---

I have posted only a single `.condarc` on CSDN. Yet its reading experience—finding an article with something useful in it, only to discover that it was copied from Cnblogs or another platform—and its habit of appearing near the top of search results have made me feel much worse about cloud platforms.

## Depending on a Personal Cloud Server

I used this approach for more than two years.

The first system I deployed was NBlog: https://naccl.top/

![NBlog interface](../../assets/img/covers/blog-platform-nblog.png)

Later I deployed Shiroi: https://innei.in/

![Shiroi interface](../../assets/img/covers/blog-platform-shiroi.png)

Both separate their frontend from their backend. That introduces a modest barrier: CORS, running frontend and backend separately, and potentially difficult setup when no suitable Docker image exists—especially for frameworks one does not already know.

They share the same problem as Cnblogs:

The source data kept in an archive and the data uploaded into the blog system are not fully the same, and converting between them is difficult. It is hard to restore local data into blog form by re-uploading posts one by one, and it is hard to restore blog-form data back into a local backup.

The latter, Shiroi, supports importing and exporting all posts. It can export existing blog data from the same blogging system and import it again, which is somewhat useful when migrating servers. But it is inherently incompatible with other blogging systems, and its archive files are not human-readable, so they cannot serve as local archives. That makes the feature rather awkward. Perhaps because of that awkwardness, its import system also had a few bugs and was not backward-compatible with old versions; I was forced to restore every post by hand. During the major React security incident in 2025, my blog was affected and I had to reinstall the system, but a backup exported from the old version could not be parsed or imported by the new one =-=. The two versions were only about half a year apart.

:::warning
Besides server costs, the most frightening part of maintaining a personal blog is being betrayed by a provider that disappears. Lost data is simply lost; there may be no way to retrieve it. Because of the React incident, I temporarily moved from Tencent Cloud to Fox Cloud, but afterward the difficulty of migrating kept me from moving back. Building Shiroi was genuinely not easy, and after restoring the data I had no energy left for an additional backup. Each problem fed into the next.
:::

---

While using these kinds of blogs, I would usually also push the blog to some GitHub repository as an archive. But my habit of pushing was terrible: sometimes I had not finished writing and had to wait; sometimes I felt it was not worth pushing; sometimes a GitHub token expired and, after putting it off, I forgot. Sometimes I organized files into folders by year and month; other times I forgot to create a month folder, so several months of files were squeezed into one.

The management was exhausting even for me to look at. But I could not simply delete the repository. Even after repeated reorganizations, entropy increased with continued use. And the largest problem was that, to make cloning faster, posts and images lived in separate repositories, with images referenced through jsDelivr URLs uploaded by PicGo. That made the image repository even more frightening.

## Depending on GitHub Pages and Workflow Deployment

https://xnnehang.top/

![Current blog interface](../../assets/img/covers/blog-platform-current.png)

This blog is built directly by a workflow from a GitHub project and pushed to GitHub Pages.

::github{repo="MrXnneHang/xnnehang.top"}

It has several advantages:

:::tip

- You can pull the whole project at any time. It contains all blog source data, planned clearly and named sensibly, in Markdown—the same format in which a user originally wrote it. It remains usable whether for migration or reading.
- It does not require complicated frontend or backend deployment. Only a domain and DNS are needed; once configured, all building and updating are handled automatically by the workflow.
- The project is the blog. Every update is archived immediately; synchronization is a backup, unless GitHub disappears or the policies for Pages or workflows change.
  :::

---

For me, its most important benefit is that it eliminates the Blog and Blog_Image repositories where I had always maintained bad update habits.

[SigureMo](https://github.com/SigureMo) used this approach from the start. I remember adding their friendship link during my NBlog era; if I had discovered it earlier, I would have taken many fewer detours.

This blog is simple enough that I can focus more on writing it without worrying about when to commit and push.

I remember that after moving to Shiroi, although the blog system became much prettier and more complex, I actually wrote less often. That was a pity.

# What Is Worth Recording

This is different from the expression of feelings and emotions in reviews.

When it comes to technical or tutorial-like blog posts produced while learning—and I say “while” because I have a habit of learning as I write, which is exciting, whereas summaries after I have learned everything are instead dull—much of the material is basic and even contains many mistakes. I tend to make a hypothesis, test it, and revise it as I go. By the time I correct my thinking, I may have missed correcting the material already written.

I once asked my natural-language-processing teacher whether he wrote blog posts, because the way he taught often felt like the thought process of writing a blog post—and like me, he could very easily wander off-topic. He said that he had written for several years but later stopped.

When I asked why, he said that looking back, many of his early articles were wrong, naïve, and insufficiently deep. Following the principle of not spreading errors, he stopped writing.

That is true. Looking at my earlier guides to using uv or my PyQt study diary from where I am now, these posts that especially emphasize starting from zero are really far too basic for me. They offer no benefit and even contain many awkward expressions.

Just imagining a beginner happening upon them and being misled by my distorted reading of the official documentation, or someone skilled in the subject reading my beginner's diary, makes me so embarrassed that I want to disappear into the ground.

I used to avoid reading such posts. This time, losing the archive let me escape from them, and I felt relieved instead.

I have to reflect: should posts like those still be written? Should they be published to public spaces without review?

Learning as I write leaves a deeper impression on me, whether what I learn is right or wrong, and the process of correction makes my understanding deeper still. But before claiming I have truly understood something correctly, I should let a language model review it.

Here I will also divide the things worth recording into a few broad categories.

:::note

- **Resources** usually do not involve transmitting specific knowledge or reflections. They simply recommend channels, applications, or information to other people—for example, sites for finding books or manga.
- **Reviews** are still worth building as both display cases for memories and traps for like-minded people.
- **Tutorials** are process-oriented records, such as a guide to using an application or a piece of software: launching SKSE for _The Elder Scrolls V: Skyrim_, refreshing animation data, adjusting body shapes, sorting mods, and so on.
- **Reflections** are deeper thoughts produced by an event or an object. They may address an object's essence directly, or connect it with other things and then reveal a general pattern or arrive at a personal conclusion. They do not have to be clearly right or wrong, but they must make sense to me.
- **Learning as I Build** should carry a `useless` tag: an exploratory process with little nutritional value. If readers truly cannot find a suitable tutorial or example, perhaps they can find what they need in my exploration, or arrive at a conclusion that makes sense to me. Of course, that conclusion need not be right; it only needs to be coherent. I will let an LLM review whether it is right or wrong.
  :::
