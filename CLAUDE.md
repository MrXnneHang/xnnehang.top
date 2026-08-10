# nyakku.moe 博客工作指南

## 项目结构

```
nyakku.moe/
├── src/content/posts/   ← 博客文章（.md 文件）
├── src/assets/img/      ← 图片（git submodule → image-hosting 仓库）
│   └── covers/          ← 封面图存放位置
├── src/pages/           ← 页面路由
├── src/config.ts        ← 博客配置
```

## 源文件位置

| 内容                        | 路径                                                |
| --------------------------- | --------------------------------------------------- |
| 博客源文件（Obsidian 写作） | `D:\lab\XnneHangBlog\obsidan\xnnehang.top.factory\` |
| 封面图源文件                | `D:\lab\XnneHangBlog\cover\`                        |
| 博客项目文章                | `nyakku.moe/src/content/posts/`                     |
| 博客图片 (submodule)        | `nyakku.moe/src/assets/img/covers/`                 |

## 图片处理规则

- 图片存放于 `src/assets/img/`，这是一个 **git submodule**（指向 `image-hosting` 仓库）
- 封面图统一放在 `src/assets/img/covers/` 下；正文图片放在以文章 slug 命名的目录 `src/assets/img/<article-slug>/` 下
- `covers/` 仅用于文章封面或与正文无直接对应关系的兜底配图，不用于存放正文截图
- 文章中引用正文图片使用相对路径：`../../assets/img/<article-slug>/filename.jpg`
- 如果文章正文已经以作者选定的首图开头，**必须保留它作为正文第一张图**：主题会自动将首图解析为封面，Astro 构建时也会自动优化格式。不要擅自把它移到 `covers/`、从正文删除、改写为 frontmatter `image:`，或手动转换格式
- 只有从外部 `cover/` 目录另选封面，或文章没有首图且明确需要独立封面时，才使用 `src/assets/img/covers/` 和 frontmatter `image:`
- 新增图片或修改 submodule 内文件时：
  1. 将图片移动到 submodule 内的目标目录：正文图片放入 `src/assets/img/<article-slug>/`，只有文章封面或兜底配图放入 `src/assets/img/covers/`
  2. 进入 submodule 目录，`git status` 确认有实际改动后 commit + push
  3. 更新文章中的图片引用
  4. 在主仓库提交文章变更与 submodule 指针，再 commit + push
- **Astro 本地图片 HTML 标签限制与解决方法**：
  Astro 的 markdown 编译器无法解析 HTML `<img>` 标签中的本地相对路径。如需居中或限制图片宽度，**禁止使用 HTML `<img>` 标签**，应通过如下方式包裹标准 Markdown 图片（在前后各保留一个空行）：

  ```html
  <div class="img-center" style="max-width: 24rem; margin: 0 auto;">
    ![alt](../../assets/img/filename.png)
  </div>
  ```

## 博客发布工作流

### 我（Claude）负责的工作

1. **整理博客**：将 Obsidian 源文件整理后放入 `src/content/posts/`
2. **格式优化**：根据需要添加次级标题、admonition、加粗点缀、GitHub 仓库卡片、video 外链等
3. **封面图**：如果正文已有作者选定的首图，保留首图并让主题自动解析为封面；只有另选独立封面时，才从 `cover/` 目录选取图片放入 submodule，并在文章 frontmatter 中添加 `image:` 字段
4. **Commit & Push**：
   - 不涉及代码改动 → 直接 push 到 `master`
   - 涉及代码改动 → 创建新分支，等待用户提 PR
   - **Commit message 必须使用 [Gitmoji](https://gitmoji.dev/) 前缀**，例如：
     - `✨ feat: 新功能`
     - `🐛 fix: 修复 bug`
     - `♻️ refactor: 重构`
     - `⚡️ perf: 性能优化`
     - `✅ ci: CI 相关`
     - `📝 docs: 文档`
     - `⬆️ deps: 升级依赖`

### 红线

- **不允许改动 Obsidian 源文件**（`obsidan/xnnehang.top.factory/` 下的 .md 文件）
- 需要生成样本对比时，在旁边另外生成一个样本文件
- 所有修改只针对 `nyakku.moe/` 项目内的文件

## Frontmatter 格式

```yaml
---
title: 文章标题
published: 2026-06-12
description: 文章简介，显示在首页
image: ../../assets/img/covers/filename.jpg
tags: [LLM, 博客]
category: 胡思乱想
draft: false
series:
  - LLM
---
```

| 属性          | 说明                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| `title`       | 文章标题                                                                           |
| `published`   | 发布日期                                                                           |
| `description` | 文章简介，显示在首页                                                               |
| `image`       | 封面图。`http://` = 网络图片；`/` 开头 = `public/` 目录；其余 = 相对 markdown 路径 |
| `tags`        | 标签，数组或 `[Tag1, Tag2]` 格式                                                   |
| `category`    | 分类                                                                               |
| `draft`       | `true` 时不会构建到正式站点                                                        |
| `series`      | 系列，数组                                                                         |

## 支持的 Markdown 特性

### WikiLink（双向链接）

```
[[文章标题]]
```

插件自动按 frontmatter 的 `title` 匹配 slug。标题不存在则在构建时输出警告。

### Admonitions（警示框）

支持两种语法，效果相同。

**Directive 语法（推荐，支持自定义标题）：**

```
:::note
这是默认标题的 note
:::

:::tip
提示内容
:::

:::important
重要内容
:::

:::warning
警告内容
:::

:::caution
危险内容
:::
```

自定义标题：

```
:::note[我的自定义标题]
内容
:::
```

**GitHub 语法：**

```
> [!NOTE]
> 内容

> [!TIP]
> 内容

> [!IMPORTANT]
> 内容

> [!WARNING]
> 内容

> [!CAUTION]
> 内容
```

### GitHub 仓库卡片

```html
::github{repo="owner/repo"}
```

示例：

```
::github{repo="MrXnneHang/xnnehang.top"}
```

页面加载时从 GitHub API 拉取仓库信息，生成动态卡片。

### 视频嵌入

直接粘贴 `<iframe>` 到 markdown 中：

**YouTube：**

```html
<iframe
  width="100%"
  height="468"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="YouTube video player"
  frameborder="0"
  allowfullscreen
></iframe>
```

**Bilibili：**

```html
<iframe
  width="100%"
  height="468"
  src="//player.bilibili.com/player.html?bvid=BV_VIDEO_ID&page=1"
  frameborder="0"
  allowfullscreen
></iframe>
```

### 代码高亮（Expressive Code）

支持语法高亮、终端框、行标记、差异对比、自动换行、可折叠代码、行号等。详见 [Expressive Code 官方文档](https://expressive-code.com/)。

### 数学公式

```
行内公式：$\omega = d\phi / dt$
展示公式：
$$
I = \int \rho R^{2} dV
$$
```

### 表格 / 分割线 / 加粗 / 引用

均为标准 Markdown 语法。

## Claude Code 读取说明

Claude Code **默认读取 `CLAUDE.md`**（项目根目录或 `.claude/CLAUDE.md`），**不会自动读取** `agent.md` 或 `AGENTS.md`。

> 如要让 Claude 自动遵循本指南，请将本文件重命名为 `CLAUDE.md`，或者在 `.claude/CLAUDE.md` 中 `include` 引用本文件。
