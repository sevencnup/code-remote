# Android 侧边栏顶部模式品牌图标修复

## 目标

侧边栏顶部品牌图标跟随当前聊天模式：Codex 模式使用 Codex 图标和配色，Claude Code 模式使用 Claude 图标和配色。侧边栏的应用名称继续显示 Codex Remote。

本次属于 PATCH / 修复：现有模式切换已改变当前模式，但侧栏顶部图标仍固定为 Codex，修复显示与当前模式不一致的问题。当前开发版本已进入 `0.21.7-dev`，本次目标版本为 `0.21.7-dev.2`，Android `versionCode` 为 `179`。

## 实施步骤

1. 将侧栏顶部品牌图标保存为可刷新的视图，并根据当前模式设置图标、配色和无障碍说明。
2. 在侧栏初始化、模式切换和页面刷新时更新该图标。
3. 同步 package、服务端和 Android 版本，递增 Android `versionCode`，添加简短版本记录。
4. 构建、安装新 APK 并在手机上核对 Claude 与 Codex 模式；保留历史包。
5. 检查差异并提交本地 Git，不推送 GitHub。

## 验收标准

- Claude Code 模式下侧栏顶部显示橙色 Claude 图标。
- Codex 模式下侧栏顶部显示 Codex 配色图标。
- 新 APK 为 `0.21.7-dev.2`，`versionCode` 为 `179`。

## 执行结果

- [x] 侧栏 logo 在创建时和模式切换、顶栏刷新时均按当前模式更新图标、颜色和无障碍说明。
- [x] package、服务端和 Android 版本已同步为 `0.21.7-dev.2`；Android `versionCode` 为 `179`。
- [x] Android debug 构建成功；APK 已保存为 `artifacts/codex-remote-android-0.21.7-dev.2-debug.apk`，未覆盖历史包。
- [x] APK 已安装到手机。Claude Code 模式下打开侧栏的实机画面确认顶部显示橙色 Claude 图标；电脑端服务没有重启。
- [x] 已检查差异并完成本地 Git 提交；没有推送到 GitHub。
