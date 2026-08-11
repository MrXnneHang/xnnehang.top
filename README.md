<div align="center">

# xnnehang.top

_写代码是因为爱。也把代码、阅读与生活写进这里。_

[![Astro](https://img.shields.io/badge/Astro-build-1aad19?style=for-the-badge&logo=astro)](https://github.com/withastro/astro)
[![Fuwari](https://img.shields.io/badge/Fuwari-theme-26a2ff?style=for-the-badge&logo=astro)](https://github.com/saicaca/fuwari)
[![License](https://img.shields.io/badge/License-CC--BY--NC--SA%204.0-yellow?style=for-the-badge)](LICENSE)

</div>

## 关于

XnneHang 的个人博客，记录代码、想法与生活碎片。本站以 [Astro](https://astro.build/) 为基础，并在 [Fuwari](https://github.com/saicaca/fuwari) 主题上持续定制。

## 这里有什么

- `[[WikiLink]]` 双向链接与文章知识图谱，把相关想法连在一起。
- 全文搜索、文章归档、标签与系列，方便慢慢翻找旧文章。
- GitHub Discussions 评论区，欢迎把读后感留在文章下方。
- GitHub Issues 驱动的公开 Todo 看板，记录正在推进的事情。
- 书架与在读进度，以及写作统计页面，保存阅读和写作的轨迹。
- 明暗主题、跟随系统设置与可调强调色，让阅读更自在。

## 本地运行

环境要求：Node.js `>=22.12.0`、pnpm `11.20.0`。

```bash
pnpm install
pnpm dev
```

构建生产版本：

```bash
pnpm build
```

## 项目结构

```text
src/
├── assets/img/      # 博客图片
├── content/posts/   # Markdown 文章
├── pages/           # 页面与数据路由
└── config.ts        # 站点配置
```

## 致谢与许可证

感谢 [Astro](https://astro.build/) 与 [Fuwari](https://github.com/saicaca/fuwari) 提供的优秀基础。

本项目采用 [CC BY-NC-SA 4.0](LICENSE) 许可证。愿每一次分享，都能带来一点温柔的回响。
