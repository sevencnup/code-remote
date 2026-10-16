# Android 顶栏模式切换目标图标修复

## 目标

顶栏模式按钮显示点击后将切换到的模式图标：Codex 模式显示 Claude 图标，Claude Code 模式显示 Codex 图标。

本次属于 PATCH / 修复：模式切换能力已经存在，只修正按钮图标与其切换目标不一致的问题。目标版本为 `0.21.6-dev.4`，Android `versionCode` 为 `177`。

## 实施步骤

1. 在顶栏初始化和刷新时统一根据当前模式计算目标模式，并展示目标模式图标与无障碍说明。
2. 将 package、服务端和 Android 版本同步为 `0.21.6-dev.4`，递增 Android `versionCode`，并添加简短版本记录。
3. 构建新的 Android debug APK，安装到已连接设备并确认安装版本；保留历史 APK。
4. 检查代码差异并提交本地 Git，不推送 GitHub。

## 验收标准

- Codex 模式下按钮显示 Claude 品牌图标，并标注“切换到 Claude Code”。
- Claude Code 模式下按钮显示 Codex 品牌图标，并标注“切换到 Codex”。
- 新 APK 的版本号为 `0.21.6-dev.4`，`versionCode` 为 `177`。

## 执行结果

- [x] 初始化和后续刷新共用目标模式计算，图标与无障碍说明保持一致。
- [x] package、服务端、Android 版本已同步为 `0.21.6-dev.4`；Android `versionCode` 为 `177`。
- [x] `./gradlew :app:assembleDebug` 构建成功；新 APK 已保存为 `artifacts/codex-remote-android-0.21.6-dev.4-debug.apk`，未覆盖旧包。
- [x] APK 已安装到已连接设备；系统确认 `versionName=0.21.6-dev.4`、`versionCode=177`。当前 Codex 会话无障碍树确认顶栏操作为“切换到 Claude Code”。
- [x] 已检查差异并完成本地 Git 提交；没有推送到 GitHub。
