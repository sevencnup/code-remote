# Android 远端用户消息即时同步

## 目标与分类

网页端从 Codex App Server 的 `item/started` 通知直接显示远端 `userMessage`；Android 目前只拉取历史记录。通知先于历史落盘时，Android 会暂时漏掉用户消息，直到下一次增量刷新。此外，旧版 App Server 的部分 item 通知不带 `threadId`，网页会用当前轮次 ID 路由，Android 原先直接丢弃了这类事件。本次对齐轮次 ID 路由，并即时显示远端消息；历史确认后按 item ID 合并，修复已有聊天同步不稳定的问题。

本次属于修复 / PATCH：恢复已有消息同步的及时性，不改变用户能完成的任务。目标版本 `0.50.1-dev.1`，Android `versionCode 310`。

## 实施步骤

1. 在 Android WebSocket `item/started` 处理器中识别 `userMessage`；缺少 `threadId` 时用当前活动轮次 ID 进行路由，为当前聊天保存并立即渲染临时消息。
2. 历史记录刷新时按服务端 item ID 去重并清理临时消息；若历史尚未落盘，临时消息继续显示，等待后续刷新。
3. 与 App 本机发送的乐观气泡去重，防止同一条消息显示两次。
4. Android 文本解析与网页一致，兼容文本片段未提供 `type` 的事件格式。
5. 更新版本和变更记录，构建独立 APK 并安装到手机核对运行状态。
6. 执行 `git diff --check` 并创建本地提交，不推送 GitHub。

## 验收标准

- 远端聊天的 `userMessage` 到达后，App 在助手操作记录/回复前立即显示。
- 历史端点晚到或短暂未包含该消息时，临时消息不会消失。
- 历史确认同一 item ID 后只显示一条；本机发送不会重复。
- APK 构建并安装成功，聊天显示正常。

## 执行记录

`0.50.1-dev.1`（versionCode 310）构建并覆盖安装成功；保留独立 APK，SHA-256 为 `ba58cebf46c234878e4b4be12bb419d57a2d2699f107b2a1caeff0311b5e6cf9`。本次未发送测试聊天。

用户随后补充网页也出现旧回复和长延迟，修复范围已扩展到两端及服务端，继续按 `CHAT_HISTORY_FRESHNESS_FIX.md` 执行并统一交付。
