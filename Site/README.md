# CatsOnPlains Reader Site

基于 **VitePress + [Valance UI (`@valance-ui/vue`)](https://github.com/Mizauka/ValanceUI)** 构建的扁平几何沉浸式长篇阅读工作台。

- **在线访问（GitHub Pages）**：`https://mizauka.github.io/CatsOnPlains/`

## 特性亮点
- **三档响应式工作台**：
  - Desktop (`> 1080px`)：经典 `[1 | 2 | 3]` 三栏（资源目录 + 阅读多标签画布 + 评论/大纲检查器）；
  - Tablet (`641px – 1080px`)：`[1-2] <-> [2-3]` 互斥双栏分屏，共享拖拽比例；
  - Phone (`<= 640px`)：1:1 挤压式侧边栏（`VlPushDrawer`）+ 同心圆角停靠面板（`VlDockSheet`）+ 安全区与类安卓返回栈适配。
- **统一视觉与多主题系统**：接入 `@valance-ui/vue` 高明度米白 `#FDFCF9` / 深岩灰 `#273033`、6 套明亮预设、莫奈对位取色与 9 套 Pride 配色方案。

## 本地开发与构建

需将 `ValanceUI` 克隆至与 `CatsOnPlains` 同级的父目录（`../../ValanceUI`）：

```bash
pnpm --dir ../../ValanceUI install
pnpm --dir ../../ValanceUI build:vue

pnpm install
pnpm dev      # 同步章节并启动 VitePress 开发服务器
pnpm build    # 同步章节并构建静态站
```

GitHub Actions（`../.github/workflows/deploy-pages.yml`）会自动并行检出 `Mizauka/ValanceUI` 并完成 `@valance-ui/vue` 预构建与 Pages 发布。
