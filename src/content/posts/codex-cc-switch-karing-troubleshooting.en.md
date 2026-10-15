---
title: "Why Does localhost Stop Working When a Proxy Is Enabled? Codex, CC Switch, and Python HTTPX"
published: 2026-10-13
description: "A troubleshooting record from connecting Codex to CC Switch through Karing, followed by a look at how Python HTTPX should route local services directly while sending upstream LLM requests through a proxy."
draft: true
tags:
  - Codex
  - CC Switch
  - Karing
  - Proxy
  - Responses
  - Python
  - HTTPX
category: Learning as I Build
series:
  - LLM
lang: en
translationKey: codex-cc-switch-karing-troubleshooting
---

![Article cover](../../assets/img/codex-cc-switch-karing-troubleshooting/PixPin_2026-10-14_19-51-37.jpg)

:::note[AI collaboration disclosure]
This article was written collaboratively by Xnne and [Korewaxnne](https://github.com/xnne-bot). Xnne provided the actual results, questions, and judgments from the troubleshooting process; Korewaxnne helped verify sources, organize the discussion, and write the technical explanations. Parts that were not tested in practice are marked as such.
:::

## I was only trying to test memU

I was looking at memU [#710](https://github.com/NevaMind-AI/memU/pull/710), which aims to let Codex's `notify` hook start a local process and then use headless Codex to run `memorize`.

So I first set up Codex CLI, CC Switch, and Karing on Windows. The environment was Codex CLI `0.162.1`, CC Switch `v4.0.11`, a provider connected through CC Switch's local proxy, and Karing handling external network access.

Codex had not even started helping with memU yet, and I was already stuck on the connection setup.

At first, Codex still asked me to sign in after the configuration was complete. Restarting the computer made it work again. I did not run a controlled test afterward, so I cannot tell whether the actual cause was a stale environment variable, a process state, or CC Switch not having applied its configuration in time.

Then Codex started returning a 502 for the local CC Switch endpoint at `127.0.0.1`.

That is the part worth recording here.

## Seeing a 502 at 127.0.0.1 does not prove that the local service is broken

The error looked roughly like this:

```text
unexpected status 502 Bad Gateway: Unknown error,
url: http://127.0.0.1:<port>/v1/responses
```

My first guess was that Karing was sending a request that should have stayed on the local machine through the proxy as well.

That guess did not come from nowhere. In CC Switch [#4773](https://github.com/farion1231/cc-switch/issues/4773), someone reported a similar situation: the request targeted a local Responses endpoint but ended up returning 502. Switching Clash from global mode to rule mode reportedly fixed it.

Then I found [#3989](https://github.com/farion1231/cc-switch/issues/3989), which made the same direction look even more plausible. Users reported that forcing `localhost` and `127.0.0.1` to bypass the proxy fixed the problem, and others confirmed similar results.

Still, a 502 alone does not prove that the first connection failed. The actual path is more like this:

```text
Codex
  │
  │ http://127.0.0.1:<port>/v1/responses
  ↓
CC Switch local service
  │
  │ request to the upstream model service
  ↓
Third-party provider or gateway
```

Codex may have reached CC Switch successfully, while CC Switch failed to reach the upstream provider. CC Switch can then return a 502 to Codex. The URL shown by Codex will still be `127.0.0.1`, even though the actual failure happened in the second connection.

That makes the CC Switch log more useful than guessing from the URL:

- If CC Switch never received the request, investigate the connection from Codex to the local port.
- If CC Switch received it and logged an upstream error, investigate the upstream proxy, provider, or protocol conversion.

## What should Karing bypass?

I did not want to bypass Karing for the entire CC Switch process. The desired routing was more specific:

```text
Codex → CC Switch: direct connection
CC Switch → upstream: keep using the existing proxy rules
```

If the whole CC Switch process is forced to bypass the proxy, the local connection may start working while CC Switch loses its ability to reach the external model service. These requests happen inside the same application, but they are separate connections.

In Karing's system-proxy mode, add these addresses to the bypass list:

```text
localhost
127.0.0.1
::1
```

With TUN mode, the same intent needs to be expressed as routing rules. The loopback targets should go direct, and these rules must be placed before any rule that would send them through the proxy:

| Match type | Value | Outbound |
| --- | --- | --- |
| Domain | `localhost` | Direct |
| IP/CIDR | `127.0.0.0/8` | Direct |
| IP/CIDR | `::1/128` | Direct |

The exact menu names vary between Karing versions. Do not paste the Clash YAML from a CC Switch issue directly into Karing; configure the equivalent bypass or routing rules in Karing itself.

There may also be proxy settings in the environment inherited by the Codex process. If `HTTP_PROXY` or `HTTPS_PROXY` is set, changing the system-proxy bypass list may not be enough. I can temporarily add the loopback addresses in the PowerShell window used to launch Codex:

```powershell
$env:NO_PROXY = (@(
    $env:NO_PROXY
    "localhost"
    "127.0.0.1"
    "::1"
) | Where-Object { $_ }) -join ","

codex
```

This only affects the current terminal and the processes it starts. It does not change the persistent Windows configuration.

A local port can also be checked directly. The port below is only an example and must be replaced with the port actually used by CC Switch:

```powershell
curl.exe --noproxy "*" --connect-timeout 3 --max-time 5 `
  -i http://127.0.0.1:15721/
```

A 404 or 401 response is not necessarily bad here. It may simply show that an HTTP service is listening on the port. This only tests the local connection; it does not test a model request. If TUN is taking over traffic at the system level, `--noproxy` may not be enough to change the route.

## After the local connection recovered, the error became a 400

After changing the routing, the error changed:

```text
CC Switch local proxy failed while handling Codex endpoint /responses.
upstream_status: HTTP 400
cause: X-OpenAI-Internal-Codex-Responses-Lite requires reasoning.context to be all_turns.
code: cc_switch_upstream_error
```

This time, at least one thing was clear: the request had reached CC Switch, and CC Switch had received an HTTP 400 from upstream.

This was no longer a local-port problem. It was a protocol or parameter compatibility problem. The request carried something related to `X-OpenAI-Internal-Codex-Responses-Lite`, while the upstream required `reasoning.context` to be `all_turns`.

I switched the provider's interface in CC Switch from Chat Completions to Responses, and the request started working again.

The result so far is:

```text
The local request can reach CC Switch after bypassing the proxy.
The provider's Responses path works.
The Chat Completions routing path has a compatibility problem.
```

That still does not tell us which component is responsible. CC Switch may be dropping or rewriting a header or parameter during conversion. The upstream gateway may also be applying an additional validation rule.

## Can CC Switch actually convert between the protocols?

I originally assumed that CC Switch's job was to convert Codex's Responses requests into Chat Completions requests. It does have that capability, but “supports conversion” and “converts every request correctly” are very different claims.

CC Switch [#4741](https://github.com/farion1231/cc-switch/issues/4741) is a good example. In that issue, a Codex tool result converted to the Chat protocol produced this error:

```text
Messages with role 'tool' must be a response
 to a preceding message with 'tool_calls'
```

The maintainer later explained that `v4.0.9` fixed this kind of tool-message pairing problem. So CC Switch is not incapable of conversion. The conversion layer simply has to preserve tool calls, tool results, reasoning fields, request headers, and streaming events. A mismatch in any one of those can make the upstream reject the request.

That also explains why the Responses route worked while the Chat Completions route did not:

```text
Responses mode:
Codex /responses → CC Switch → upstream Responses

Chat routing mode:
Codex /responses → CC Switch conversion → upstream Chat Completions
```

The first path has one fewer translation layer.

For now, I did not try to inject `reasoning.context` into the request manually. It is not clear whether that field should be handled by Codex, CC Switch, or the upstream gateway. Since the Responses path already works, I am using that path. If this needs a separate issue later, the useful report will include CC Switch `v4.0.11`, Codex CLI `0.162.1`, a comparison between the two interface modes, and redacted logs.

## This is not only a Codex problem

The troubleshooting also brought up another situation that I have run into more than once.

Suppose we build a local Python service:

```text
Desktop companion / Agent / another client
  │
  │ request to localhost, direct connection
  ↓
LLM gateway at 127.0.0.1:8000
  │
  │ request to the external model, through a proxy
  ↓
External LLM API
```

A common reaction is to disable the proxy globally. The local service then becomes reachable, but the LLM request made by the gateway can no longer get out.

Keep the proxy enabled and the opposite problem may appear: the local request is intercepted by the proxy and the local service becomes unreachable.

It looks like a deadlock, but it is not. These are two independent HTTP connections. The caller creates the first one, and the local gateway creates the second one. They do not need to share one global proxy switch.

The trouble is that many libraries silently read proxy environment variables, so both connections end up using the same settings without anyone explicitly choosing that behavior.

## Do not disable the proxy globally in HTTPX

If the code is under our control, the clearest solution is to use separate clients.

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

The important part is not the two example requests. It is that they have different proxy policies:

- the local client ignores the environment proxy;
- the upstream client explicitly uses a proxy.

A real application should create and reuse its clients during the application lifecycle instead of creating a new connection pool for every request. When using an LLM SDK, also check whether it accepts a custom HTTP client and actually uses it for requests.

If one client really needs to access both local and external targets, HTTPX can choose a transport by destination:

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

If the code cannot be changed, `NO_PROXY` is another option:

```powershell
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"
$env:NO_PROXY = "localhost,127.0.0.1,::1"
```

HTTPX reads these environment variables by default. External requests continue through the proxy while loopback targets bypass it.

There are two limits to remember. A client with an explicitly configured `proxy=` may not behave the way you expect from `NO_PROXY`. Also, `trust_env=False` only stops HTTPX from reading environment proxy settings; it cannot stop a lower-level system mechanism such as TUN from taking over the traffic.

The practical order is therefore:

```text
Code under your control: split clients by responsibility.
Code you cannot change: use HTTP_PROXY together with NO_PROXY.
Third-party applications or TUN interception: configure loopback direct rules in Karing.
```

That is much more precise than disabling the proxy everywhere.

## Finally

This turned out to be two different problems appearing one after another during the same Codex setup:

1. The local request from Codex to CC Switch may be affected by proxy rules, so loopback addresses need to go direct.
2. Once the local connection works, the Chat Completions route exposes a Responses-Lite compatibility problem. For now, the Responses route works.

The memU flow—`notify → prepare → Codex memorization → commit`—has not been tested in this article yet. I had to get past the proxy and protocol problems before reaching the actual test.

## References

- [CC Switch #4773: 502 from a local Responses endpoint](https://github.com/farion1231/cc-switch/issues/4773)
- [CC Switch #3989: bypassing the proxy for localhost and 127.0.0.1](https://github.com/farion1231/cc-switch/issues/3989)
- [CC Switch #4741: tool-message pairing when converting Responses to Chat](https://github.com/farion1231/cc-switch/issues/4741)
- [HTTPX: environment variables and NO_PROXY](https://www.python-httpx.org/environment_variables/)
- [HTTPX: proxy configuration](https://www.python-httpx.org/advanced/proxies/)
- [HTTPX: transports and destination-based routing](https://www.python-httpx.org/advanced/transports/)
- [Codex for Windows documentation](https://developers.openai.com/codex/windows)
- [memU #710: hook-triggered bridging](https://github.com/NevaMind-AI/memU/pull/710)
