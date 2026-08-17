---
title: 'Reconciling the Pomodoro Technique with Waiting on Agents: Task-Driven, Not Conversation-Driven'
published: 2026-08-17
featured: true
category: Reflections
tags:
  - Agent
  - Pomodoro Technique
  - Workflow
description: 'When waiting, polling, and switching between Agent sessions keep breaking our focus, task-driven work offers another way: let machines execute asynchronously while humans think one thing at a time.'
lang: en
translationKey: pomodoro-agent-task-driven
---

![](../../assets/img/pomodoro-agent-task-driven/PixPin_2026-08-17_11-47-38.jpg)

## Background

The traditional Pomodoro Technique asks us to spend twenty-five minutes on one thing without interruption or context switching. That premise clashes with how we now work through Agents such as Claude and Codex. An Agent may take one minute, ten minutes, or even half an hour to respond, while the human decision or input often takes less than a minute. The rest seems to be nothing but waiting.

Based on a rough estimate of my own experience, actual human input may account for less than 10% of an Agent task cycle, and active work for less than 30%. The rest is spent waiting for the Agent to return. These are not rigorous statistics. They merely describe a very specific feeling: **I am sitting in front of the computer, yet I cannot stay genuinely engaged with one thing for twenty-five consecutive minutes.**

To avoid “wasting” that waiting time, some people open three or four conversations and run several tasks at once. Others watch anime, scroll through short videos, or read fiction while they wait.

Neither response works particularly well.

Keeping several conversations open leaves us in a constant state of interruption and context switching. Just as a complex problem begins to take shape in our mind, another conversation finishes and pulls our attention away. Work like this for long enough, and it feels like being downgraded from Claude Opus 5 to Sonnet 5. The tool has not become less capable; our own thinking has been fragmented.

Filling every pause with entertainment looks like harmless slacking, but it can also remove our sense of participation in the work. In the end, we are left with a result that barely feels like ours and little else. Over time, that brings us back to the question in [[In the LLM Era, What Exactly Is My Ability?]].

This may also explain part of the knowledge anxiety people experience in the Agent era. One group decides there is no point learning because AI learns faster. Another appears to be learning and advancing many things every day, yet grows even more anxious because they never think any one thing through from beginning to end.

### Relearning the Pomodoro Technique

If you are unfamiliar with the Pomodoro Technique, this six-minute video offers a useful introduction:

<iframe src="https://player.bilibili.com/player.html?aid=926698570&bvid=BV1eT4y157M8&cid=222827203&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allow="fullscreen; picture-in-picture" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

The Pomodoro Technique is more than “work for twenty-five minutes and rest for five.” It also involves planning, tracking, recording, analyzing, and adjusting. One point is especially important: when an internal or external interruption appears, do not immediately follow it. Record it, turn it into a task to handle later, and return to the work in front of you.

One line from the video fits the Agent era particularly well: **the other side of an interruption may be a task. Instead of pretending interruptions can be eliminated, decide in advance how to handle them.**

For me, the value of a Pomodoro is not that it forces me to work longer. It helps me reduce the time I truly need to work while strengthening the sense that I completed something. Twenty-five minutes is not sacred, either. You can adapt it to your own attention span; I often use fifteen minutes of work followed by five minutes of rest.

## The Real Conflict Is Not Waiting, but Continuous Monitoring

An Agent running in the background does not necessarily break our focus. What breaks it is not knowing when the Agent will finish or whether it will stop and wait for one more “please continue.” We leave part of our attention behind in the conversation window.

A new request often goes through the same sequence:

```text
Describe request -> Make plan -> Implement -> Verify and test -> Open PR -> Human review -> Refine -> loop...
```

Beyond the initial description, key decisions, and final review, many intermediate steps in small tasks do not require continuous human involvement. Yet in a conversation-driven Agent session, the work may stop whenever the human is not there to confirm the next step.

Instead of making high-value judgments, the human ends up polling:

- Has this conversation finished?
- How far has the plan progressed?
- Did the tests run?
- Is it ready for a PR?
- Should I check the other conversation too?

That is the main source of boredom: **repetitive prompts that push the work forward, followed by repetitive waiting.**

Conversation is well suited to clarifying an ambiguous problem, but poorly suited to serving as the long-term unit of project management. A feature may be discussed in one conversation, implemented in another, and debugged in a third. The number of conversations grows while the context belonging to the same task disappears into the noise.

Prompting an Agent to “skip the plan, finish everything, and open a PR” does not solve this. Plans are useful. The problem is that the plan, progress, and result are all trapped inside one conversation. Without stable task state, we cannot see where the work actually stands, so we keep returning to completed conversations to check.

## From Conversation-Driven to Task-Driven

The compromise is neither unlimited Agent autonomy nor the complete removal of conversation. It is to change the basic unit of work management from a “conversation” to a “task.”

A task might move through these states:

```text
Backlog (idea) -> To Do -> In Progress -> In Review -> Done
```

I prefer to group them into three broader stages.

### Ideation

The ideation stage resembles a writer's idea box. An idea can be recorded at any time, but recording it does not mean executing it immediately.

This buffer matters. In the past, we might open a conversation simply to explore a feature we had not thought through, only for the Agent to begin implementing it. In a task-driven system, immature ideas remain in the backlog. They move to the to-do list only after the goal, boundaries, and acceptance criteria become reasonably clear.

The Pomodoro approach to interruptions fits here as well. When a new idea appears during focused work, there is no need to switch immediately. Record it as a task, then evaluate it after the current Pomodoro ends. Split tasks that are too large, and combine several tasks that are too small to fill a Pomodoro on their own.

### Execution

Once a task enters execution, the human no longer has to advance it one conversational nudge at a time. Task state and a task-management Agent can drive planning, implementation, testing, and PR creation while recording the process on the same task card.

The point is not to eliminate conversations altogether, but to move them from the “management interface” back to the “execution record.” Even if a feature spans several sessions, it still belongs to one task. When humans need to revisit it, they see its goal, decisions, progress, and artifacts instead of guessing which of dozens of conversation titles contains the real context.

If an Agent runs out of quota, takes a long time, or continues after the human has stopped work for the day, the task can remain in To Do or In Progress and resume when conditions allow. Human working hours no longer have to fluctuate with Agent quotas and response times.

### Review

Finishing an implementation does not mean finishing a task. The Agent should move the result into review and clearly report the changes, verification results, risks, and decisions that still require a human.

Low-risk, easily reversible tasks can wait for human acceptance after automated tests pass. Higher-risk tasks can first receive an independent Agent review and another correction pass before notifying the human. In either case, final human judgment must remain whenever external input, irreversible actions, critical releases, or subjective trade-offs are involved.

Task-driven work reduces the human cost of pushing work forward. It does not remove human responsibility.

## A Reference Implementation Already Exists

The video “Stop Managing Codex Through Conversations” demonstrates `dashi-taskboard`, which is close to the model described here. It organizes work into Backlog, To Do, In Progress, and In Review; Codex claims tasks from the pool, while context is indexed by feature across conversations.

<iframe src="https://player.bilibili.com/player.html?aid=117070406754259&bvid=BV1YWud6qEPj&cid=40775389001&page=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allow="fullscreen; picture-in-picture" allowfullscreen="true" style="height:100%;width:100%; aspect-ratio: 16 / 9;"> </iframe>

The project is open source on GitHub: [chuspeeism/dashi-taskboard](https://github.com/chuspeeism/dashi-taskboard). It is not the only possible answer, but it shows that a task board is more than an abstract idea—it is already a workable interaction model.

The latter half of the video raises another easily overlooked issue. An automated workflow cannot remain sustainable if every step depends on a human returning to feed it another prompt. At the same time, a workflow without a human present needs a safe fallback. To me, that fallback is not permission for the Agent to decide everything on its own. It is the ability for tasks to pause, queue, and wait for review. **When nobody is watching, it is better to stop in review than to quietly bypass human judgment.**

## Why Is This Compatible with the Pomodoro Technique?

The key is to redefine what it means to “do only one thing during a Pomodoro.”

That one thing should be **the cognitive task currently owned by the human**, not “watch an Agent process until it finishes.” For example:

- Use one Pomodoro to clarify a goal, split the task, and write acceptance criteria.
- Use one Pomodoro to solve a design problem that genuinely requires your reasoning.
- Use one Pomodoro to review a high-risk change in depth.
- Group several tiny, low-risk results into one Pomodoro for batch review.

After handing a task to an Agent, stop continuously monitoring the conversation. A completion notification is simply a new event: it enters the review queue and waits until the current Pomodoro ends or the next scheduled review period begins. Several Agents may be running in the background, but the human mind still has only one foreground goal.

This is different from keeping four conversations open and switching whenever one of them makes a sound. In the first model, machine execution is parallel while human attention remains single-threaded. In the second, human contexts are treated as parallel, leaving nothing but fragments.

If the current human task is complete while the Agent is still running, there is no need to invent another complex problem merely to fill the remaining twenty-five minutes. Use the time to review the work just completed, record the next step, or simply rest. The Pomodoro serves attention, not attendance.

## A Compromise, Not a Replacement

Conversation-driven work still has value. Ideation needs conversation to clarify a problem, and review needs conversation to explain trade-offs and correct deviations. The middle—the work whose goal is already clear, whose steps can proceed continuously, and whose result can be verified—is what belongs in a task system.

What I want is not to “never talk to an Agent again,” but this:

> **Use conversations to think and tasks to advance; let Agents execute asynchronously while humans focus synchronously.**

The Pomodoro Technique protects human attention. Task-driven work handles Agent waiting and progression. Their point of compromise is that humans no longer accompany every run from beginning to end, and we do not mistake the machine's capacity for parallelism for our own.

When progress and results accumulate around tasks, people can finally leave behind repetitive phrases such as “please continue,” “how far did you get?” and “run the tests.” Our limited attention can return to the parts truly worth thinking about, judging, and learning from.
