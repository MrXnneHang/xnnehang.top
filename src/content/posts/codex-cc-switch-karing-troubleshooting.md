---
title: "为什么开了代理，localhost 反而访问不了？从 Codex、CC Switch 到 Python HTTPX"
published: 2026-10-13
description: "一次 Codex、CC Switch 和 Karing 的排障记录，也聊聊本地服务直连、上游 LLM 走代理时，Python HTTPX 应该怎么分流。"
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

![文章首图](../../assets/img/codex-cc-switch-karing-troubleshooting/PixPin_2026-10-14_19-51-37.jpg)

:::note[AI 协作声明]
本文由 Xnne 与 [Korewaxnne](https://github.com/xnne-bot) 共同整理撰写。Xnne 提供实际操作结果、问题和判断，Korewaxnne 协助资料核对、结构整理和技术表述。文中没有实际验证的部分会单独说明。
:::

## 我本来只是想验证一下 memU

最近在看 memU 的 [#710](https://github.com/NevaMind-AI/memU/pull/710)。它想做的事情很直接：让 Codex 的 `notify` 启动一套本地流程，再调用 headless Codex 完成 memorize。

所以我先在 Windows 上把 Codex CLI、CC Switch 和 Karing 配起来。环境是 Codex CLI `0.162.1`、CC Switch `v4.0.11`，供应商通过 CC Switch 的本地代理接入，外部网络由 Karing 负责。

结果 Codex 还没开始帮 memU 干活，先在接入这里卡住了。

最开始是配置完成后仍然要求登录。重启电脑之后又恢复了，具体是环境变量、进程状态，还是 CC Switch 的配置没有及时生效，没有继续做控制变量测试，所以现在也不能把“重启解决了问题”当成一个确定结论。

接下来才是这篇文章真正想记录的部分：Codex 访问 CC Switch 的本地端口时，出现了一个指向 `127.0.0.1` 的 502。

## 看到 127.0.0.1 的 502，不能马上怪本地服务

当时的报错大致是这样：

```text
unexpected status 502 Bad Gateway: Unknown error,
url: http://127.0.0.1:<port>/v1/responses
```

我一开始的猜测是：Karing 把本来应该访问本机的请求也送进代理了。

这个猜测不是凭空来的。CC Switch 的 [#4773](https://github.com/farion1231/cc-switch/issues/4773) 里就有人遇到过类似的情况：请求地址是本机的 Responses 端点，但最后返回了 502。有人通过把 Clash 从全局模式切到规则模式解决了。

后来看到 [#3989](https://github.com/farion1231/cc-switch/issues/3989)，这个方向就更像了。里面有人明确提到，把 `localhost` 和 `127.0.0.1` 强制直连后问题消失，后面也有其他用户确认过类似结果。

但我觉得这里还是要留一点余地。一个 502 并不能直接证明是 Codex 到 CC Switch 这一段失败了，因为实际请求链路是这样的：

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

如果 Codex 已经成功找到 CC Switch，但是 CC Switch 访问上游失败，它也可以把一个 502 返回给 Codex。Codex 界面上显示的 URL 仍然是 `127.0.0.1`，但真正出错的地方可能已经在第二段了。

所以排查时最有用的不是盯着报错 URL 猜，而是看 CC Switch 的日志：

- CC Switch 完全没有收到请求，优先查 Codex 到本地端口这一段；
- CC Switch 收到了请求，并且记录了上游错误，优先查上游代理、供应商和协议转换。

## Karing 应该绕过什么

我的目标不是让 CC Switch 整个进程都绕过 Karing，而是把两段请求分开：

```text
Codex → CC Switch：本地直连
CC Switch → 上游：继续使用原来的代理规则
```

如果把 CC Switch 整个进程都设成直连，很可能本地端口的问题解决了，但 CC Switch 访问外部模型又失败。这两个请求虽然发生在同一个程序里，但不是同一条连接。

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

具体菜单名称会随 Karing 版本变化。不要直接把 CC Switch issue 里的 Clash YAML 原样复制进去，应该在 Karing 里配置等价的绕过或分流规则。

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

## 直连之后，错误变成了 400

调整之后，错误发生了变化。新的错误是：

```text
CC Switch local proxy failed while handling Codex endpoint /responses.
upstream_status: HTTP 400
cause: X-OpenAI-Internal-Codex-Responses-Lite requires reasoning.context to be all_turns.
code: cc_switch_upstream_error
```

这次至少可以确认，请求已经进入了 CC Switch，而且 CC Switch 确实拿到了上游返回的 400。

这和前面的本地 502 已经不是一回事了。现在的问题变成了协议或参数兼容：请求里带着 `X-OpenAI-Internal-Codex-Responses-Lite` 相关机制，但上游要求 `reasoning.context` 是 `all_turns`，实际请求没有满足这个条件。

我把 CC Switch 里的供应商接口从 Chat Completions 改成 Responses 之后，请求恢复了。

于是目前能得到的结论是：

```text
本地请求绕过代理后，Codex 可以找到 CC Switch；
当前供应商的 Responses 路径可以工作；
Chat Completions 路由路径存在兼容问题。
```

但还不能仅凭这个错误判断到底是谁的锅。可能是 CC Switch 转换时没有正确处理请求头或参数，也可能是上游网关对这类请求做了额外检查。

## CC Switch 到底能不能做协议转换

我原本以为 CC Switch 的作用就是把 Codex 的 Responses 请求转换成 Chat Completions。现在看来，它确实有这个能力，但“支持转换”和“所有请求都能正确转换”之间差得很远。

[#4741](https://github.com/farion1231/cc-switch/issues/4741) 就是一个比较直接的例子。那个 issue 里，Codex 的工具结果被转换到 Chat 协议时出现了：

```text
Messages with role 'tool' must be a response
 to a preceding message with 'tool_calls'
```

维护者后来说明 `v4.0.9` 修复了这类工具消息配对问题。也就是说，CC Switch 并不是完全不会转换，而是转换过程还要处理工具调用、工具结果、推理字段、请求头和流式事件，任何一处没有对齐都可能被上游拒绝。

这也解释了为什么当前 Responses 模式能跑，Chat Completions 模式却报错：

```text
Responses 模式：
Codex /responses → CC Switch → 上游 Responses

Chat 路由模式：
Codex /responses → CC Switch 转换 → 上游 Chat Completions
```

前一条路径少了一层转换，暴露出来的问题自然也少一些。

所以我暂时没有继续手动往请求里补 `reasoning.context`。这个字段到底该由 Codex、CC Switch 还是上游网关处理，现在并不明确。既然 Responses 路径已经能工作，就先使用它。之后如果还要反馈，可以把 CC Switch `v4.0.11`、Codex CLI `0.162.1`、两种接口模式的对照结果和脱敏日志单独整理成 issue。

## 这不只是 Codex 的问题

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

## HTTPX 里不要全局关代理

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

这里的重点不是这两个请求本身，而是它们拥有不同的代理策略：

- 本地 client 不读取环境代理；
- 上游 client 明确通过代理访问外网。

真实项目里应该在应用生命周期中复用 client，不要每次请求都创建连接池。模型 SDK 也需要确认能不能传入自定义 HTTP client。

如果一定要共用一个 client，也可以按目标地址选择 transport：

```python
import httpx


mounts = {
    "all://": httpx.AsyncHTTPTransport(
        proxy="http://127.0.0.1:7890",
    ),
    "all://localhost": httpx.AsyncHTTPTransport(),
    "all://127.0.0.1": httpx.AsyncHTTPTransport(),
    "all://[::1]": httpx.AsyncHTTPTransport(),
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

HTTPX 默认会读取这些环境变量，于是外部请求继续走代理，本地地址绕过代理。

但这里有两个边界：显式传入 `proxy=` 的 client 不一定会再按 `NO_PROXY` 分流；另外，`trust_env=False` 只能让 HTTPX 不读取环境代理，不能阻止 TUN 这类更底层的系统流量接管。

所以处理顺序大概是：

```text
自己能改代码：按职责拆 client
代码不方便改：HTTP_PROXY + NO_PROXY
第三方应用或 TUN 接管：在 Karing 里配置回环直连
```

这比“全局禁用代理”精确得多。

## 最后

这次其实遇到了两个不同的问题，只是它们连续出现在同一个 Codex 启动过程中：

1. Codex 访问 CC Switch 的本地请求可能被代理规则影响，需要让回环地址直连；
2. 本地请求恢复后，Chat Completions 路由又暴露出 Responses-Lite 的协议兼容问题，当前可以先切到 Responses 模式。

至于 memU 的 `notify → prepare → Codex 提炼 → commit`，这篇文章还没有验证到那里。折腾完代理和协议之后，才轮到真正的测试。

## 参考

- [CC Switch #4773：本地 Responses 地址返回 502](https://github.com/farion1231/cc-switch/issues/4773)
- [CC Switch #3989：localhost / 127.0.0.1 直连与代理绕过反馈](https://github.com/farion1231/cc-switch/issues/3989)
- [CC Switch #4741：Responses 转 Chat 时的工具消息配对错误](https://github.com/farion1231/cc-switch/issues/4741)
- [HTTPX：代理环境变量与 NO_PROXY](https://www.python-httpx.org/environment_variables/)
- [HTTPX：代理配置](https://www.python-httpx.org/advanced/proxies/)
- [HTTPX：Transport 与按目标路由](https://www.python-httpx.org/advanced/transports/)
- [Codex Windows 文档](https://developers.openai.com/codex/windows)
- [memU #710：hook-triggered bridging](https://github.com/NevaMind-AI/memU/pull/710)
