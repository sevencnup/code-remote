# systemd 服务代理环境修复开发文档

## 目标

让 `codex-remote.service` 启动的网页专用 Codex App Server 使用本机代理，避免模型供应商地址直连时因 TLS 证书异常而长期停留在“正在思考”。

## 约束

- 代理配置只作用于 `codex-remote.service`，不修改系统全局网络环境。
- 服务模板只声明可选的专用环境文件，不把机器特定的代理地址写死在仓库代码中。
- 保留现有工作目录、端口、重启策略和其他服务参数。
- 只重启 `codex-remote.service`，不处理其他 Codex 或业务进程。

## 实施步骤

1. 在 systemd 服务模板中加载可选的 `/etc/codex-remote.env`。
2. 在当前机器创建专用环境文件，配置 HTTP/HTTPS 代理及本机地址绕过规则。
3. 同步已安装的服务单元，重新加载 systemd 并重启 `codex-remote.service`。
4. 验证网页、后端健康检查、服务状态以及网页专用 Codex 子进程的代理环境。
5. 更新版本记录并创建本地 Git 提交，不推送 GitHub。

## 验收标准

- 服务启动成功，网页端口与后端健康检查正常。
- 网页专用 Codex App Server 进程包含 HTTP/HTTPS 代理环境。
- 本机回环地址不会经过代理。
- 不影响其他运行中的 Codex 和业务进程。
