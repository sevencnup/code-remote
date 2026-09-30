# Codex Remote Web 开发文档

## 目标

在 `/code/codex-remote` 新建独立的本机 Codex 远程聊天项目。网页端只提供对话记录侧栏、对话页面和输入框；本机后端连接 Codex，手机浏览器通过网页远程使用。

## 核心技术决策

- 前端：React、TypeScript、Vite。桌面端为对话列表 + 聊天区双栏；窄屏侧栏抽屉化。
- 后端：Python、FastAPI。后端在本机启动单个长期运行的 `codex app-server --listen stdio://` 子进程。
- Codex 通道：后端通过 stdio JSON-RPC/JSONL 向 app-server 发送 thread/turn 请求，并持续读取 stdout 通知；不解析终端界面文字，不轮询，不为每条用户消息重启 Codex。
- 浏览器实时通道：WebSocket。收到 `item/agentMessage/delta` 后立即推送到网页并追加到正在显示的助手消息；`turn/completed` 等事件同步运行状态。
- 会话历史：通过 Codex 原生 `thread/list`、`thread/read`、`thread/resume` 管理，不另存一份内容副本。
- 外部会话同步：监听本机 Codex `sessions` 目录的 JSONL 文件变化，通过 WebSocket 通知前端刷新对话列表；消息流仍使用 App Server 的增量通知。
- 远程入口：Vite 的显式 LAN 启动仅暴露网页服务；引擎默认只绑定 loopback，Codex app-server 只使用 stdio。使用配对码保护 API 和 WebSocket。

## 页面范围

- 左侧：新建对话、Codex 对话记录、当前选中项。
- 主页面：工作目录与连接状态、对话消息、流式状态、审批卡片、输入框和停止操作。
- 移动端：侧栏通过按钮打开/关闭，聊天页面填满屏幕。
- 本项目不实现代码编辑器、文件树、终端、模型设置、Agent 编排或飞书机器人。

## 实施步骤

1. 建立新项目目录和独立 Git 仓库，新增本开发文档后再开始实现。
2. 编写本机 Python 服务：单例 Codex app-server 子进程、JSON-RPC 请求关联、notification 增量分发、审批请求转发、会话接口和配对码认证。
3. 编写网页端 API/WebSocket 客户端与状态 hook，做到连接后读取历史、选中时恢复 thread、发送消息和实时合并 delta。
4. 实现桌面双栏与手机抽屉布局，只展示对话记录和对话页面。
5. 注册 `/code/pnpm-workspace.yaml`，在 workspace 根目录执行一次 `pnpm install`；Python 依赖写入独立 `requirements.txt`。
6. 执行网页生产构建并检查改动；不新增或运行自动化测试。
7. 更新 `CHANGELOG.md`，以 `0.0.1` 记录本次功能，并在新项目 Git 仓库创建本地提交。根 `/code` 目前不是 Git 仓库，workspace 注册配置单独保留在根目录。

## 验收标准

- 新项目与已有业务仓库隔离，root workspace 可以通过 `codex-remote` filter 识别它。
- 本机 Codex CLI 可用时，网页显示 Codex 历史、能恢复 thread、能发起新对话和后续 turn。
- 回复增量通过后端 WebSocket 推送，前端收到 delta 后立即更新，不依赖轮询。
- 手机屏幕可以打开对话列表、切换对话、输入消息、看到流式回复并处理批准/拒绝提示。
- Codex 不存在、连接断开或请求失败时显示可读状态。
- API/WS 需要本机启动时生成的配对码；Codex app-server 不对网络开放。
- `pnpm --filter codex-remote build` 成功。
