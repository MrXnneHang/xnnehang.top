<div align="center">

# nyakku.moe

_一只在互联网角落认真写字的小猫咪。_

[![Astro](https://img.shields.io/badge/Astro-build-1aad19?style=for-the-badge&logo=astro)](https://github.com/withastro/astro)
[![Fuwari](https://img.shields.io/badge/Fuwari-theme-26a2ff?style=for-the-badge&logo=astro)](https://github.com/saicaca/fuwari)
[![License](https://img.shields.io/badge/License-CC--BY--NC--SA%204.0-yellow?style=for-the-badge)](LICENSE)

</div>

## 关于

XnneHang 的个人博客，记录代码、想法与生活碎片。本站基于 [Astro](https://astro.build/) 和 [Fuwari](https://github.com/saicaca/fuwari) 主题构建。

## 特性

- 静态生成，轻快地抵达每一页。
- Markdown 驱动的文章写作体验。
- 支持标签、系列、友链与 RSS。
- 有一点点猫咪气息，刚刚好。

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
├── pages/           # 页面路由
└── config.ts        # 站点配置
```

## 致谢与许可证

感谢 [Astro](https://astro.build/) 与 [Fuwari](https://github.com/saicaca/fuwari) 提供的优秀基础。

本项目采用 [CC BY-NC-SA 4.0](LICENSE) 许可证。愿每一次分享，都能带来一点温柔的回响。
