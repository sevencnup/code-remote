# 排队消息审批能力兼容修复

## 目标与分类

修复审批模式为“从不询问”时，网页消息被 Codex 后端拒绝并滞留在“送达待核对”的问题。本次属于 PATCH：恢复已有消息发送流程，不增加新的用户能力。目标版本为 `0.8.0-dev.7`。

## 现场原因

- `turn/start` 收到 granular approval 参数，但 app-server 初始化时声明 `experimentalApi: false`。
- app-server 明确返回 `askForApproval.granular requires experimentalApi capability`，因此该条消息没有得到 turn ID。
- 队列按防止重复发送的规则将发送确认缺失的消息保留为 `unverified`；服务重启不会自动重发这种状态。现场核对到两条消息均收到上述明确的 app-server 拒绝响应。
- `codex-remote.service` 在中断的重启调用后处于停止状态，已恢复运行。

## 实施步骤

1. 将 app-server 初始化能力声明改为支持 experimental API，使其与现有 granular approval 参数一致；保持当前审批与沙箱策略不变。
2. 更新 Web/服务端版本标识到 `0.8.0-dev.7`；Android 原生包未修改，不更新 APK 版本。
3. 对照现场日志确认两条 `turn/start` 均被参数校验拒绝，之后将这两条消息恢复到可发送状态；保留原消息 ID，避免重复入队。
4. 重启网页服务加载修复，确认服务健康及两条消息已恢复为待发送。
5. 不新增或运行测试；检查差异并创建本地提交，不推送 GitHub。

## 完成标准

- `experimentalApi` 声明和发送的 granular approval 参数相符。
- 网页服务重新可访问，两条已被明确拒绝的消息不再卡在送达待核对状态。
- 用户已有的 `docs/ANDROID_APK_DEVELOPMENT.md` 修改保持不变。

## 实施结果

- 服务已加载 `0.8.0-dev.7`，`10.126.126.3:4173` 返回 HTTP 200。
- 两条消息使用原 ID 恢复发送；一条已收到送达回执并离开队列，另一条仍为普通 `pending`，没有重复送达回执。
- 未运行测试；未改 Android 原生包或 APK 版本。
