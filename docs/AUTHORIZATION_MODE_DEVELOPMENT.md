# 授权模式选择开发文档

## 目标

在网页输入框工具栏提供 Codex 授权模式选择，并让授权卡片和输入框保持同一水平宽度。

## 协议依据

依据 OpenAI 官方 [Codex App Server 文档](https://developers.openai.com/codex/app-server/)：

- `thread/start` 和 `turn/start` 支持 `approvalPolicy`。
- 当前本机 App Server 返回的枚举为 `on-request`、`untrusted`、`never`；网页必须使用这组连字符值。
- `thread/start.sandbox` 与 `turn/start.sandboxPolicy.type` 支持 `workspace-write` 和 `danger-full-access`。

网页选项映射如下：

| 网页选项 | approvalPolicy | sandboxPolicy |
| --- | --- | --- |
| 请求批准 | `on-request` | `workspace-write` |
| 帮我批准 | `untrusted` | `workspace-write` |
| 完全访问权限 | `never` | `danger-full-access` |

## 实施步骤

1. 扩展 FastAPI 请求模型、Codex App Server 包装和前端客户端，转发授权及沙箱策略。
2. 在输入框工具栏增加授权模式菜单，发送新消息时携带当前选择。
3. 将授权卡片宽度、居中方式调整为与输入框一致，并覆盖移动端布局。
4. 更新版本记录，执行生产构建和差异检查，提交本地 Git 仓库。

## 验收标准

- 输入框能选择三种授权模式，当前模式显示在工具栏。
- 新建线程和后续 turn 都使用当前授权模式。
- 选择“完全访问权限”时同时使用 `never` 与 `danger-full-access`。
- 授权卡片左右边缘与输入框对齐，桌面和手机布局均不偏移。
- `pnpm --filter codex-remote build` 成功，`git diff --check` 无输出。
