# Android WebView 剪贴板开发文档

## 目标

让 Android 安装版点击消息或代码块的“复制”后，将文本写入系统剪贴板。

## 根因与方案

安装版通过局域网 HTTP 页面运行在 Android WebView 中，网页的 Clipboard API 可能不可用，旧的 `document.execCommand('copy')` 也不能可靠地写入系统剪贴板。由 Android 原生桥接提供显式的只写剪贴板方法；网页检测到该桥接后优先调用，普通浏览器仍使用现有网页复制和兼容回退。

## 实施步骤

1. 在 Android JavaScript 桥接中加入系统剪贴板写入方法，不提供读取剪贴板的能力。
2. 扩展网页的 Android 桥接类型，并让消息与代码块复制优先使用原生方法，保留浏览器回退。
3. 更新 Android 版本号和版本记录，生成新的独立版本 APK，不覆盖历史安装包。
4. 执行网页生产构建、Android Debug APK 构建和差异检查，并提交本地 Git 仓库。

## 验收标准

- Android 安装版复制消息或代码后，可在其他应用中粘贴对应文本。
- 普通浏览器继续使用网页剪贴板实现。
- Android APK 使用新版本号和文件名，旧 APK 保留。
- 网页构建、Android Debug APK 构建成功，`git diff --check` 无输出。
