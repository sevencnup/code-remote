# 网页 SSH MCP 授权请求修复

本次修正已有远程 SSH 工具无法在网页完成授权的故障，属于**修复 / PATCH**，目标版本 `0.81.3-dev.1`。

## 问题与协议

- SSH 连接及服务器权限检查正常；Codex 发起 MCP 工具调用后返回 `user rejected MCP tool call`，网页没有出现授权请求。
- App Server 目前只转发命令和文件审批，其他服务端请求直接返回“不支持”；网页和响应接口也只接受这些审批。
- 当前 Codex App Server schema 将 `mcpServer/elicitation/request` 定义为 MCP 请求，其响应为 `{ action: "accept" | "decline" | "cancel", content? }`；`item/tool/requestUserInput` 则是另一类工具提问，其响应为 `{ answers: { [questionId]: { answers: string[] } } }`。两者不能用命令审批的 `{ decision }` 回答。

## 实施步骤

1. 服务端接收并转发上述两类请求，保存请求 ID 与参数，重连后继续投递尚未处理的请求。
2. 扩展网页事件和授权卡片，明确展示来源、MCP 服务器、请求说明或问题及选项；只有用户主动选择后才回复。
3. 按请求方法构造并校验响应格式；保留已有命令和文件审批流程。拒绝和不支持的输入安全地结束请求，不静默放行。
4. 更新版本号并记录简短版本描述，完成编译检查后本地提交；不推送 GitHub。

## 边界

- 服务器设置中的权限勾选仍由 SSH MCP 工具执行时检查；网页批准只针对当前请求，不改变服务器权限配置。
- 不在聊天中输出 SSH 密码、私钥或令牌。
