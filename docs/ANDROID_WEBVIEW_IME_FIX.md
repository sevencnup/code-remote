# Android 内置浏览器输入法修复

分类：PATCH，修复网页输入框无法唤起 Android 输入法。

原因：网页浮窗是不可获取焦点的 PopupWindow，并设置为不需要输入法，因此 WebView 内的网页输入框无法请求软键盘。

修改步骤：
1. 允许浏览器浮窗获取焦点并请求输入法。
2. 键盘弹起时让浮窗按可用窗口区域缩放，确保 WebView 输入区域跟随布局变化。
3. 构建并安装到 PJZ110，确认版本和启动日志。

完成记录：
- 浏览器 PopupWindow 已可获取焦点、请求输入法，并在输入法弹出时调整窗口尺寸。
- 版本 0.76.12-dev.1，Android versionCode 364。
- `:app:assembleDebug` 成功；APK 覆盖安装到 PJZ110，已确认 versionCode/versionName。
- SHA-256：`63a3bfb4c96d2c72b089883a9af94449211ca4ec64d173a021a3ca3894479b1b`。
- 已通过设备截图确认：内置网页输入框显示光标，Android 系统输入法已弹出；未向用户网页输入或提交内容。
