# 宿主机常驻服务开发文档

## 目标

使用宿主机的 Node、Python 和 Codex CLI 运行 Codex Remote，并由 systemd 持续管理服务。

## 开发步骤

1. 新增 systemd 服务配置，工作目录固定为 `/code`。
2. 由 `/usr/local/bin/node /code/code-remote/scripts/dev.mjs` 直接启动 Python 引擎和 Vite 前端，避免 systemd 启动时触发 workspace 依赖安装。
3. 加载宿主机 `/etc/environment` 中已有的 Codex 凭据变量，再配置 `HOME=/root` 和 `CODEX_REMOTE_WORKSPACE=/code`，复用宿主机 Codex 登录状态，并将新对话工作区设为应用仓库的同级目录。
4. 设置异常自动重启，并通过 `KillMode=control-group` 一并回收子进程。
5. 启动服务后检查 `4173` 网页端口、`18766` 引擎健康接口和外部地址。

## 验证标准

- `systemctl is-active codex-remote` 返回 `active`。
- `http://127.0.0.1:4173/` 返回 HTTP 200。
- `http://127.0.0.1:18766/health` 返回 `{"status":"ready"}`。
- 内网或公网地址可以打开网页并完成配对。
- 后台运行时通过 `journalctl -u codex-remote.service` 查看配对码和服务日志。

## 回滚

停止并禁用 `codex-remote.service`，移除服务链接，恢复手动启动方式。
