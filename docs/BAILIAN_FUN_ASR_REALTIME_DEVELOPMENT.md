# 百炼 Fun-ASR 实时语音识别适配开发记录

目标版本：`0.40.3-dev.1`（修复 / PATCH）。现有语音输入使用了当前账号未授权的 Qwen Omni 会话协议，导致连接测试和语音识别不可用；本次修复为已授权的 Fun-ASR 实时识别协议。

## 目标与边界

- 将网页版语音输入和“测试连接”切换为 Fun-ASR-Realtime WebSocket API，默认模型为 `fun-asr-realtime-2026-02-28`。
- 继续由浏览器采集单声道 16 kHz PCM16 音频，经已配对认证的 Codex Remote 后端转发；不自动发送聊天消息，也不触发模型生成回复。
- API Key 只留在服务端；浏览器现有的 hello、partial/completed、commit/cancel 协议保持不变。
- 将原来默认的 Qwen Omni / Qwen ASR 配置迁移到 Fun-ASR；旧版转写模型字段仅为兼容旧请求而接收，不再用于上游会话。

## 官方协议依据

- [Fun-ASR WebSocket 接入指南](https://docs.bailian.console.aliyun.com/zh/model-studio/fun-asr-realtime-websocket-api)
- [Fun-ASR 客户端事件](https://docs.bailian.console.aliyun.com/zh/model-studio/fun-asr-client-events)
- [Fun-ASR 服务端事件](https://docs.bailian.console.aliyun.com/zh/model-studio/fun-asr-server-events)
- 连接地址为 Workspace 专属地域域名下的 `/api-ws/v1/inference`；握手使用 Bearer API Key。
- 客户端发送 `run-task`（ASR、PCM、16 kHz、duplex），等待 `task-started` 后才发送二进制音频；停止录音发送 `finish-task`。
- 识别结果来自 `result-generated` 的 `payload.output.sentence`；按 `sentence_id` 处理中间修订与句子完成，`task-finished` 后返回最终文本。`task-failed` 需转换为不泄露原始上游细节的提示。

## 实施步骤

1. 将服务端上游地址和事件协议改为 Fun-ASR；生成 UUID task ID，添加 Workspace 请求头，发送 `run-task`、二进制 PCM、`finish-task`，并实现任务启动、结果和失败事件解析。
2. 保留浏览器到后端的既有 WebSocket 协议；接收 Fun-ASR 中间/终句结果时发 partial，收到 `task-finished` 后发 completed；取消时关闭上游任务和连接。
3. 将服务端、项目设置页和连接测试默认模型改为 `fun-asr-realtime-2026-02-28`；去除不再适用的独立转写模型设置，并兼容接受旧客户端字段。加载到旧 Qwen 默认值时解析为 Fun-ASR 默认值。
4. 更新单元测试覆盖 URL/鉴权、run-task、等待 task-started、二进制 PCM、sentence_id 结果合并、finish-task、取消和错误脱敏；更新设置存储/API 迁移测试。
5. 更新 `CHANGELOG.md` 与项目版本至 `0.40.2-dev.1`，运行相关 Python 测试、前端测试、`pnpm build` 和 `git diff --check`。
6. 仅提交本次涉及的文档、前后端代码、测试与版本记录；不推送远端、不重启正在运行的线上服务、不生成 APK。

## 验收标准

- 连接测试通过真实 Fun-ASR WebSocket 并确认任务成功启动，不发送音频，随后正常结束并关闭连接。
- 录音数据以二进制 PCM 发送；UI 继续收到 partial/completed，完成文本只插入输入框且不自动发送。
- Fun-ASR 失败事件映射为安全、可操作的错误，不向浏览器转发原始错误正文或凭证。
- 旧配置里原默认 Qwen 模型不会再被提交至百炼；用户的 API Key、Workspace 和地域不会丢失。
