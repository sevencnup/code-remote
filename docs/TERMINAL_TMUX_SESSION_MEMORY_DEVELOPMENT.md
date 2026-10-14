# tmux 终端会话记忆开发文档

## 目标

让已有聊天各自拥有独立的 tmux shell 会话。关闭终端浮层、网页断线或 Python 后端重启后，再次打开同一聊天仍可接回原 shell。

## 生命周期与资源限制

- 使用聊天 ID 的 SHA-256 摘要生成 tmux 会话名，不把原始 ID 放入 shell 命令或会话名。
- 关闭浮层、WebSocket 断开和后端正常重启只分离 tmux 客户端，不结束 shell；电脑重启或 tmux server 被停止时会话结束。
- 输入 `exit` 会结束当前 shell。无客户端连接满 30 分钟的会话由后台清理；最多保留 10 个未连接会话，超出时清理最久未使用者。
- tmux 窗口历史限制为 5,000 行；xterm.js 前端已有 5,000 行滚动缓冲，不按会话累计前端 DOM。
- 没有聊天 ID 时保持临时终端。Windows 原生终端继续使用原有临时进程；POSIX 有聊天 ID 时需要系统安装 tmux，缺少时显示明确错误。

## 实施步骤

1. 将当前聊天 ID 从前端传给终端 WebSocket，并在后端按摘要创建或重新连接 tmux session。
2. 调整 POSIX 终端关闭逻辑为分离 tmux 客户端；保留 Windows 和无聊天 ID 时的现有临时 shell 行为。
3. 为 tmux session 设置受限滚动历史、最后使用时间，并增加后台空闲及数量清理。
4. 增加独立的 systemd tmux 服务，使系统服务重启 Codex Remote 时不会一并杀掉 tmux server；更新 systemd 安装步骤及 Linux/macOS 的 tmux 系统依赖说明。
5. 更新原终端开发文档、`CHANGELOG.md`、`package.json`、FastAPI 版本及 Android `versionName`；Android `versionCode` 递增 1。本次属于新增功能，从 `0.6.0-dev.1` 升到 `0.7.0-dev.1`。
6. 执行 `pnpm build` 和 `git diff --check`；不新增或运行测试。
7. 本地提交本次相关文件，不推送 GitHub；保留已有的 Android 开发文档修改。

## 验收标准

- 同一聊天关闭并重新打开终端后仍连接原 tmux shell；不同聊天使用不同会话。
- Python 后端重启后，tmux session 仍可重新连接；电脑重启后会话消失。
- `exit`、30 分钟空闲和超过未连接会话上限时均能清理会话。
- 页面只保留 xterm.js 当前 5,000 行缓冲；不会因为切换聊天累计多个终端页面。
- tmux 未安装时返回可理解的安装提示；Windows 和无聊天 ID 的现有终端仍可使用。
- 生产构建和差异检查通过。
