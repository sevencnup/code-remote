# Android APK 开发记录

## 目标

提供一个轻量 Android APK 入口，让手机先填写或扫码获取电脑上的 Codex Remote 网页地址，检测连通后再进入现有网页版并完成匹配码配对。

## 方案

- 使用原生 Android WebView 包装现有 Vite 网页，不复制聊天界面和 Codex 逻辑。
- 首次打开显示电脑地址输入页；地址通过 HTTP 请求检查网页入口是否可达。
- 地址保存到 Android `SharedPreferences`，下次启动自动加载；连接失败时允许返回修改地址。
- WebView 开启 JavaScript、DOM Storage 和局域网 HTTP 明文访问，保留网页现有匹配码和令牌流程。
- 生成独立版本的 debug APK，不覆盖历史安装包；正式发布签名后再另行构建 release APK。

## 实施步骤

1. 创建 `android/` 原生 WebView 工程和地址连接页面。
2. 配置局域网 HTTP、网络权限、返回键和连接失败恢复入口。
3. 安装本地 Android command-line tools、平台和 build-tools，构建带版本号的 APK。
4. 验证 Gradle 构建、APK 输出和网页工程现有生产构建。
5. 更新版本记录并创建本地 Git 提交。

## 验收标准

- APK 首次启动可以输入 `http://电脑局域网 IP:4173`。
- 地址不可达时不会进入空白 WebView，会显示错误和重试入口。
- 地址可达后进入现有网页配对页，匹配码流程不改变。
- 重启 APK 后自动使用上次地址；地址失效时可修改。
- APK 文件使用新文件名保存，不覆盖已有安装包。
