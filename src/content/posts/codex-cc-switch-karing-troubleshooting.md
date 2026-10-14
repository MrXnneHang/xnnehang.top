---
title: "为什么开了代理，localhost 反而访问不了？从 Codex、CC Switch 到 Python HTTPX"
published: 2026-10-13
description: "本地请求要直连，上游 LLM 又必须走代理，这是不是无解的矛盾？从 Codex、CC Switch 与 Karing 的排障经历出发，拆开两段连接，再用 HTTPX 的独立客户端、按地址分流和 NO_PROXY 说明如何处理。"
draft: true
tags:
  - Codex
  - CC Switch
  - Karing
  - 代理
  - Responses
  - Python
  - HTTPX
category: 边写边学
series:
  - LLM
---

> **AI 生成内容声明：** 本文由 Codex（AI 助手）根据与 XnneHang 的排障讨论整理撰写。XnneHang 提供实际操作结果、应用场景与问题，Codex 负责资料核对、结构组织和技术说明。当前为待 XnneHang 审稿的草稿；未实测的示例和未确定的原因在文中单独标注。

## 背景：验证 hook 之前遇到的接入问题

本次排障起于 memU 的 [#710](https://github.com/NevaMind-AI/memU/pull/710) 验证准备：计划由 Codex 的 `notify` 启动本地进程，再调用 headless Codex 提炼长期记忆。

在 Windows 上安装 Codex CLI、通过 CC Switch 接入供应商，并同时使用 Karing 时，先后遇到了登录提示、本地地址返回 502，以及上游返回 400。它们发生在同一条使用链路上，但需要分别定位。

XnneHang 随后提出了一个更普遍的场景：Python 本地服务需要直连，其内部调用的外部 LLM 又必须经过代理。如果全局禁用代理，是否会修好本地连接，却破坏上游连接？

本文先整理这次 CC Switch 排障中的证据与处理方法，再说明如何在 HTTPX 中为两段连接分别配置代理。

:::note[这篇记录到哪里]
本次确认的环境是 Windows、Codex CLI `0.162.1`、CC Switch `v4.0.11`，通过 CC Switch 本地路由访问第三方供应商，同时使用 Karing。

最终已恢复请求，当前供应商使用 Responses 模式可以工作。memU 的完整 `notify → 提炼 → commit` 链路还没有验证，不能拿普通对话成功代替它。

审稿时还需补充：Karing 的具体版本，以及最后实际采用的 Karing 绕过设置。下文会把排查建议与已确认结果分开。
:::

:::note[XnneHang 的原话]
新版本的 UI 它真的好丑啊，在高分辨率的显示器上，很显然它应该是在 1080p 的分辨率显示器上设计的，所以导致当前它在我的显示器上非常地分散你知道吗。字体还很小。

但是因为这个去开 issue 似乎又不太合适。

我们也不太好直接给人家调 UI，所以 maybe 就吐槽一下？
:::

## 先区分本地请求与上游请求

排查之前，需要明确请求经过哪些服务。

```text
Codex CLI
    │
    │ http://127.0.0.1:<CC Switch 端口>/v1/responses
    ↓
CC Switch 本地服务
    │
    │ 按供应商配置转发，必要时转换协议
    ↓
上游模型服务或网关
```

Karing 可能影响其中的网络路径。第一段是同一台电脑上的本地请求；第二段才是访问外部服务，可能需要代理。

期望的连接方式是：

```text
Codex → CC Switch：本地直连
CC Switch → 上游：继续按原来的代理规则走
```

所以不能简单地把 CC Switch 整个进程都排除代理。那样第一段也许好了，第二段又可能连不上。

同样，Codex 报错里出现 `127.0.0.1`，只说明它请求的是这个地址。**不代表错误一定发生在 Codex 到本地端口之间。** CC Switch 收到请求后，如果转发上游失败，也可能把错误返回给 Codex，界面上显示的 URL 仍然是本地地址。

## 502：为什么本地地址还会和代理打架

最初遇到的是这一类错误，端口以各自配置为准：

```text
unexpected status 502 Bad Gateway: Unknown error,
url: http://127.0.0.1:<port>/v1/responses
```

最初的怀疑是 Karing 将本地回环请求也交给了代理。

这个猜测有社区反馈支持，但也不能只看一个 502 就定案。

[CC Switch #4773](https://github.com/farion1231/cc-switch/issues/4773) 里有人建议把 Clash 从全局模式改成规则模式。[#3989](https://github.com/farion1231/cc-switch/issues/3989) 更具体：有用户将 `localhost` 和 `127.0.0.1` 强制直连后解决，后面也有确认有效的回复。

但同一个 issue 里仍然有人说没解决。它提供的是一个值得先查的方向，不是所有 502 的通用答案。

### Karing 里应该配置什么

issue 中的 Clash YAML 不能直接用作 Karing 配置，应在 Karing 中设置对应的绕过或分流规则。

Karing 当前源码中的设置名称包括「允许绕过系统代理的域名」「私有网络直连」和「自定义分流组」。不同版本的入口位置可能变化。

如果使用系统代理模式，可以在绕过列表里保留原有条目，再添加：

```text
localhost
127.0.0.1
::1
```

这些是主机地址，不需要带 `http://`、端口或 `/v1/responses`。

如果使用 TUN，或请求仍进入 Karing，需要检查分流策略。必要时添加以下直连规则，并保证它们不会被更靠前的代理规则覆盖：

| 匹配类型 | 匹配值 | 出站 |
| --- | --- | --- |
| 域名 | `localhost` | 直连 |
| IP/CIDR | `127.0.0.0/8` | 直连 |
| IP/CIDR | `::1/128` | 直连 |

全局代理模式是否覆盖规则，也要检查。不能一边填了直连规则，一边又让当前模式忽略它。

另外，这次 URL 里是数字地址 `127.0.0.1`，不需要先排查 DNS。先看代理转发和连接路径。

### 终端还有自己的代理环境

系统代理绕过列表和进程的代理环境变量是两回事。如果 Codex 使用了 `HTTP_PROXY`、`HTTPS_PROXY` 等环境变量，仅修改系统代理设置可能不够。

可以先在当前 PowerShell 临时追加本地地址绕过，再从这个窗口启动 Codex：

```powershell
$env:NO_PROXY = (@(
    $env:NO_PROXY
    "localhost"
    "127.0.0.1"
    "::1"
) | Where-Object { $_ }) -join ","

codex
```

这只影响当前进程及后续子进程，不修改系统持久配置。示例中的代理端口也不能直接照用，应以本机实际监听端口为准。

如果需要单独检查本地端口，可以使用下面的命令。这里的 `15721` 只是示例，换成 CC Switch 实际监听端口：

```powershell
curl.exe --noproxy "*" --connect-timeout 3 --max-time 5 `
  -i http://127.0.0.1:15721/
```

根路径返回 404 或 401，也可能说明已经连到了 HTTP 服务，并不要求它必须返回 200。这一步只检查本地连接，不验证模型请求；`--noproxy` 也不能保证绕过 TUN 之类的系统层流量接管。

真正有辨别力的是同时看 CC Switch 日志：**它有没有收到对应请求，又有没有记录上游错误。**

## 从 502 到上游 400

后续排查中，错误变为以下内容。这里省略供应商和模型名称，保留关键部分：

```text
CC Switch local proxy failed while handling Codex endpoint /responses.
upstream_status: HTTP 400
cause: X-OpenAI-Internal-Codex-Responses-Lite requires reasoning.context to be all_turns.
code: cc_switch_upstream_error
```

这次至少明确了两件事：

1. 请求已经到达 CC Switch。
2. CC Switch 报告上游返回了 HTTP 400，并给出了参数要求。

这条错误不再适合用「本地端口找不到」解释。上游说的是：请求使用了 `X-OpenAI-Internal-Codex-Responses-Lite` 相关机制，但 `reasoning.context` 没有满足 `all_turns` 的要求。

不过，仅靠这段文字，还不知道这个标记是哪一层添加的，参数是哪一层遗漏或改写的。不能直接断言是 CC Switch 的 bug，也不能断言是上游的问题。

**据 XnneHang 的操作反馈，切换为 Responses 模式后，请求恢复正常。** Chat Completions 路由路径则出现了上面的兼容性错误。

这是当前组合下有效的 workaround，不是「所有人都必须这样配」的结论。供应商本身也要提供可用的 Responses 接口，不能靠切换一个选项把不存在的接口变出来。

## 所以 CC Switch 到底能不能转换 Chat Completions

这引出了另一个问题：CC Switch 是否支持将 Codex 的 Responses 请求转换为 Chat Completions？

现有维护者回复可以确认，它具备这项能力。

[CC Switch #4741](https://github.com/farion1231/cc-switch/issues/4741) 的维护者回复就是一个很直接的证据：`v4.0.9` 修复了 Codex 历史中的工具结果经路由转换为 Chat 协议时，没有对应工具调用而报错的问题。

原始错误是：

```text
Messages with role 'tool' must be a response
 to a preceding message with 'tool_calls'
```

维护者同时明确说，评论里混入的 401、502 和工具 schema 报错属于其他问题，不在这次修复范围内。因此，不能据此认为升级会解决本文遇到的错误。

协议转换并不只是换个 URL：

```text
Codex Responses 请求
    ↓
转换消息、工具调用、工具结果、推理信息
    ↓
上游 Chat Completions 请求
    ↓
再将上游的流式响应转回 Codex 能理解的事件
```

中间哪怕只有一个调用 ID、请求头、推理字段或流式事件没有对齐，都可能出问题。

站内的 [Responses 与 Chat Completions 的讨论](./resposne-vs-chat_completion.md) 已介绍过相关协议差异。本次现象说明：**具备转换能力，并不意味着覆盖所有客户端与上游组合。**

现在既然当前供应商的 Responses 路径可以用，就先用它。没有必要为了强行走转换路径，手动往请求里塞一个自己也不确定语义的内部参数。

如果要反馈这个问题，应单独开 issue，提供版本、两种接口模式的对照、是否新会话即可复现，以及脱敏日志。#4741 处理的是另一类错误，不适合继续混合讨论。

## 本地直连，上游代理：这会不会是一个死锁

XnneHang 提出的 Python 场景可以具体描述为：把上游 LLM 包装成自己的接口，挂在 `http://127.0.0.1:8000`。桌宠、网页或另一个 agent 请求这个本地服务，再由它请求外部模型。

上游地址偏偏必须通过代理才能正常连接。

于是看起来很矛盾：

- 访问本地接口，希望禁用代理。
- 本地接口内部访问 LLM，希望开启代理。
- 全局关代理，只修好前半段；全局开代理，又可能弄坏前半段。

这里并不存在两个请求互相等待的死锁。**问题在于用同一个全局开关控制了两段需要不同代理策略的连接。**

```text
桌宠 / agent / Python 客户端
    │
    │ A：HTTP 请求，本地直连
    ↓
127.0.0.1:8000 上的自建 LLM 服务
    │
    │ B：新发起的 HTTP 请求，经过代理
    ↓
外部 LLM API
```

A 并不是一条穿过本地服务、一直延伸到模型服务器的原始连接。本地服务接收 A，再创建 B；B 有自己的客户端、连接和代理配置。

**调用方的代理配置不会通过 HTTP 请求自动传递给服务端。** 即使两段逻辑写在同一个 Python 项目里，也可以使用不同的 HTTP 客户端。

至于前面说的「上游要代理才能 ping 通」，这里更准确的判据应该是 HTTP 请求是否成功。普通 HTTP 代理并不等于 ICMP ping 的代理，不能只靠 ping 判断 LLM API 的可达性。

## 在 HTTPX 里解决，而不是要求所有用户改系统设置

如果可以修改代码，最直接的方式是使用两个 client，分别负责本地和外部请求。

:::note[下面是实现示例，不是本次实测结论]
这部分是从排障延伸出的 HTTPX 配置方案。示例中的本地端口、代理端口和上游地址都需要替换；本文没有用这些代码验证真实 LLM 的认证、流式响应和工具调用。CC Switch 的实际转换错误也不会因为换成下面的客户端代码就自动解决。
:::

### 方案一：两个客户端，各管一段连接

HTTPX 可以对单个 client 禁用环境配置，不需要先删除整个进程的代理环境变量。

```python
import asyncio

import httpx


async def main():
    # A：这个 client 只访问本地服务，不读取环境代理。
    async with httpx.AsyncClient(trust_env=False) as local_client:
        response = await local_client.get("http://127.0.0.1:8000/health")
        response.raise_for_status()

    # B：这个 client 访问外网，明确使用实际的代理监听地址。
    async with httpx.AsyncClient(
        proxy="http://127.0.0.1:7890",
    ) as upstream_client:
        response = await upstream_client.get("https://example.com")
        response.raise_for_status()


asyncio.run(main())
```

这个例子故意用两个简单请求说明配置差别，不是一份完整的网关实现。真实应用中，B 的 client 应该在网关侧负责模型请求，A 的 client 在调用方；如果都在一个进程里，也不影响它们独立配置。

实际服务通常应在应用启动时创建 client、退出时关闭，以复用连接池。使用模型 SDK 时，还要确认它允许传入自定义 HTTP client，且实际请求使用了这个 client。

`trust_env=False` 也不只是一个「关闭代理」按钮。它会关闭 HTTPX 对相关环境配置的读取，包括环境中的证书设置。如果应用需要自定义 CA，要显式传入证书配置，不能把忽略环境当成永远安全的默认选择。

### 方案二：一个客户端，按目标地址选择代理

如果一个 client 确实要混合访问本地和外网，可以使用 HTTPX 的 mounts。比起在每个请求前修改环境变量，这个做法更明确，也不会让并发请求互相影响。

```python
import asyncio

import httpx


async def main():
    mounts = {
        "all://": httpx.AsyncHTTPTransport(
            proxy="http://127.0.0.1:7890",
        ),
        "all://localhost": httpx.AsyncHTTPTransport(),
        "all://127.0.0.1": httpx.AsyncHTTPTransport(),
        "all://[::1]": httpx.AsyncHTTPTransport(),
    }

    async with httpx.AsyncClient(
        mounts=mounts,
        trust_env=False,
    ) as client:
        local = await client.get("http://127.0.0.1:8000/health")
        local.raise_for_status()
        remote = await client.get("https://example.com")
        remote.raise_for_status()


asyncio.run(main())
```

更具体的本地地址匹配使用直连 transport，其他目标走代理。这里配置的是列出的主机，不是自动匹配所有私有地址，也不是整个 `127.0.0.0/8`。

两个 client 和 mounts 没有谁绝对高级。**已知职责不同，就分 client；同一个请求入口确实需要按地址分流，再用 mounts。** 不必为了几条已知请求写一个通用路由框架。

### 方案三：不改代码，使用 NO_PROXY

如果应用本来就希望由部署环境决定代理，HTTPX 默认支持读取 `HTTP_PROXY`、`HTTPS_PROXY` 和 `NO_PROXY`。

```powershell
# 7890 只是示例，换成实际代理端口。
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"

# 如果已有 NO_PROXY 条目，应合并，而不是覆盖。
$env:NO_PROXY = (@(
    $env:NO_PROXY
    "localhost"
    "127.0.0.1"
    "::1"
) | Where-Object { $_ }) -join ","
```

代码正常创建 `httpx.AsyncClient()` 即可。它表达的是「外网走代理，本地目标绕过」，不是「把代理关掉」。

但是，不要给显式传了 `proxy=` 的 client 再设置 `NO_PROXY`，就想当然认为后者一定覆盖前者。明确配置代理时，应该同时明确配置需要绕过的路由，或者拆成两个 client。第三方 SDK 也要看它如何创建底层客户端。

还有一个容易混淆的点：**Windows 打开了系统代理，不等于 HTTPX 必然采用它。** HTTPX 文档明确支持的是相应的环境变量；具体应用是否把系统设置转成了环境或客户端配置，需要另外看。不能把所有 Python 本地连接失败都归给同一个系统代理开关。

### 那 Karing 的设置是不是多余了

也不是。它们处理的是不同层面的事情。

| 你能控制的范围 | 更直接的方案 |
| --- | --- |
| 自己的代码，本地和上游职责明确 | 分别配置 HTTP client |
| 同一 client 访问不同目标 | mounts 按地址选择 transport |
| 应用支持环境代理配置 | 代理环境变量配合 `NO_PROXY` |
| 第三方应用不方便修改 | Karing 的绕过或直连规则 |
| TUN 等系统层接管流量 | 检查系统层分流，代码禁用 HTTP 代理不一定够 |

`trust_env=False` 能让 HTTPX 不主动把请求交给环境里指定的 HTTP 代理，却不能保证操作系统不再接管这条连接。反过来，Karing 设好直连，也不能修复 HTTPX 上层的协议转换错误。

本地直连和上游代理可以在源码中同时实现。对于职责明确的请求，分别配置 client 通常就足够；如果无法控制第三方客户端，或流量被系统层接管，再检查 Karing 等工具的配置。

## 另外几件容易混在一起的小事

### 配置完成后仍出现登录提示

本次配置 CC Switch 后，Codex 最初仍提示登录；XnneHang 重启电脑后恢复正常。

这一结果不能证明重启解决了某个特定的认证问题。重启可能刷新进程环境或恢复本地代理状态，但没有做控制变量验证，原因尚未定位。可检查的项目包括：CC Switch 是否应用了 Codex 配置、本地路由是否启动、CLI 是否读取预期目录，以及新终端是否继承所需环境变量。

```powershell
$env:CODEX_HOME
Get-Command codex | Select-Object Source
codex --version
```

既然本来要用的是 CC Switch 的供应商，也不要看到登录提示就急着切到另一种认证方式，把排查变量越加越多。

### Windows 沙箱提示不是登录提示

首次启动时，Codex 会让你选择默认沙箱、非管理员沙箱或退出。

默认沙箱需要管理员权限完成设置，不等于给 agent 永久管理员权限。后续 memU 测试计划在正常启用沙箱的条件下进行，不以关闭保护作为成功标准。

这里还要区分模型请求和工具权限：agent 的 shell 工具能否联网，与 Codex 主程序能否连接模型服务，不是同一件事。不能因为出现「控制网络访问」，就直接认为沙箱导致 CC Switch 连接失败。

### disable_response_storage 被忽略

还有一个启动警告：

```text
disable_response_storage is ignored.
```

它表示当前版本不认识这个配置项。删除或注释这一行可以消除警告，但**不代表因此关闭了任何响应存储**，因为它原本就没有生效。

如果 CC Switch 后续切换配置又写回这个字段，应检查配置模板或版本，而不是每次启动都怀疑认证坏了。

## 连接恢复后的分层验证

安装本身可以用：

```powershell
npm install -g @openai/codex
codex --version
```

配置恢复之后，建议把验证分开做：

| 检查 | 能证明什么 | 不能证明什么 |
| --- | --- | --- |
| `codex --version` | 可执行文件能启动 | 模型认证可用 |
| 交互对话成功 | 当前会话能请求模型 | 非交互进程环境一致 |
| `codex exec` 简单回答 | headless 认证与模型请求可用 | 工具调用和工作区写入正确 |
| 独立目录中的读写任务 | 工具往返与沙箱文件操作可用 | hook 已正确安装并触发 |
| 完整 memU 流程 | 才能验证提炼和提交链路 | 所有前端都同样支持 |

例如，先验证非交互调用：

```powershell
codex exec --skip-git-repo-check "只回复 OK，不调用工具。"
```

这条是建议的下一步检查，不代表本文已经完成全部工具和 hook 测试。

本文记录到模型请求恢复为止，工具执行和 memU hook 链路需要继续验证。排查同类问题时，可以先确认请求是否到达本地服务，再检查其上游连接，最后检查协议与参数兼容性；错误状态变化应结合日志解释，而不是继续沿用最初的故障判断。

## 参考

- [CC Switch #3989：localhost / 127.0.0.1 直连与代理绕过反馈](https://github.com/farion1231/cc-switch/issues/3989)
- [CC Switch #4773：本地 Responses 地址返回 502](https://github.com/farion1231/cc-switch/issues/4773)
- [CC Switch #4741：Responses 转 Chat 时的工具消息配对错误及修复说明](https://github.com/farion1231/cc-switch/issues/4741)
- [Karing 设置名称，简体中文资源](https://github.com/KaringX/karing/blob/main/lib/i18n/zh-CN.i18n.json)
- [HTTPX：代理环境变量与 NO_PROXY](https://www.python-httpx.org/environment_variables/)
- [HTTPX：代理配置](https://www.python-httpx.org/advanced/proxies/)
- [HTTPX：Transport 与按目标路由](https://www.python-httpx.org/advanced/transports/)
- [Codex Windows 文档](https://developers.openai.com/codex/windows)
- [memU #710：hook-triggered bridging](https://github.com/NevaMind-AI/memU/pull/710)
