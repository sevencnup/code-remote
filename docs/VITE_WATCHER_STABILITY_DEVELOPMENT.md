# 网页开发服务文件监听稳定性修复

## 目标

避免构建 Android APK 或改动非网页文件时触发 Vite 文件监听资源耗尽、服务重启和聊天中断。

## 已确认原因

- `4173` 目前由 Vite 开发服务提供，进程由 `codex-remote.service` 常驻管理。
- 系统日志显示 Vite 在监听 `docs/`、`android/app/build/` 新文件时抛出 `ENOSPC: System limit for number of file watchers reached`，并在 03:44、03:50、03:51 UTC 反复退出。
- `scripts/dev.mjs` 在 Vite 退出时会连同本机 Codex 引擎一起停止；systemd 随后重启整个服务，导致浏览器重载及进行中的对话断开。

## 实施步骤

1. 在 Vite 开发服务中排除 Android 构建、安装包、文档和其他非网页目录的文件监听，保留网页源码与静态资源的热更新。
2. 检查开发服务在构建 APK/生成 Android 中间文件时不再因监听上限退出；如有必要，隔离 Vite 子进程退出与 Codex 引擎的生命周期。
3. 运行网页构建与相关测试，核对服务日志和进程稳定性；更新版本记录并仅做本地 Git 提交。

## 验收标准

- Android 构建期间 4173 服务的进程不重启，网页连接保持可用。
- 网页源码的开发热更新仍可正常工作。
- 已有本地改动与安装包不丢失，不因修复动作主动中断运行中的 Codex 回复。
