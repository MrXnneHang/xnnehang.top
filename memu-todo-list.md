- [ ] Claude Code INSTALL.md 的 issue 等无关内容的清理
- [ ] hermes SOUL.md 为什么不支持渐进式引用。
- [ ] 把 Memorize 作为一个 Skill 支持响应式记忆。
- [ ] Memorize 的详细度需要参照提示词。
- [ ] OpenClaw 的 sqlite session data 需要兼容读取

what i do:

- bug(bridge task): 无论是否产生新对话数据，它都会执行 memorize 的全过程。因为上一次 memorize 的 session 被当作了下一次的输入。每次都至少有一个新 session。
  hermes、openclaw、claude code 均存在这个问题，其他还未确定
  https://github.com/NevaMind-AI/memU/issues/606
- fix(claude host): 记录 bridging task 产生的 session id 并且在下一次忽略它
  https://github.com/NevaMind-AI/memU/issues/607
