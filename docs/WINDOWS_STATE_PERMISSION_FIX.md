# Windows 状态目录权限修复

## 问题

Windows 后端启动时会创建共享队列 SQLite 文件。当前实现遗漏了 `os` 导入，且对 Windows 文件调用 POSIX `chmod(0o600)`；当服务由受限进程启动时，Codex app-server 还会继承该进程对用户 `.codex` 目录的只读访问令牌，最终表现为状态运行时初始化失败。

## 修复步骤

1. 恢复共享状态模块的 `os` 导入。
2. 仅在 POSIX 系统上将 SQLite 文件权限收紧为 `0600`，Windows 保留目录 ACL。
3. 增加平台权限处理回归测试。
4. 项目虚拟环境不存在时，Windows 启动器回退到 PATH 中的 Python。
5. 更新测试版本和版本记录。
6. 运行前端测试、构建、后端共享队列测试，并使用真实 Codex app-server 验证 Windows 启动。

## 验收

- `SharedStateStore` 在 Windows 可创建并打开 SQLite 状态文件。
- POSIX 系统仍会调用 `chmod(0o600)`。
- 从完全访问进程启动的 `codex app-server` 可直接使用用户原有 `.codex`。
- 项目正常启动后网页、API 和 Codex app-server 均保持连接。
