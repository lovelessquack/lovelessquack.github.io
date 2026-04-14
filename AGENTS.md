# 仓库协作指南

## 项目结构与模块组织
这个仓库是一个小型静态站点。根目录的 `index.html` 是落地页。功能页面位于 `html/` 目录：`card.html` 是文字卡片生成器，`chat.html` 是聊天截图生成器。共享前端资源位于 `static/`：`index.css` 包含共享主题和布局样式，`index.js` 负责卡片生成功能，`chat.js` 负责聊天内容编辑与导出。仓库没有构建产物目录，所有文件均直接以静态资源方式提供。

## 构建、测试与开发命令
当前项目没有基于包管理器的构建流程，也没有自动化测试运行器。

- `python -m http.server 8000`
  在仓库根目录启动本地静态服务器。
- 打开 `http://localhost:8000/`
  这是日常开发和手工验收的推荐方式。
- `start index.html`
  可用于快速检查基础结构和样式，但剪贴板、导出等浏览器 API 在 `http://localhost` 下通常更稳定。

## 编码风格与命名约定
HTML、CSS 和 JavaScript 统一使用 4 空格缩进。JavaScript 保持无框架实现，优先使用原生 DOM API，并与 `static/` 下现有代码风格保持一致。变量和函数名使用 `camelCase`，例如 `loadRandomAvatar`、`generateCard`；CSS 类名和文件名使用 `kebab-case`，例如 `chat-row-right`、`index.css`。共享样式应优先放在 `static/index.css`，除非确实是单页专用逻辑，否则不要随意增加内联样式。

## 测试说明
当前以手工测试为准。需要覆盖三个入口页：`index.html`、`html/card.html`、`html/chat.html`。涉及 UI 变更时，至少检查桌面端和移动端宽度、主题切换、头像加载、以及由 `html2canvas` 驱动的保存和复制流程。如果改动涉及外部资源，还需要确认项目在本地静态服务下仍能正常工作。

## 提交与 Pull Request 约定
最近提交记录里存在较短的提交信息，例如 `调整架构`、`11`、`1`。后续提交仍可保持简短，但建议使用更明确、面向动作的描述，例如 `card: fix layout overflow`。Pull Request 应包含简要摘要、受影响页面或资源、手工测试说明，以及界面可见变更的截图或 GIF。如有关联 issue，应一并链接。

## 安全与配置提示
站点运行依赖第三方资源，例如 Google Fonts、CDNJS 上的 `html2canvas`、DiceBear 和 Unavatar。不要把密钥或其他敏感信息提交到仓库。新增外部 URL 时应谨慎处理，并在每次依赖改动后验证受 CORS 影响的功能是否正常。

## 初始化快照
本仓库已于 2026-04-14 完成初始化扫描。当前仓库结构与上述说明一致：根目录为 `index.html`，功能页位于 `html/`，共享资源位于 `static/`。初始化时 `git` 工作区干净，所在分支为 `main`。

当前实现说明：
- `html/card.html` 是文字分享卡片生成器。
- `html/chat.html` 是聊天截图生成器，当前预览风格为微信聊天记录样式。
- `static/index.js` 负责卡片渲染、主题切换、头像加载、通过 `html2canvas` 保存或复制图片，以及提交到服务端的动作。
- `static/chat.js` 负责聊天消息编辑、头像初始化，以及通过 `html2canvas` 保存或复制图片。

当前已知风险与注意点：
- 读取多个页面和脚本时发现明显乱码，说明现有 HTML、JS、CSS 存在编码不一致风险。在没有先确认编码之前，不要直接大规模修改中文文案。
- `static/index.js` 目前包含硬编码的 POST 地址 `http://192.168.2.3:9991/api/duanzi`，同时还包含 `X-API-Key`。这类配置应视为敏感信息，不应继续扩散这种写法。
- 剪贴板和导出能力依赖浏览器安全上下文与第三方资源，因此验收时优先使用 `http://localhost:8000/`，不要直接双击本地文件测试。
