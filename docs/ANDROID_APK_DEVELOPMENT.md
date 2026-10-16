# Android APK 开发记录

## 目标

Codex Remote Android 客户端使用 Kotlin 原生界面，按手机浏览器移动端的紧凑布局实现聊天与工作区功能。APP 不使用 WebView 绘制应用界面，原生 `EditText` 接受 Android 系统输入法输入。

## 架构

- Kotlin Activity 和 Android 原生 View 绘制页面。
- `RemoteApi.kt` 复用电脑端 Codex Remote 的配对、HTTP API 和 WebSocket 协议。
- 首次输入电脑地址和配对码；地址、令牌、会话草稿、模型偏好及主题保存在应用私有偏好设置。
- 文件选择使用 Android 系统文件选择器；消息编辑和终端输入使用系统原生编辑控件。
- APK 每次构建使用独立版本文件名，保留旧包。

## 构建与安装

```bash
cd android
./gradlew assembleDebug
```

构建产物位于 `android/app/build/outputs/apk/debug/`。覆盖安装时使用 `adb install -r <apk>`，保留已有配对数据和偏好。

## 页面能力

Android 客户端复用现有后端，实现 Codex / Claude 对话、会话搜索和管理、增量历史、排队消息、模型与权限选择、附件、文件树和编辑、终端、审批、通知、主题、字号、剪贴板和系统返回导航。
