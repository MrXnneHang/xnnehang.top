---
title: '重读 memU：多 Host 工作树、运行隔离与主动 Memorize'
published: 2026-09-01
category: technology
kind: learning-note
tags:
  - memU
  - 架构
  - Agent
  - Memory
  - 并发
description: '从一个五分钟触发、十分钟执行的频率问题出发，重新梳理 memU 的多 Host 工作树、marker 生命周期、Recall Files 镜像，以及主动 memorize 的 per-run 隔离方案。'
series:
  - Long-Term Memory
  - 架构设计
---

![重读 memU：多 Host 工作树、运行隔离与主动 Memorize](../../assets/img/memu-multi-host-run-isolation/PixPin_2026-09-01_17-48-12.jpg)

:::note[AI 协作声明]
本文由 Xnne 与 [Korewaxnne](https://github.com/xnne-bot)（赛博猫猫）共同完成。Xnne 提出了问题、架构判断与最终决策，Korewaxnne 协助追踪实现、整理结构并完成中英双语表述。
:::

时隔一段时间重新回来读 memU，我发现自己先前留下的一些理解已经过期了。

这其实很正常。memU 一直处于高速迭代期，我也参与过它的多 Host adapter、bridging、定时任务和 Recall Files 相关工作。一个系统不断长出新能力后，最容易发生的事情不是代码完全看不懂，而是脑子里还保留着某个旧版本的架构图，并且下意识地用它解释今天的行为。

这篇文章延续 [[memU 是啥？我们来拆开看看（长期更新）]] 和 [[站在 C 端开发者的角度看 memU 的架构转向]]，但这次不再沿着某一份 ADR 逐段拆解，而是从一个很具体的频率问题出发，重新厘清 memU 现在的并发边界、文件树职责和主动 memorize 的下一步设计。

::github{repo="NevaMind-AI/memU"}

## 从“五分钟触发，十分钟执行”开始

memU 的被动 memorize 由各个 coding agent 自己完成。每个 Host 的定时任务会启动一次 agent session，执行下面这条流水线：

```text
prepare
  → 从会话日志切出新内容
  → 从 store 镜像 Recall Files
  → 生成 jobs

agent self-evolve
  → 依次处理 jobs
  → 修改 memory / skill
  → 描述本轮涉及的 resources

commit
  → 对比内容哈希基线
  → 把变化提交回 store
  → 推进 cursor 并清理本轮临时文件
```

agent self-evolve 是真正耗时的部分。它需要读 transcript、做判断、修改 Markdown，不是一个瞬间完成的脚本。

于是可以提出一个很简单的压力场景：如果定时任务每五分钟触发一次，但单次运行需要十分钟，会发生什么？

长期看，确实会有接近一半的 trigger 没有执行。但准确地说，它们不是进入 `prepare` 后被某个 marker block，而是在第二个 bridging 进程启动前就被调度层跳过了：

- Windows Task Scheduler 使用 `-MultipleInstances IgnoreNew`。旧实例仍在运行时，新触发会被直接忽略；
- Unix cron wrapper 使用原子的 `mkdir .bridge.lock`。锁已存在时，新触发记录一条 `skipped: another bridging run is in progress`，然后以 0 退出。

所以这不是 50% 的随机概率，而是运行时间与触发周期叠加后的稳定结果。如果一次运行略长于十分钟，十分钟处的第三个 trigger 也可能赶在旧任务结束前被跳过，执行比例自然就不再恰好是一半。

这个例子也把一个长期混在一起的问题暴露出来了：**marker、锁和 manifest 到底分别负责什么？**

## 三个容易混淆的本地状态

| 对象                                                | 作用域                        | 真正职责                                                             |
| --------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| `.bridging_run.<host>.json`                         | 一个 Host 的 bridging cycle   | 记录 `prepare` 开始时间，让 `commit` 能报告整个 cycle 的耗时         |
| `.bridge.lock` / Windows `IgnoreNew`                | 一个 Host 的官方定时任务      | 保证同一 Host 的 bridging run 单实例执行                             |
| `.memory_manifest.json` / `.memorize_manifest.json` | 一个工作树或一个 memorize run | 保存 Recall Files 的内容哈希基线，供 `commit` 判断哪些文件发生了变化 |

### Bridging marker 不是锁

`.bridging_run.<host>.json` 的内容很简单：

```json
{ "started_at": 1788253200.0 }
```

每次 `prepare` 开始时都会覆写它。`commit` 读取这个时间戳，计算从 prepare、agent self-evolve 到 commit 的整轮耗时；成功提交后删除 marker，提交失败时保留，以便下一次 commit 重试仍然能关闭同一个 cycle。

它不会检查旧 marker 是否存在，也不会拒绝第二次 prepare。代码里的 24 小时上限只表示超过这个时长后不再相信测得的 duration，并不表示 marker 会自动过期或解除某种锁。

真正的单实例保证始终来自外层调度器。

### 锁保护的是一个 Host 的长期共享工作树

现在每个 Host 都有独立的运行时工作树：

```text
~/.memu/hosts/<host>/
  sessions/
  jobs/
  memory/
  skill/
  resources.md
  .session_manifest.<host>.json
  .session_manifest.<host>.json.pending
  .memory_manifest.json
  .bridging_run.<host>.json
  .resource.tmp
```

因此并发边界是：

```text
同一 Host 的官方 bridging run：互斥
不同 Host 的 bridging run：可以并发
绕过 wrapper 手工运行 prepare：不受调度层互斥保护
```

跨 Host 并发是安全的，因为 Claude Code、Cursor、Codex、Pi 等 Host 修改的是不同文件树。同一 Host 并发则不安全：`prepare` 会重新生成 jobs 和 session slices，成功的 `commit` 也会清理它们。两个进程共享这些状态时，一个进程可能删除另一个进程尚未处理的工作。

Unix wrapper 的 `.bridge.lock` 会在三小时后被当作 stale lock 回收。这是一个明确的工程取舍：不回收会让一次崩溃永久卡死定时任务；回收则意味着一个真的运行超过三小时的任务可能与下一次 trigger 重叠。正常的十分钟任务不触及这个边界。

## Store、工作镜像与哈希基线

理解并发模型之前，还要先理解 Recall Files 到底存在哪里。

memU 的权威状态不是任何一个 Markdown 目录，而是共享持久化 store。本地模式下它通常是数据库，Cloud 模式下则是远端服务。所有 Host 都读取同一份 `~/.memu/config.env`，因此一个 Host 学到的记忆可以被另一个 Host 检索。

本地文件树里的 `memory/` 和 `skill/` 是 **可变工作镜像**。agent 会直接编辑这些 Markdown。manifest 才是某一时刻的 **内容哈希基线**。

```text
共享 store                         权威状态
本地 memory/ 与 skill/            可变工作镜像
.memory_manifest.json             上次成功 commit 的哈希基线
.memorize_manifest.json           当前主动 memorize run 的哈希基线
```

### Host bridging 的数据流

一次 Host bridging 的完整过程是：

1. `prepare` 分页读取 store 中的全部 Recall Files；
2. 按 track 将它们原子写入该 Host 的 `memory/` 与 `skill/`；
3. 第一次接触该工作树时，用 store 派生内容建立 `.memory_manifest.json`；
4. agent 根据 jobs 修改工作镜像；
5. `commit` 比较当前文件内容与 manifest，只读取新增或内容变化的文件；
6. `commit_results` 将这些变化写回共享 store；
7. store 接受提交后，程序才重拍 manifest、提升 pending session cursor，并清理本轮 jobs 与 session slices。

这里有一个不太直觉但很重要的细节：Host bridging 不会在每次 prepare 后重新建立基线。第一次 prepare 负责 bootstrap，之后主要由成功 commit 重拍。

如果一个 run 在 agent 已经修改文件、但尚未 commit 时崩溃，重新 prepare 就建立新基线，会把这些未提交修改吸收到“未变化”里，从此再也 diff 不出来。保留上次成功 commit 的基线，才能让失败 run 的产物在下一次恢复时继续被识别和提交。

### `(track, name)` 决定冲突语义

Recall File 的身份键是 `(track, name)`。`memory/Profile` 和 `skill/Profile` 是两个对象；同一 track 下同名文件则是同一个对象。

多个 Host 可以从同一旧版本出发，分别修改同一个 `(track, name)`。提交时没有三方合并、版本检查或 compare-and-swap，后提交者会整份覆盖先提交者。

```text
Host A: store v1 → 修改 Profile → commit v2
Host B: store v1 → 修改 Profile → commit v3

最终状态：v3
```

这里的“原子”要限定范围：

- 本地镜像使用临时文件加 `os.replace`，读者不会看到半写文件；
- 单个 Recall File 以完整内容 create-or-update，不做文本级 merge；
- 多文件 `commit_results` 不等于一个全局原子事务；
- 当前 diff 只传播新增和内容变化，磁盘上的删除不会传到 store，因为提交接口还没有 removal path。

这套语义并不完美，但它简单、可恢复，也符合我们对并发写入已经做出的取舍：**允许不同工作副本并行演化，冲突时按 `(track, name)` last-writer-wins。**

## 主动 Memorize 不需要复用 Host 的全部复杂度

被动 bridging 与主动 memorize 面向两种不同输入。

Host bridging 需要处理长期会话日志、增量 cursor、self-session 识别、定时调度、崩溃 leftovers 等状态。主动 memorize 则由开发者显式提交一次 conversation 输入，再交给当前 agent 处理 jobs。它不需要继承 Host 的整套生命周期。

当前 developer workspace 可以抽象为：

```text
<workspace>/
  input/
  jobs/
  memory/
  skill/
  .memorize_manifest.json
  .memorize_run.json
  .resource.tmp
  resources.md
```

`.memorize_run.json` 和 bridging marker 语义不同。它表示这个 workspace 中存在一轮尚未结束的主动 memorize：

- prepare 发现 active run 时拒绝再开一轮；
- commit 要求 active run 存在；
- commit 成功后删除 marker 和本轮临时文件；
- commit 失败时保留状态，允许重试。

这能保护一个共享 developer workspace 的顺序生命周期，却也让所有主动 memorize 共用一个全局门禁。而主动记忆的频率一旦提高，不同 Host、不同会话同时提交输入，就会重新碰到排队问题。

## 目标布局：每次 Memorize 都是一个独立 Run

更合适的设计不是放开共享 workspace 的所有保护，而是把隔离单位从 Host 进一步缩小为 run：

```text
~/.memu/developer/
  runs/
    <run-id-a>/
      input/
      jobs/
      memory/
      skill/
      .memorize_manifest.json
      .memorize_run.json
      .resource.tmp
      resources.md
    <run-id-b>/
      ...
```

`~/.memu/developer` 只承担 run 的命名空间职责。每次 `memu memorize prepare` 原子地创建一个唯一 `<run-id>`，然后返回 run id、工作路径、executor prompt 和对应的 commit 命令。后续 agent、`verify-resources` 与 `commit` 都显式绑定这一轮。

这样可以得到清晰的并发边界：

```text
Host 定时任务：继续 single-instance
memorize prepare：允许并发创建不同 run
同一个 run：保持 single-owner / single lifecycle
共享 store：允许并发提交，冲突按 (track, name) 后写覆盖
```

### Marker 收缩为 per-run 生命周期状态

每个 run 仍然应该拥有自己的 `.memorize_run.json`。它不再阻止其他 run 开始，只负责当前 run 的状态。

marker 存在时表示本轮仍 active，通常不能清理；成功 commit 后删除 marker，或将状态明确转换为 completed，才可以回收目录。失败 commit 保留 marker、jobs、输入和工作镜像，以便恢复。

run 的创建也应当是原子的。与其先检查 `exists()`、做完整个 prepare、最后才写 marker，不如：

1. 通过 exclusive `mkdir` 或等价操作分配唯一 run 目录；
2. 在输入物化与 store 镜像前创建该 run 的状态文件；
3. 所有后续状态转换都限制在这个目录内。

这不需要一把覆盖所有 run 的全局锁。唯一需要串行的是同一个 run 的生命周期。

自动清理也不能只看 marker 年龄。一个长时间没有活动的 run 可能是被放弃了，也可能保存着一次 commit 失败后尚未进入 store 的 Recall Files。更稳妥的状态应包含 `run_id`、创建时间与阶段，并提供显式的 abandon/clean 操作。

## 为什么暂时不引入中央 Worker

从一致性角度看，最舒服的方案当然是一个中央 worker：所有 memorize 请求排队，一个完成并刷新最新状态后，下一个再开始。这样所有任务都能从最新快照出发，甚至不必接受同一 `(track, name)` 的并发覆盖。

但这个方案改变的不只是队列位置。

coding agent 的 self-evolve 使用的是各个 Host 自己的 agent 和 token。一个中央 memU server 如果自己运行 LLM service，就违背了“让 agent 用自己的能力完成工作”的方向；如果改成 MCP server 只负责协调 retrieve 和 memorize，又会引入常驻进程、连接可用性、sandbox 接入、Host 配置和生命周期管理。

它还会放大开源本地版与云端服务之间的差异。一个协调服务最终放在哪里、由谁保证在线、如何让 Codex 等受限 sandbox 连接，都会成为新的系统问题，而不仅仅是解决记忆提交排队。

相比之下，CLI + per-run workspace 保留了 agent 自身执行 self-evolve 的模型，也没有新增常驻基础设施。它接受 store 层的 last-writer-wins，用较小的架构代价换取开放性和可部署性。

这不是理论上最强的一致性，而是当前约束下更友善的工程选择。

## Codex 已经回到统一的 Host 布局

Codex 曾经因为历史兼容保留 `~/.memu` 作为运行时工作树，但现在已经迁移到：

```text
~/.memu/hosts/codex/
```

当前 Codex 的 `HostSpec` 没有覆盖 `base_dir`，因此和其他 Host 一样使用 `~/.memu/hosts/<host>`。jobs、sessions、memory、skill、manifest 与 resources 都位于这个运行时目录。

这里还要区分源码目录和用户状态目录：

- `src/memu/hosts/codex` 是 Codex adapter 的源码包；
- `~/.memu/hosts/codex` 是用户机器上的 Codex bridging 工作树。

二者名字相同，但一个是代码组织，一个是运行时状态。

## 根目录的 Memory 是共享检索缓存

Codex 迁走后，根目录仍然保留：

```text
~/.memu/memory/
~/.memu/skill/
```

它们不是某个 Host 的 evolve 工作树，也不是数据库的完整 Markdown 快照，而是 retrieve hook 按检索命中惰性生成的共享 read-through cache。

retrieve 从 store 得到命中的 Recall File 后，会把完整内容原子写入 `~/.memu/<track>/<name>.md`，再把可打开的 `path` 返回给 agent。这样每个 Host 都能使用同一个稳定路径阅读检索结果，用户误删缓存后，下一次命中也会自动恢复。

因此这里的“只读”是所有权契约，而不是文件系统权限：

```text
store 是唯一权威写入目标
Host / run 镜像允许 agent 修改，并通过 commit 回写
根检索镜像只允许 memU 刷新，agent 只读且不能由此回写
```

根镜像也不能被描述成数据库的完整物化视图。未被 retrieve 命中的文件可能从未落盘；store 中已经删除的对象也可能留下旧缓存，因为这里没有全量 sweep 和 deletion reconciliation。

如果产品真的需要完整、可枚举、版本一致的只读视图，就需要专门的 producer：全量分页读取 store、在临时目录生成所有文件、协调删除，再通过目录版本或索引切换发布。这会重新引入刷新频率、失败恢复与生产者职责。

当前 read-through cache 已经满足 agent 打开检索结果的需求。若目录名容易让人误以为它是权威 memory，未来可以迁到 `~/.memu/cache/recall-files/<track>`；但这属于路径与职责表达优化，不是并发模型的必要改造。

## 最终架构决策

重读完整条链路后，最终得到的边界比最初设想的更简单：

1. **保留 Host bridging 的单实例策略。** 它保护的是带 cursor、jobs 和 crash recovery 的长期共享工作树；
2. **不同 Host 继续使用独立工作树。** 它们可以并发 evolve，并共享同一个权威 store；
3. **主动 memorize 改为 per-run 隔离。** `~/.memu/developer` 只管理 `runs/<run-id>`，不同 run 彼此独立；
4. **marker 只管理自己的生命周期。** Bridging marker 负责 cycle 计时，memorize marker 负责单个 run 的 active/completed 状态；
5. **共享冲突保持 `(track, name)` last-writer-wins。** per-run 隔离解决本地文件安全，不伪装成数据库事务或自动 merge；
6. **根 Recall Files 继续作为 memU-owned 的共享检索缓存。** agent 可以读取，但只有 Host/run 工作镜像能够通过 commit 影响 store；
7. **保持 CLI，不引入常驻中央 worker。** 在现阶段，以较小的基础设施成本保留多 Agent、多 Host 与开源本地部署的完整能力。

这里最重要的不是新增一个 `runs/` 目录，而是把三种并发问题放回各自应该解决的层：

```text
调度层解决同一 Host 的重复运行
文件树隔离解决不同 run 的本地竞争
store 的身份键决定并发提交后的最终结果
```

当这三层不再混为一谈，主动 memorize 的设计也就不需要推翻现有 bridging。它只需要在更合适的粒度上，重新画出一条边界。
