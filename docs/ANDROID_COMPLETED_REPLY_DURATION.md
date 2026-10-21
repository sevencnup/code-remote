# Android 已完成回复耗时

## 变更分类与版本

- 分类：PATCH / 补齐 Android 已有聊天消息的回复耗时展示。
- 目标版本：`0.56.2-dev.1`，Android `versionCode 317`。
- 版本记录：在 Android 已完成的 AI 回复旁显示回复用时。

## 目标行为

- Android 已完成的 AI 回复显示与网页版一致的“用时 X秒 / X分X秒 / X小时X分X秒”。
- 回复尚未结束或没有有效耗时数据时不显示该字段。

## 实施步骤

1. 使用已传入 Android 消息对象的 `_duration` 字段，在助手消息元信息栏渲染格式化耗时。
2. 更新 PATCH 版本号和变更记录。
3. 执行 Kotlin 编译及 Android Debug APK 构建；不运行独立测试套件。

## 实施结果

- Android 已完成的助手消息会在名称和时间旁显示回复耗时；中英文界面分别使用对应的时间单位。
- 没有有效耗时（`durationMs <= 0`）时不显示；生成中的回复尚无有效耗时，因此不会显示。
- `./gradlew :app:assembleDebug` 构建成功；未运行独立测试套件。
- APK：`artifacts/codex-remote-android-0.56.2-dev.1-debug.apk`。
