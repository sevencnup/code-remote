# 中断与发送状态开发文档

## 目标

修复停止按钮 503 和 Esc 无法中断的问题，并明确网页发送状态：Codex 运行期间不插队、不排队，输入框保持禁用。

## 协议依据

依据 OpenAI 官方 [Codex App Server 文档](https://developers.openai.com/codex/app-server/)：

- `turn/interrupt` 必须带 `threadId` 和当前活动 turn 的 `turnId`。
- 成功中断后，App Server 会发送状态为 `interrupted` 的 `turn/completed`。

## 实施步骤

1. 在 App Server 包装中跟踪 `turn/started`、`turn/completed` 和 `turn/start` 返回的活动 turn ID。
2. 扩展中断 API，把 turn ID 从前端传到 App Server；缺失时由后端活动 turn 映射兜底。
3. 在网页监听全局 Esc，在活动 turn 期间调用中断。
4. 更新版本记录，执行构建和差异检查，提交本地 Git 仓库。

## 验收标准

- 点击停止或按 Esc 能向 App Server 发送正确的 `threadId`、`turnId`。
- 中断请求成功时不返回 503，并最终收到 `interrupted` 状态。
- Codex 运行期间网页不会插队或排队发送消息。
- `pnpm --filter codex-remote build` 成功，`git diff --check` 无输出。
