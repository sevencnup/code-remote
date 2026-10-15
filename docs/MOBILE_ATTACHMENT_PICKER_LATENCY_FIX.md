# 移动端附件选择器打开延迟修复

## 目标

减少点击移动端聊天输入框附件按钮后，系统文件选择界面出现前的等待时间。

## 诊断记录

- 网页附件按钮由透明的原生 `input[type=file]` 覆盖，点击会直接触发 WebView 文件选择回调。
- Android 端使用 `FileChooserParams.createIntent()` 生成选择 Intent，但又额外包了一层 `Intent.createChooser()`，增加一次系统 chooser/resolver 路径。
- 选择后的图片读取、文档解析和上传发生在系统选择器返回之后，不会解释选择器出现前的 15 秒等待。
- 本次环境没有连接 Android 设备，修复后需在手机上复测实际耗时；Android 编译只验证代码和打包配置。

## 实施步骤

1. 直接启动 `FileChooserParams.createIntent()` 返回的系统选择 Intent，移除额外的 `Intent.createChooser()` 包装，避免额外一次系统 chooser/resolver 路径。
2. 保留 accept 类型、多选、读取权限和 WebView 结果回调行为。
3. 递增修复版本及 Android `versionCode`，在版本记录中只描述用户可见修复。
4. 运行 Android 编译与项目测试，检查差异并提交本地 Git 仓库；不推送远端。

## 验收标准

- Android 工程可成功编译。
- 附件选择仍由系统文件选择界面处理，并保留多选及选择结果回传。
- 真机点击后文件选择界面应更快出现；需记录设备侧复测结果，不以编译通过替代性能实测。
