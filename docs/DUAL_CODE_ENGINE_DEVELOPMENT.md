# Codex 与 Claude Code 双引擎开发文档

## 目标

让用户在新建对话时选择 Codex 或 Claude Code。每条对话固定使用创建时选择的引擎，在同一聊天列表和聊天页面中查看、继续和删除；Claude Code 通过本机 CLI 运行，认证和会话数据留在本机。

## 核心决策

- Codex 仍使用现有 Codex App Server；Claude Code 使用本机 `claude` CLI 的 `--print --output-format stream-json` 流式接口。
- 引擎属于对话元数据。旧对话没有引擎字段时按 Codex 处理；新建时通过明确的引擎选项创建。
- Claude 对话使用独立 UUID 和 Claude session ID，服务端持久化会话元数据与文本历史；继续对话时通过 CLI `--resume` 恢复 session。
- CLI、认证、工作目录和进程只由本机 Python 服务管理；认证信息、环境变量和原始 CLI 输出不得发到浏览器或写入日志。
- 每轮 Claude 消息的图片与文档复制到单独的私有临时目录，只把该目录授权给对应 CLI 进程；回复结束、中断或启动失败时删除，避免并发对话相互读取附件。
- 复用现有 WebSocket 的 turn/item 通知结构，让统一聊天 hook 接收 Claude 的用户消息、回复增量、运行状态和完成状态。
- Claude CLI 不启用 `--dangerously-skip-permissions`。遵循本机 Claude Code 配置的权限策略；非交互流程遇到无法授权的工具调用时安全失败并显示可读错误。
- Codex 的模型列表与授权设置只适用于 Codex。Claude 对话使用 Claude CLI 自己的模型别名、思考 effort 等级和权限模式；默认值不传对应 CLI 参数，以遵循本机配置。
- Claude 的模型、effort 与权限模式按对话保存，并随直接发送和排队消息传给 CLI。权限模式对应 CLI 的 `manual`、`acceptEdits`、`auto`、`dontAsk`、`plan`；不包含 `bypassPermissions`。
- Claude 会话与 Codex app-server 历史分开保存，但使用同一对话列表、重命名、删除和工作目录绑定入口。
- 顶部模式切换优先恢复目标引擎最近更新的对话，同一工作目录优先；目标引擎没有已有对话时才新建。切换不会改写或删除当前对话。

## 实施步骤

1. 新增本开发文档，并按此文档执行。
2. 增加 Claude Code 服务：检测 CLI 可用性，创建/读取/重命名/删除会话，持久化会话元数据和文本历史，逐条启动或恢复 CLI 会话，解析 stream-json，推送 turn/item 通知，并支持中断。
3. 将 Claude 会话接入现有线程列表、历史读取、重命名、删除、工作目录绑定、消息发送、中断及共享排队机制；确保 Codex 对话的接口和行为不变。
4. 在新建对话入口提供 Codex 与 Claude Code 两个选项；对话列表标识引擎；Claude 对话复用现有聊天视图并显示 Claude 专属模型、effort 和权限模式选项。
5. 按语义版本规则更新 `package.json`、FastAPI 和 Android `versionName`，在 `CHANGELOG.md` 记录新增功能；本次扩展 Claude 配置能力，更新至 `0.13.0-dev.1`。未打 APK，因此不递增 Android `versionCode`。
6. 按项目惯例运行前端生产构建（不添加或运行自动化测试），检查改动与工作区，创建本地 Git 提交；不推送 GitHub。

## 验收标准

- 新建对话入口可以分别创建 Codex 和 Claude Code 对话；历史对话显示其所属引擎。
- 顶部模式切换会打开目标引擎最近更新的对话并读取其历史，同一工作目录优先；没有对应历史时创建新对话。
- Codex 对话仍由 Codex App Server 创建和恢复；Claude 对话由本机 CLI 创建和恢复，两者不会串线。
- Claude CLI 的文本回复以增量方式显示；用户消息、计时、停止、排队、重命名和删除可用。
- Claude 会话在网页或服务重启后仍能从本机 CLI session 恢复，且历史文本可读取。
- Claude 对话可分别选择模型、effort 等级和权限模式；直接发送与排队消息使用发送时保存的选项，默认模式遵循本机 CLI 配置。
- 图片与已支持的文档附件能进入 Claude 提示；历史文本持久化不保存大块 base64 图片，避免重复传输。
- CLI 不可用或运行失败时向网页显示可读错误；认证配置不会离开本机或出现在日志中。
- 不启用跳过权限检查的模式，不会触碰其他 Claude 或 Codex 进程。
- `pnpm --filter codex-remote build` 成功。
