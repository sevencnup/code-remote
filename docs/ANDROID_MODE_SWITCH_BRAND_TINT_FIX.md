# Android 顶栏模式切换品牌颜色修复

## 目标

顶栏模式切换按钮按图标代表的目标品牌着色。Claude Code 模式下显示的 Codex 图标使用 Codex 配色，不随当前 Claude 模式染成橙色。

本次属于 PATCH / 修复：只修正已有模式切换按钮的品牌颜色，不改变切换行为。目标版本为 `0.21.6-dev.5`，Android `versionCode` 为 `178`。

## 实施步骤

1. 统一品牌图标的色值选择：Claude 图标使用 Claude 强调色，Codex 图标使用 Codex 强调色。
2. 同步 package、服务端和 Android 版本，递增 Android `versionCode`，添加简短版本记录。
3. 构建新 APK、安装到手机，并在 Claude Code 模式核对目标 Codex 图标颜色；保留旧包。
4. 检查差异并提交本地 Git，不推送 GitHub。

## 验收标准

- Claude Code 模式下顶栏目标 Codex 图标使用 Codex 配色，不是 Claude 橙色。
- Codex 模式下顶栏目标 Claude 图标仍使用 Claude 橙色。
- 新 APK 为 `0.21.6-dev.5`，`versionCode` 为 `178`。

## 执行结果

- [x] 顶栏图标初始化与刷新都按图标代表的品牌设置颜色；Codex 使用 `codexBrandAccent()`，Claude 使用 Claude 强调色。
- [x] package、服务端与 Android 版本已同步为 `0.21.6-dev.5`；Android `versionCode` 为 `178`。
- [x] Android debug 构建成功；APK 已保存至 `artifacts/codex-remote-android-0.21.6-dev.5-debug.apk`，旧包保留。
- [x] APK 已安装到手机。重开手机 App 后的 Claude 模式画面确认 Codex 图标为蓝色；上一版 Codex 模式画面确认 Claude 图标为橙色。没有重启电脑端服务。
- [x] 已检查差异并完成本地 Git 提交；没有推送到 GitHub。
