# 移除 Android 离线语音输入开发记录

## 变更分类与版本

- 分类：新增功能的移除，属于不兼容变更；项目仍处于 `0.x` 阶段，按中版本递增处理。
- 目标版本：`0.55.0-dev.2`，Android `versionCode` 递增到 `313`。
- 版本记录：移除 Android 离线语音输入。

## 目标

移除 Android App 内置的 sherpa-onnx 离线语音识别功能及其约 160 MB 的模型资产，恢复为使用系统输入法提供语音输入。保留网页版阿里云百炼语音输入，它与 Android 本地模型无关。

## 实施步骤

1. 移除聊天输入框中的离线语音按钮，以及录音状态、权限请求、识别控制器和生命周期清理代码。
2. 删除 sherpa-onnx 依赖、模型资源、麦克风权限及仅供 ONNX 模型使用的打包设置和 JitPack 仓库。
3. 清理 Android 英文文案、图标和 README 中对该功能的说明。
4. 更新版本号与变更记录。
5. 搜索残留引用并构建 Android debug APK，确认项目仍可编译；不安装设备，不使用麦克风测试。

## 验收标准

- Android 输入框不再显示离线语音按钮，也不再请求麦克风权限。
- sherpa-onnx 原生库与大型识别模型不再进入 APK。
- 网页版百炼语音输入不受影响。
- Android debug 构建成功。

## 完成情况

- 已移除 Android 输入框麦克风按钮、录音控制器、麦克风权限、sherpa-onnx 依赖、JitPack 仓库引用及模型/图标资源。
- Android README 已删除离线语音输入说明；保留历史版本记录和网页版百炼语音功能。
- `:app:assembleDebug` 构建成功，APK 约 `6.8 MB`。检查 APK 内容未发现 sherpa/ONNX 库或模型文件；Manifest 权限列表中没有 `RECORD_AUDIO`。
- APK：`artifacts/codex-remote-android-0.55.0-dev.2-debug.apk`。
- 当前没有连接的 Android 设备，未能安装到手机。
