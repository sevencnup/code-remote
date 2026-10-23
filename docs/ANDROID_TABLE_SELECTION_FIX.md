# Android 表格文字选择修复

分类：PATCH，修复现有 Markdown 表格只能整行选择的问题。

步骤：
1. 使用现有 CommonMark 语法树识别表格，保留普通正文和代码块行为。
2. 表格使用原生布局与可选择的单元格 TextView，保留行背景、边框、链接、行内格式及对齐。
3. 增加复制完整表格入口；长表格横向滚动，文字可在单元格内精确选择。
4. 编译验证并本地提交，不推送 GitHub。本次不安装。

限制：Android 原生文字选择不能跨多个 TextView 拖选；跨单元格内容可通过复制表格获取。

完成记录：
- 已替换聊天正文顶层表格的整行绘制，改为可选择文字的原生单元格，提供整表复制。
- 版本：0.76.10-dev.1，versionCode 362。
- `:app:compileDebugKotlin` 编译通过，`git diff --check` 通过。
- 未生成 APK、未安装、未做真机交互验证。

## 2026-10-23 安装计划

用户已要求安装：构建 0.76.10-dev.1，保留独立版本 APK，再覆盖安装到现有 PJZ110 手机；检查安装版本和启动情况，记录实际验证结果。

安装结果：
- `:app:assembleDebug` 成功；独立保存 `artifacts/code-remote-android-0.76.10-dev.1-debug.apk`（7,110,222 字节）。
- APK SHA-256：`8e0497cd4afeb9b3ebf100a7335bb6b7316ff2095a70f789a0c5bd55ac2b2f19`。
- `adb install -r` 成功，PJZ110 已确认 `versionName=0.76.10-dev.1`、`versionCode=362`。
- 已启动应用并确认进程存活，检查的 AndroidRuntime 日志片段无错误。界面处于应用切换中，未继续操作或完成表格拖选真机验证。
- 本次未启动额外调试服务；临时截图已清理。
