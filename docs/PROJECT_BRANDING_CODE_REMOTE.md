# Code Remote 产品名称统一

## 目标与分类

仓库与 GitHub 已更名为 `code-remote`，本次把网页、Android APP 和服务端对用户显示的旧产品名称统一为 **Code Remote**。用户完成的任务和现有连接方式不变，归类为修复 / PATCH。目标版本 `0.65.1-dev.1`，Android `versionCode 344`。

## 兼容范围

- 保留 Android `applicationId`、Kotlin 包名、偏好设置与通知通道 ID，让新版覆盖安装并继续读取原有配对数据。
- 保留 API、WebView 桥接、浏览器存储键、Python 模块名、环境变量、systemd 服务名及 tmux 会话标识，让旧客户端、会话和部署继续工作。
- 保留代表 Codex 模式、Codex CLI 或官方 Codex 图标的名称；它们指的是接入的具体工具。

## 步骤

1. 全局清点当前界面、通知、错误提示、项目介绍和资源文件中的旧产品名称，区分产品品牌与兼容标识。
2. 更新网页、Android APP、服务端与桌面启动脚本的可见品牌文案，重命名项目 Logo 资源和新 APK 文件前缀；旧 Windows 启动文件保留兼容入口。
3. 更新 README、Android 说明、项目规范标题、中英文界面文案、版本号与更新记录。
4. 检查修改范围并构建网页与 Android APP；若设备可用，覆盖安装并检查品牌入口，保留旧安装包。
5. 清理临时文件，只提交本次修改到本地 Git，不推送到远端。

## 验收

- 网页标题、侧栏和 APP 启动器、配对页、侧栏、通知都显示 Code Remote。
- Codex / Claude 模式名称保持准确，已安装 APP 的数据与旧终端会话可继续使用。
- 新 APK 名称以 `code-remote-android-` 开头，旧包不覆盖。

## 执行结果

- 网页构建和 Android `assembleDebug` 构建成功。
- 生成 `artifacts/code-remote-android-0.65.1-dev.1-debug.apk`，旧安装包未覆盖。
- 已覆盖安装至 `10.126.126.2:5555`；设备报告版本 `0.65.1-dev.1`、`versionCode 344`，APK 应用名与真机侧栏均显示 `Code Remote`。
- 已检查剩余旧标识：指代 Codex 模式或 CLI 的名称保持原义；包名、持久化数据键、服务名等兼容标识继续保留。
