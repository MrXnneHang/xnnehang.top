# 在途工作台

`/todo/` 是 GitHub Issues 的公开只读视图：GitHub 负责录入、编辑、权限和历史，博客负责展示、搜索与标签浏览。页面内部以「炼金」作为工作隐喻：坩埚承载炼制中的事项，关闭的 Issue 则成为结晶。

## 录入规则

只有满足全部条件的 Issue 才会显示：

- 创建者是 `MrXnneHang` 或 `xnne-bot`；
- 含有 `workspace:todo` 标签；
- 不是 Pull Request。

Issue 的标题与正文会公开到网站。评论不会同步或显示，因此不要把评论当作 Todo 的进度记录。

## 状态、优先级与标签

- Open Issue 是待完成事项；关闭 Issue 即表示已完成。
- `P0`、`P1`、`P2`、`P3` 是固定优先级，分别表示立即处理、尽快处理、正常推进和有空再做；它们在工作台中始终显示，即使当前数量为零。
- 除 `workspace:todo` 和优先级外，其他 GitHub labels 都会作为彩色普通标签显示，可以同时添加多个；没有待完成事项持有的标签不会显示在侧栏。
- 项目、领域等分类继续使用普通 label 表达。
- 默认视图只展示待完成事项；完整完成历史需要主动进入“已完成”。
- 浏览某个优先级或标签时，列表末尾会附带该分类最近完成的事项，并使用删除线区分。

## Private Project

GitHub Project **Personal Workspace** 是私有管理面，供 `MrXnneHang` 与 `xnne-bot` 使用。它不会被博客构建读取，也不要求与标签维持字段同步；公开页面只依赖 Issue 状态和 labels。
