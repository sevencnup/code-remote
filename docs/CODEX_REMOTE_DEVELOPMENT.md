# Codex Remote Web 开发文档

## 目标

在 `/code/codex-remote` 新建独立的本机 Codex 远程聊天项目。网页端只提供对话记录侧栏、对话页面和输入框；本机后端连接 Codex，手机浏览器通过网页远程使用。

## 核心技术决策

- 前端：React、TypeScript、Vite。桌面端为对话列表 + 聊天区双栏；窄屏侧栏抽屉化。
- 后端：Python、FastAPI。后端在本机启动单个长期运行的 `codex app-server --listen stdio://` 子进程。
- Codex 通道：后端通过 stdio JSON-RPC/JSONL 向 app-server 发送 thread/turn 请求，并持续读取 stdout 通知；不解析终端界面文字，不轮询，不为每条用户消息重启 Codex。
- 浏览器实时通道：WebSocket。收到 `item/agentMessage/delta` 后立即推送到网页并追加到正在显示的助手消息；`turn/completed` 等事件同步运行状态。
- 回复中的活动状态：根据 App Server 的 turn/item 通知，在回复旁动态显示思考、执行命令、修改文件、调用工具或生成回复等安全摘要；不向用户展示原始 reasoning 内容。
- 会话历史：通过 Codex 原生 `thread/list`、`thread/read`、`thread/resume` 管理，不另存一份内容副本。
- 对话列表按 thread ID 去重；App Server 为同一 thread 返回多个记录时，仅显示更新时间最新的一条，不按标题合并不同对话。
- 发送前确认当前 thread 已在 App Server 中恢复；切换/恢复历史记录期间禁用发送，避免对尚未加载的 thread 发起 turn。
- 若 App Server 返回 thread 已有 active writer，将该 thread 标记为运行中并禁止重复发送；通过 turn 通知或会话文件变化刷新到完成状态。
- 外部会话同步：监听本机 Codex `sessions` 目录的 JSONL 文件变化，通过 WebSocket 通知前端刷新对话列表；消息流仍使用 App Server 的增量通知。
- 远程入口：Vite 的显式 LAN 启动仅暴露网页服务；引擎默认只绑定 loopback，Codex app-server 只使用 stdio。使用配对码保护 API 和 WebSocket。

## 页面范围

- 左侧：新建对话、Codex 对话记录、当前选中项。
- 主页面：工作目录与连接状态、对话消息、流式状态、审批卡片、输入框和停止操作。
- Codex 处理期间，根据当前 App Server 活动动态更新状态文案；收到回复 delta 后显示“正在回复”，turn 结束或切换会话时清除状态。
- 恢复对话期间禁用输入和发送；若本机已不存在该 thread，保留草稿并提示用户改用新对话。
- 侧边栏每个 thread ID 只显示一次，避免 App Server 的重复列表记录造成重复项。
- 遇到 active writer 时显示运行状态，等待原 turn 完成后再发送，避免重复启动同一 thread。
- 移动端：侧栏通过按钮打开/关闭，聊天页面填满屏幕。
- 本项目不实现代码编辑器、文件树、终端、模型设置、Agent 编排或飞书机器人。

## 实施步骤

1. 建立新项目目录和独立 Git 仓库，新增本开发文档后再开始实现。
2. 编写本机 Python 服务：单例 Codex app-server 子进程、JSON-RPC 请求关联、notification 增量分发、审批请求转发、会话接口和配对码认证。
3. 编写网页端 API/WebSocket 客户端与状态 hook，做到连接后读取历史、选中时恢复 thread、发送消息和实时合并 delta。
4. 实现桌面双栏与手机抽屉布局，只展示对话记录和对话页面。
5. 注册 `/code/pnpm-workspace.yaml`，在 workspace 根目录执行一次 `pnpm install`；Python 依赖写入独立 `requirements.txt`。
6. 执行网页生产构建并检查改动；不新增或运行自动化测试。
7. 更新 `CHANGELOG.md` 记录本次功能，并在新项目 Git 仓库创建本地提交。根 `/code` 目前不是 Git 仓库，workspace 注册配置单独保留在根目录。

## 验收标准

- 新项目与已有业务仓库隔离，root workspace 可以通过 `codex-remote` filter 识别它。
- 本机 Codex CLI 可用时，网页显示 Codex 历史、能恢复 thread、能发起新对话和后续 turn。
- 回复增量通过后端 WebSocket 推送，前端收到 delta 后立即更新，不依赖轮询。
- Codex 回复期间显示当前操作类型，并随 App Server 通知实时切换；不泄露 reasoning 文本。
- 历史 thread 恢复期间不能启动 turn；App Server 重连后发送前重新恢复 thread。
- 同一个 thread ID 在列表中只保留最新记录，标题相同但 ID 不同的对话保持独立。
- 已有活动 writer 的 thread 不会收到第二个 turn；活动结束后状态会自动恢复可发送。
- 手机屏幕可以打开对话列表、切换对话、输入消息、看到流式回复并处理批准/拒绝提示。
- Codex 不存在、连接断开或请求失败时显示可读状态。
- API/WS 需要本机启动时生成的配对码；Codex app-server 不对网络开放。
- `pnpm --filter codex-remote build` 成功。
