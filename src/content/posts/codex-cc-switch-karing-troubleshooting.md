---
title: '为什么开了代理，localhost 反而访问不了？从 Codex、CC Switch 到 Python HTTPX'
published: 2026-10-13
description: '一次 Codex、CC Switch 和 Karing 的排障记录，也聊聊本地服务直连、上游 LLM 走代理时，Python HTTPX 应该怎么分流。'
tags:
  - Codex
  - CC Switch
  - Karing
  - 代理
  - Responses
  - Python
  - HTTPX
category: technology
kind: learning-note
series:
  - LLM
---

![文章首图](../../assets/img/codex-cc-switch-karing-troubleshooting/PixPin_2026-10-14_19-51-37.jpg)

:::note[AI 协作声明]
本文由 Xnne 与 [Korewaxnne](https://github.com/xnne-bot) 共同整理撰写。Xnne 提供实际操作结果、问题和判断，Korewaxnne 协助资料核对、结构整理和技术表述。文中没有实际验证的部分会单独说明。
:::

## 我本来只是想验证一下 memU

最近在看 memU 的 [#710](https://github.com/NevaMind-AI/memU/pull/710)。它想做的事情很直接：让 Codex 的 `notify` 启动一套本地流程，再调用 headless Codex 完成 memorize。

所以我先在 Windows 上把 Codex CLI、CC Switch 和 Karing 配起来。环境是 Codex CLI `0.162.1`、CC Switch `v4.0.11`，供应商通过 CC Switch 的本地代理接入，外部网络由 Karing 负责。

结果 Codex 还没开始帮 memU 干活，先在接入这里卡住了。

接入时，Codex 访问 CC Switch 的本地端口，出现了一个指向 `127.0.0.1` 的 502。

## 从 502 开始，翻一翻社区 issue

当时的报错大致是这样：

```text
unexpected status 502 Bad Gateway: Unknown error,
url: http://127.0.0.1:<port>/v1/responses
```

我一开始的猜测是：Karing 把本来应该访问本机的请求也送进代理了。

这个猜测不是凭空来的。CC Switch 的 [#4773](https://github.com/farion1231/cc-switch/issues/4773) 里就有人遇到过类似的情况：请求地址是本机的 Responses 端点，但最后返回了 502。有人通过把 Clash 从全局模式切到规则模式解决了。

后来看到 [#3989](https://github.com/farion1231/cc-switch/issues/3989)，这个方向就更像了。里面有人明确提到，把 `localhost` 和 `127.0.0.1` 强制直连后问题消失，后面也有其他用户确认过类似结果。

请求经过两段连接，报错里的本地 URL 只能告诉我们 Codex 请求了谁：

```text
Codex
  │
  │ http://127.0.0.1:<port>/v1/responses
  ↓
CC Switch 本地服务
  │
  │ 请求上游模型服务
  ↓
第三方供应商或网关
```

#4773 和 #3989 给了我们一个可以尝试的方向：让本地回环地址绕过代理。沿着这个方向调整后，报错从 502 变成了带有 `upstream_status: HTTP 400` 的协议错误。最初那个 502 的具体来源还没有定位，不过新的报错给了我们继续排查的线索。

## Karing 应该绕过什么

两段连接各有自己的代理需求：

```text
Codex → CC Switch：本地直连
CC Switch → 上游：继续使用原来的代理规则
```

如果把 CC Switch 整个进程都设成直连，很可能本地端口的问题解决了，但 CC Switch 访问外部模型又失败。这两个请求虽然发生在同一个程序里，但不是同一条连接。

下面整理了按代理模式选择配置的方法。回看当时的记录，最终采用的 Karing 设置和是否使用了 `NO_PROXY` 都没有记全，具体配置需要按自己的环境选择。

如果使用 Karing 的系统代理模式，可以在绕过列表中加入：

```text
localhost
127.0.0.1
::1
```

如果使用 TUN，还要在分流规则里让下面这些目标走直连，并确认规则排在代理规则之前：

| 匹配类型 | 匹配值        | 出站 |
| -------- | ------------- | ---- |
| 域名     | `localhost`   | 直连 |
| IP/CIDR  | `127.0.0.0/8` | 直连 |
| IP/CIDR  | `::1/128`     | 直连 |

具体菜单名称会随 Karing 版本变化，可以在绕过列表或分流界面中设置对应的地址。

另外，如果 Codex 的进程继承了 `HTTP_PROXY`、`HTTPS_PROXY`，系统代理里的绕过设置可能还不够。可以先在启动 Codex 的 PowerShell 里临时设置：

```powershell
$env:NO_PROXY = (@(
    $env:NO_PROXY
    "localhost"
    "127.0.0.1"
    "::1"
) | Where-Object { $_ }) -join ","

codex
```

这个设置只影响当前终端和它启动的子进程，不会修改 Windows 的持久配置。

也可以先用下面的方式确认本地端口至少能被直接连接。端口只是示例，需要换成 CC Switch 实际监听的端口：

```powershell
curl.exe --noproxy "*" --connect-timeout 3 --max-time 5 `
  -i http://127.0.0.1:15721/
```

返回 404 或 401 也不一定是坏事，它至少说明这个端口上有 HTTP 服务。这个命令只验证本地连接，不验证模型请求；如果流量被 TUN 接管，`--noproxy` 也不一定能改变系统层的路由。

## 后来，错误变成了 400

调整之后，错误发生了变化。新的错误是：

```text
CC Switch local proxy failed while handling Codex endpoint /responses.
upstream_status: HTTP 400
cause: X-OpenAI-Internal-Codex-Responses-Lite requires reasoning.context to be all_turns.
code: cc_switch_upstream_error
```

这条报错由 CC Switch 返回，并明确报告了上游 HTTP 400。它指向协议或参数兼容问题：上游要求使用 `X-OpenAI-Internal-Codex-Responses-Lite` 相关机制的请求满足 `reasoning.context=all_turns`。

我把 CC Switch 里的供应商接口从 Chat Completions 改成 Responses 之后，请求恢复了。

同一供应商下，Chat Completions 路由报错，Responses 模式可用，这是这次操作得到的对照结果。错误涉及哪一层的请求头或参数处理，还需要继续定位。

## CC Switch 到底能不能做协议转换

我原本以为 CC Switch 的作用就是把 Codex 的 Responses 请求转换成 Chat Completions。现在看来，它确实有这个能力，但“支持转换”和“所有请求都能正确转换”之间差得很远。

[#4741](https://github.com/farion1231/cc-switch/issues/4741) 就是一个比较直接的例子。那个 issue 里，Codex 的工具结果被转换到 Chat 协议时出现了：

```text
Messages with role 'tool' must be a response
 to a preceding message with 'tool_calls'
```

维护者后来说明 `v4.0.9` 修复了这类工具消息配对问题。转换过程要处理工具调用、工具结果、推理字段、请求头和流式事件，其中的差异可能影响上游是否接受请求。

两种配置走的路径可以这样理解：

```text
Responses 模式：
Codex /responses → CC Switch → 上游 Responses

Chat 路由模式：
Codex /responses → CC Switch 转换 → 上游 Chat Completions
```

Responses 模式减少了这里的协议转换。对于这次使用的供应商，它也是已经恢复请求的配置；供应商需要提供可用的 Responses 接口。

#4741 说明了转换中可能遇到的问题，修复的是工具消息配对。我们遇到的 Responses-Lite 错误还需要单独定位。

## 本地 LLM 网关也会遇到同样的困惑

这次排查让我想到另一个经常遇到的场景。

假设我们写了一个 Python 本地服务：

```text
桌宠 / Agent / 其他客户端
  │
  │ 请求 localhost，本地直连
  ↓
127.0.0.1:8000 上的 LLM 网关
  │
  │ 请求外部模型，需要代理
  ↓
外部 LLM API
```

很多人遇到这个问题时，会直接把代理关掉。这样本地服务能访问了，但网关内部的 LLM 请求又出不去。

反过来，保持全局代理开启，本地请求可能被代理接管，又会出现本地服务访问失败。

看起来像是一个死锁，其实不是。这里有两段完全独立的 HTTP 连接：第一段由调用方创建，第二段由本地网关创建。它们不需要共用同一个代理开关。

真正麻烦的是很多库默认从环境变量里读取代理，于是两段请求不知不觉用了同一套配置。

## 在 HTTPX 中分别配置两段连接

下面用 HTTPX 演示几种配置方式。本地服务地址、上游地址和代理端口都需要替换；真实 LLM 的认证、流式响应和工具调用仍需在应用里验证。

如果自己能控制代码，最简单的办法是把两个 client 分开。

```python
import httpx


async def check_local_service():
    async with httpx.AsyncClient(trust_env=False) as client:
        response = await client.get("http://127.0.0.1:8000/health")
        response.raise_for_status()


async def call_upstream():
    async with httpx.AsyncClient(
        proxy="http://127.0.0.1:7890",
    ) as client:
        response = await client.get("https://example.com")
        response.raise_for_status()
```

两个 client 各自使用自己的代理策略：

- 本地 client 不读取环境代理；
- 上游 client 明确通过代理访问外网。

真实项目里应该在应用生命周期中复用 client，不要每次请求都创建连接池。模型 SDK 也需要确认能不能传入自定义 HTTP client。

如果一定要共用一个 client，也可以按目标地址选择 transport：

```python
import httpx


mounts = {
    "all://": httpx.HTTPTransport(
        proxy="http://127.0.0.1:7890",
    ),
    "all://localhost": httpx.HTTPTransport(),
    "all://127.0.0.1": httpx.HTTPTransport(),
    "all://[::1]": httpx.HTTPTransport(),
}

with httpx.Client(mounts=mounts, trust_env=False) as client:
    local = client.get("http://127.0.0.1:8000/health")
    remote = client.get("https://example.com")
```

如果代码不方便改，也可以使用 `NO_PROXY`：

```powershell
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"
$env:NO_PROXY = "localhost,127.0.0.1,::1"
```

已有 `NO_PROXY` 条目时应追加这些地址，保留原有配置。HTTPX 默认会读取这些环境变量，于是外部请求继续走代理，本地地址绕过代理。

但这里有两个边界：显式传入 `proxy=` 的 client 不一定会再按 `NO_PROXY` 分流；另外，`trust_env=False` 只能让 HTTPX 不读取环境代理，不能阻止 TUN 这类更底层的系统流量接管。

所以处理顺序大概是：

```text
自己能改代码：按职责拆 client
代码不方便改：HTTP_PROXY + NO_PROXY
第三方应用或 TUN 接管：在 Karing 里配置回环直连
```

`trust_env=False` 还会影响环境中的证书配置；需要自定义 CA 时，应显式配置证书。

## 回到这次排障

这次是沿着社区 issue 的线索调整后，先看到报错发生变化，再通过切换 Responses 模式恢复了模型请求。最初 502 的具体来源、Responses-Lite 参数在哪一层出了问题，都还留着疑问。

从这个过程延伸出来的本地网关场景，倒是有了清楚的配置思路：调用本地服务的 client 直连，网关请求上游的 client 使用代理。两段连接分别配置，就能同时满足这两个需求。

## 参考

- [CC Switch #4773：本地 Responses 地址返回 502](https://github.com/farion1231/cc-switch/issues/4773)
- [CC Switch #3989：localhost / 127.0.0.1 直连与代理绕过反馈](https://github.com/farion1231/cc-switch/issues/3989)
- [CC Switch #4741：Responses 转 Chat 时的工具消息配对错误](https://github.com/farion1231/cc-switch/issues/4741)
- [HTTPX：代理环境变量与 NO_PROXY](https://www.python-httpx.org/environment_variables/)
- [HTTPX：代理配置](https://www.python-httpx.org/advanced/proxies/)
- [HTTPX：Transport 与按目标路由](https://www.python-httpx.org/advanced/transports/)
- [Codex Windows 文档](https://developers.openai.com/codex/windows)
- [memU #710：hook-triggered bridging](https://github.com/NevaMind-AI/memU/pull/710)
