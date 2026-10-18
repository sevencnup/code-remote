# 百炼语音连接测试修复

目标版本：`0.42.1-dev.1`（修复 / PATCH）。现有“测试连接”在 Fun-ASR 返回 `task-started` 后，不发送音频就发出 `finish-task`。百炼对空音频正常返回 `EmptyAudio`，网页因此误报 502。此前保存的错误 Workspace ID 也使握手失败；用户现已提供北京业务空间的 API Host。

## 目标与边界

- 测试连接只验证 WebSocket 握手、API Key、Workspace、模型以及任务启动成功，不发送音频或聊天消息。
- 正常录音流程继续在有音频后发送 `finish-task`；不改变浏览器录音协议。
- 将百炼事件头中的已知错误码映射为安全、可操作的提示，不向浏览器转发上游原始正文或凭证。
- 使用用户提供的 API Host 更新当前服务的 Workspace ID 和地域，保留已保存的 API Key。

## 实施步骤

1. 连接测试收到 `task-started` 即成功，随后关闭 WebSocket；移除无音频的 `finish-task`。
2. 从 Fun-ASR 事件头读取错误码，针对 `EmptyAudio` 和无效 Workspace endpoint 返回明确且脱敏的提示。
3. 调整模拟百炼服务：空音频结束返回 `EmptyAudio`；更新连接测试与错误映射测试，确认测试流程不发送音频和 `finish-task`。
4. 将项目和后端版本调整到 `0.42.1-dev.1`，在 `CHANGELOG.md` 只记录更新描述。
5. 运行相关 Python 测试、前端构建和 `git diff --check`；仅提交本次代码、测试、文档和版本记录到本地仓库。
6. 将当前服务端配置中的 Workspace ID 更新为用户提供的 `llm-p5fqvkt4tvvpgve0`，地域设为 `cn-beijing`；重启 `codex-remote.service`，用已保存的 Key 实测连接，并检查网页和公网入口。

## 验收标准

- 使用正确 Workspace ID 的连接测试成功，无需发送音频。
- 空音频的真实 `EmptyAudio` 不会再导致“测试连接”误报 502。
- 录音流程仍能正常结束任务；错误提示不泄露 Key、Workspace ID 或上游原始错误正文。
