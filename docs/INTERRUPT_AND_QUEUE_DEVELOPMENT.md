# 中断与发送状态开发文档

## 目标

修复停止按钮 503 和 Esc 无法中断的问题，并明确网页发送状态：Codex 运行期间不插队、不排队，但允许用户继续编辑下一条草稿。

## 协议依据

依据 OpenAI 官方 [Codex App Server 文档](https://developers.openai.com/codex/app-server/)：

- `turn/interrupt` 必须带 `threadId` 和当前活动 turn 的 `turnId`。
- 成功中断后，App Server 会发送状态为 `interrupted` 的 `turn/completed`。

## 实施步骤

1. 在 App Server 包装中跟踪 `turn/started`、`turn/completed` 和 `turn/start` 返回的活动 turn ID，并优先采用服务端记录的当前 turn，避免浏览器中的旧 ID 干扰中断。
2. 前端在 turn 启动阶段记录停止意图；待收到 `turn/started` 或 `turn/start` 返回的 ID 后自动发出中断请求，并展示“停止中”反馈。
3. 运行期间解除输入框禁用，允许编辑和保存下一条草稿；发送仍保持禁用，不插队也不排队。
4. 在网页监听全局 Esc，在活动 turn 期间调用中断。
5. 更新版本记录，执行构建、后端测试和差异检查，提交本地 Git 仓库。

## 验收标准

- 点击停止或按 Esc 能在启动中和回复中向 App Server 发送正确的 `threadId`、`turnId`。
- 中断请求成功时不返回 503，并最终收到 `interrupted` 状态。
- Codex 运行期间可以编辑下一条草稿，但不会插队或排队发送消息。
- `pnpm --filter codex-remote build`、后端单元测试成功，`git diff --check` 无输出。
