---
title: "Learning from Bad Architecture: What Claude Desktop's Five Scheduling Systems Reveal About Separating Cowork and Code"
published: 2026-07-23
description: A breakdown of Claude Desktop's five scheduling systems, the architectural causes behind their complexity, why this design multiplies the effort required to maintain one project, and what a bad architecture can teach us.
tags:
  - Claude Desktop
  - memU
  - bridging
  - 定时任务
category: technology
kind: learning-note
featured: true
lang: en
translationKey: claude-desktop-bridging-problem
---

![Claude Desktop scheduling systems](../../assets/img/covers/PixPin_2026-07-23_17-28-05.jpg)

:::note
I have a peculiar habit: whenever I encounter something that confuses me, I want to figure it out—at least far enough to resolve the confusion.

That was how Claude Desktop's complicated scheduling systems drew me in. After taking them apart, however, I found an architectural mess riddled with legacy problems and code continually wedged in through successive iterations. The rest of this article explains why.

Why did I persist after realizing halfway through just how twisted the implementation was? Because good architecture is not the only kind worth studying. In fact, it can be harder to understand precisely what makes good architecture good. Bad architecture is different: its problems are apparent at a glance. The ancients learned from history; we can learn from a mess.

This is an architecture worth knowing how to avoid. Someone else has already stepped into the traps for us. I certainly will not split the underlying `agent` system into divergent implementations merely to accommodate different scenarios, because that leads directly to maintaining several parallel systems—effectively multiplying the effort required to maintain a single project. I would rather spin the other scenario into a new project than force both into the same one.
:::

## Why I Call It an Architectural Mess

First, consider Claude Desktop's three modes: `chat`, `cowork`, and `code`.

What concerns us here is the architectural redundancy, not the elegance of the code itself. The project is not open source, after all.

Taken separately, both `cowork` and `code` are excellent. I have used each of them extensively.

There is not much to say about `chat`. Many tools and shell permissions have been stripped away; it is simply chat.

`code` feels as though it shares a core with Claude Code. It has essentially the same tools and slash commands as Claude Code, its logic is very similar, and even its prompts seem consistent.

`cowork` is where the architectural mess begins. Rather than sharing the same Agent system as `code`, it appears to have built another independent one. Much of the underlying tool and memory machinery may be shared, but the two also diverge substantially. Cowork, for example, does not expose the range of `allow` permissions available in Code. It has shell access, but never with the same comfort as Code's ability to grant full access; some capabilities also seem to have been removed. For reasons I cannot explain, its shell execution is simply slower than Code's as well.

I used Cowork frequently while working on my graduation project—for surveys, presentations, and editing Word documents. With the right skills configured, it is an excellent workbench. But creating that workbench also required sacrificing or cutting down many Code features and prompts, allowing the two implementations to drift apart.

The particular mess examined here, however, comes from the scheduling systems—or rather, from the deeply counterintuitive architecture revealed by those systems.

As discussed above, Cowork and Code were built as two Agent systems, so they also require at least two scheduling systems.

Because Claude Desktop tries to support both local and cloud execution, that number becomes at least four. Code mode also has `/loop`, which creates session-scoped scheduled tasks that disappear when the session ends.

Strictly speaking, then, a single Claude Desktop contains five scheduling systems. They cannot communicate across Cowork and Code; each maintains its own tasks. The Code side calls them Routines, while the Cowork side calls them Scheduled Tasks. Code creates a local Routine by default, whereas Cowork creates a Cloud Scheduled Task by default. Both are created with a tool named `create_scheduled_task`, yet the same tool produces different results.

Code also has `/schedule`, which lets users choose between a local and cloud Routine. Cowork has no equivalent `/schedule` command. A conversation cannot create a Local Scheduled Task there; users can only change a cloud task to `Run on your computer` through the GUI.

The result is a `code vs cowork` divide full of legacy problems, mismatched features, mismatched documentation, and awkward usage.

This investigation certainly resolved my confusion—by leading me all the way into the architectural mess.

## Background

[#538](https://github.com/NevaMind-AI/memU/issues/538) established that bridging requires a standalone CLI with headless authentication. That raises a natural follow-up question: **Could we avoid installing the CLI and run bridging through Claude Desktop's native scheduled tasks instead?** In theory, running inside an already authenticated app might bypass both symptoms described in #538.

To answer that question, I tested the behavior locally on Windows 11 with Claude Desktop 2.1.181 and compared it against the official documentation. This issue records the survey and its conclusion so that the route does not have to be evaluated again later.

The conclusion first: **Do not use Desktop's native scheduling. Keep the `claude_code` adapter targeted exclusively at the Claude Code CLI plus the operating system scheduler.**

## The Complete Picture of Claude's Five Native Scheduling Systems

This comparison draws on four sets of documentation: [scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), [Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks), [Routines](https://code.claude.com/docs/en/routines), and [Cowork support](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork).

| System                                                                                                                                        | Created from                                                                       | Runs on                                        | Can access local files                            | Can read all session logs                |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Cloud Routine (UI: New routine → Cloud)                                                                                                       | CLI, Desktop, or claude.ai                                                         | Anthropic cloud, with a fresh clone each time  | No                                                | No                                       |
| Local Routine (UI: New routine → Local; Code mode tool: `create_scheduled_task`)                                                              | Desktop only: choose Local on the Routines page, or use the tool in a Code session | Local machine; runs only while the app is open | Yes                                               | Yes                                      |
| Session-scoped tasks                                                                                                                          | CLI `/loop`                                                                        | Local machine, tied to the session             | Yes                                               | Yes, but they disappear with the session |
| Cloud Cowork Scheduled Tasks (UI: Home → Scheduled → New task; Cowork mode tool: `create_scheduled_task`)                                     | Cowork session or the Scheduled section on Home                                    | Anthropic cloud sandbox                        | Conditional, bridged only while the app is online | Unreliable                               |
| Local Cowork Scheduled Tasks (UI: Home → Scheduled → New task → `Run on your computer`; cannot be reproduced through `create_scheduled_task`) | Cowork session or the Scheduled section on Home                                    | Local machine; runs only while the app is open | Yes                                               | Yes                                      |

One additional detail deserves attention. When a Claude Desktop conversation uses the built-in `create_scheduled_task` tool in Code mode, it creates a Local Routine by default. That Routine silently binds its `cwd` to the working directory of the session in which it was created. If the directory is later deleted, the task loses the directory it expects to activate when it runs and begins to fail.

In Cowork mode, `create_scheduled_task` creates a Cloud Scheduled Task by default. It can be manually changed to `Run on your computer`, turning it into a local scheduled task, but this operation is difficult to reproduce conversationally—or rather, Cowork explicitly refuses to do so. **Even if I ask it to create ten more scheduled tasks, every one still runs in the cloud.** No tool allows Cowork to create a local Scheduled Task directly. It even suggests using cron on macOS or Linux, or offers to help write an equivalent for Windows. `Run on your computer` is accessible only through the GUI and must be configured manually. It is a Beta feature and presumably has not yet been exposed through a tool.

There is also a gap in the official documentation worth pointing out. The [Routines documentation](https://code.claude.com/docs/en/routines) defines Routines as scheduled systems that run only in the Anthropic cloud, while the [Desktop scheduled tasks documentation](https://code.claude.com/docs/en/desktop-scheduled-tasks) calls the local variant a Desktop scheduled task. Yet the latter describes a UI flow that says, “click **New routine** and choose **Local**.” The terminology in the Desktop UI is therefore misaligned. The documentation itself has not been fully synchronized and its naming has drifted. In Desktop, both kinds of task can be manually switched between local and cloud execution through the UI, but neither system appears to offer a complete, reliable built-in mechanism for triggering that migration through conversation.

## Testing the Entry-Point Routing: `/schedule` and `create_scheduled_task`, Same Names but Different Backends

![Routing among Claude Desktop scheduling systems](../../assets/img/covers/claude-desktop-routing.png)

Three findings from direct testing—all verified through persisted files or transcripts rather than paraphrased from documentation:

1. **`create_scheduled_task` creates a local task in a Code session**, as verified by the persisted `SKILL.md`, but **creates a cloud task in a Cowork session**, which describes itself as something that “spins up a fresh session in a cloud sandbox, so your computer doesn't need to be on.” The same tool name routes to two opposing backends.
2. **There are two `/schedule` entry points.** Typing `/schedule` in a Desktop Code session invokes a skill from the `anthropic-skills` plugin, persisted under `%APPDATA%\Claude\local-agent-mode-sessions\skills-plugin\...`. Its instructions end with “Finally, call the `create_scheduled_task` tool,” which produces a **local** task. In the CLI documentation, however, `/schedule` creates a **cloud** Routine. Direct testing also found `/schedule` only in Code sessions; Cowork and ordinary Chat sessions do not expose it.
3. **Ordinary Chat sessions expose neither mechanism.** Chat is not a scheduling surface.

## Code's Local Tasks vs Cowork's Scheduled Tasks: The Two Users Are Most Likely to Confuse

| Dimension                                   | Local Routine created in a Code session                                                     | Cowork Scheduled Task                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Execution environment                       | Local machine, inside the Desktop app process                                               | Anthropic cloud sandbox                                               |
| App or machine shut down                    | Does not run; on wake, catches up only the most recent occurrence within a seven-day window | Continues running                                                     |
| Local files                                 | Full access (`cwd` is only the starting point, not a sandbox)                               | Conditional bridging while the app is online; no formal documentation |
| Access to all `~/.claude/projects` sessions | Yes                                                                                         | Unreliable                                                            |
| Authentication                              | Inherits the app login; no CLI or token required                                            | Managed in the cloud                                                  |
| Local representation                        | Two persisted layers: `SKILL.md` plus a registry                                            | None; there is nothing that can be “moved to local”                   |

At first glance, a Local Routine seems perfect for hosting the memu-cli scheduling system.

But Routines have a fatal flaw: when a scheduled task is created, its `cwd` is automatically bound to the project directory of the creating session. If that project folder is deleted, the Routine loses its working directory and fails. Although it can access the complete collection of sessions, it was designed only for work inside a Project.

Another uncontrollable factor is that we cannot predict whether users will install memu-cli from Cowork or Code. In Cowork, moreover, we cannot reliably change a Routine to `Run on your computer` through conversation.

## Why We Are Not Splitting the `claude_code` Adapter into Separate CLI and Desktop Implementations

A local Desktop Scheduled Task is tempting in isolation: the app is already authenticated and can read every session. As a registration target for an **installer**, however, direct testing exposed too many problems in its mechanism:

1. **The detection criterion is unstable.** Identically named tools and commands route to opposite backends on different surfaces, so an Agent cannot determine its environment from the name alone. The only reliable criterion is to create a task and then check whether a `SKILL.md` file was persisted, making installation logic complicated and brittle.
2. **The entry point is extremely narrow.** Local tasks can be created only from a Desktop Code session. The terminal CLI has no entry point. Manually placing a `SKILL.md` file creates an orphan: testing showed that a complete `memu-bridging/SKILL.md` outside the registry is never scheduled. Editing the registry manually at `%APPDATA%\Claude\claude-code-sessions\...\scheduled-tasks.json` creates a dead letter: in testing, the edit survived for seven minutes before the app's in-memory copy overwrote the entire entry at the next scheduling tick. **The installer has no registration path outside a session.**
3. **The `cwd` binding is hidden.** Every task in the registry silently captures a `cwd` equal to the working directory of the session that created it. The tool exposes no parameter for it and no way to update it. Behavior after that directory is deleted is undocumented and remains unresolved in testing.
4. **The mechanism is still rolling out, and the documentation itself has gaps.** Documentation and direct testing diverge—for example, Cowork support documentation says `/schedule` exists, while testing found that it does not. The documentation, UI, and tools use three mutually contradictory naming schemes. Surface semantics drift between versions, making this unsuitable as a third-party installation target.
5. **The benefit is not exclusive.** Transcripts from Desktop Code sessions and the CLI are stored under the same `~/.claude/projects` directory. **A bridging pipeline built on the CLI plus the operating system scheduler naturally covers data created by Desktop users, so avoiding Desktop's native scheduling loses nothing.**

The choice is between maintaining one implementation—the CLI plus cron, launchd, or Task Scheduler, with one task name and three verification gates—and maintaining two, one of which rests on naming collisions, three storage layers, and a hidden `cwd`. We choose the former. This also matches the pattern used by the other adapters: Codex, OpenClaw, and WorkBuddy use their host's scheduler because those schedulers are **stable APIs**. Claude Desktop's is not. Scheduled Tasks are still marked Beta and may change at any time.

## Trade-off (Explicitly Accepted)

**If a user has only Claude Desktop and not the Claude Code CLI**, installing memU requires two additional steps:

1. Install the standalone CLI with one command: `irm https://claude.ai/install.ps1 | iex`, `winget install Anthropic.ClaudeCode`, or `npm install -g @anthropic-ai/claude-code`. The MSIX bundle included with Desktop does not count because it is not on `PATH` and is not visible to a bare process.
2. Configure headless authentication using `claude setup-token` to obtain `CLAUDE_CODE_OAUTH_TOKEN`, or set `ANTHROPIC_API_KEY`. The Desktop login is not visible to the CLI; see #538.

For users who already have the CLI, a verification gate decides whether setup is needed: if `claude -p 'ping'` succeeds in a bare shell, skip these steps; otherwise, guide the user through `setup-token`.

If Desktop's native scheduling later becomes stable and fully documented—particularly if the same-name split is removed and an out-of-session registration path is provided—we can reconsider it as an optional optimization for Desktop users. Even then, the criterion must be persistence verified on disk, not the tool name.

## Related

- [#538](https://github.com/NevaMind-AI/memU/issues/538): bridging requires a standalone `claude` executable on `PATH` that supports headless authentication (execution-layer fix)
- [#539](https://github.com/NevaMind-AI/memU/issues/539): the bridging guide lacks a Windows Task Scheduler path (execution-layer fix)
- #514 (closed; the starting point of this series)

I will add a link after publishing the detailed testing notes on the three storage layers, the A/B comparison, the registry-overwrite timeline, and measurements of scheduling ticks.
