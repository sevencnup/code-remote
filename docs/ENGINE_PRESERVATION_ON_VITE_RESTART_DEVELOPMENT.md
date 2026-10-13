# Vite 重启期间保留 Codex 回复开发记录

## 目标

让 Vite 网页开发服务异常退出或重启时，Codex Python 后端和正在运行的回复继续工作；网页恢复连接后重新读取活动会话。

## 已确认原因

- `scripts/dev.mjs` 当前把 Vite 退出当作整个开发服务退出，并关闭由该脚本启动的 Python 后端。
- Python 后端关闭时会关闭 Codex app-server 的 stdio 进程，因此活动 turn 无法继续。
- 前端 WebSocket 已有自动重连逻辑；重新连接后会恢复活动会话并读取线程历史。

## 实施步骤

1. 将 Vite 作为独立子进程监督；Vite 退出时按递增延迟重启 Vite，保留 Python 后端。
2. Python 后端退出仍按原有逻辑关闭整体服务，让 systemd 恢复后端和 Codex app-server。
3. 正常收到 SIGINT/SIGTERM 时清除重启计时器并按顺序关闭 Vite 和由脚本创建的后端。
4. 更新版本记录，检查脚本语法、服务重连路径和差异后创建本地 Git 提交。

## 验收标准

- Vite 异常退出后，Python 后端 PID 与活动 Codex app-server 保持不变。
- Vite 恢复后，浏览器 WebSocket 自动重连并读取当前线程及活动 turn。
- Python 后端自身退出时，整体服务仍会交给 systemd 重启。
- 正常服务停止不会留下 Vite 重启计时器或子进程。
