# Codex Remote 后台常驻运行开发文档

## 目标

让 Codex Remote 的 Python 引擎和局域网页面由 systemd 在后台静默运行，终端关闭后服务仍保持可用；异常退出时自动重启。

## 实施步骤

1. 使用宿主机实际存在的 Node 和 Codex CLI 路径，修正 systemd unit 的启动环境。
2. 停止手动启动的旧 Vite 进程，避免与常驻服务争用 `4173` 端口。
3. 安装并启用 `codex-remote.service`，直接运行 `scripts/dev.mjs`，同时管理 Python 引擎和 Vite 前端。
4. 检查 systemd 状态、网页端口、引擎健康接口和局域网访问地址。
5. 将配对码和服务错误统一写入 journal，后台运行时通过 `journalctl -u codex-remote.service` 查看。

## 验收标准

- `systemctl is-active codex-remote.service` 返回 `active`。
- `4173` 和 `18766` 端口均由常驻服务提供。
- `http://127.0.0.1:4173/` 返回 HTTP 200。
- `http://127.0.0.1:18766/health` 返回 `{"status":"ready"}`。
- 关闭启动终端后，网页和手机仍可访问。
- 服务退出后 systemd 会自动拉起，并在 journal 中保留配对码和错误记录。

## 回滚

停止并禁用 `codex-remote.service`，移除 `/etc/systemd/system/codex-remote.service`，再按 README 的手动命令启动。
