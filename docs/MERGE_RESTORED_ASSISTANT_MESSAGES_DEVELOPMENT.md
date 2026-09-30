# 合并恢复历史中的 Codex 回复开发文档

## 目标

恢复已有 Codex thread 时，将同一个 turn 内由多个 `agentMessage` item 组成的回复合并成一个助手消息气泡，避免 `commentary` 和 `final_answer` 等阶段被错误显示为多个回复。不同 turn 仍保持独立的消息边界。

## 实施步骤

1. 在 `messagesFromThread` 中按 turn 遍历 item，并为当前 turn 累积一个助手消息。
2. 同一个 turn 内的连续或非连续 `agentMessage` 文本使用空行合并，沿用首个 item 的 ID 和 turn 时间。
3. 保留用户消息、图片恢复、空内容过滤和不同 turn 的独立性。
4. 将版本更新到 `0.0.26`，记录变更日志，并执行生产构建和差异检查。
5. 在项目仓库创建本地 Git 提交，不推送远程仓库。

## 验收标准

- 一个 turn 包含多个 `agentMessage` 时，恢复后只显示一个助手消息。
- 同一助手消息中的各段文本按空行连接，内容顺序不变。
- 不同 turn 的助手回复不会合并。
- 用户消息和图片历史显示保持不变。
- `pnpm --filter codex-remote build` 成功，`git diff --check` 无输出。
