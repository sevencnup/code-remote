# Android 图片预览修复

分类：PATCH，修复已有聊天图片和工作区图片在 Android 中无法显示。

步骤：
1. 服务端预览按图片数据签名识别实际格式，处理扩展名与内容类型不一致的图片，并支持 HEIF/AVIF 容器。
2. Android 按实际字节识别所选图片；系统解码器支持但 APP 当前无法上传的格式，转为 PNG；聊天预览也使用系统解码器兜底。
3. 为格式识别增加回归测试，编译、构建并安装 Android 包。
4. 服务端变更只在运行中的会话空闲时安全重启，健康检查通过后完成。

## 完成记录

- 服务端新增按内容签名识别 PNG、JPEG、WebP、GIF、HEIC/HEIF 与 AVIF；文件后缀不再覆盖真实格式。
- Android 上传按实际字节标注 PNG/JPEG/WebP/GIF；HEIC/HEIF、AVIF 及其他系统可解码图片会转 PNG，避免把非 PNG 数据伪装成 PNG。
- Android 聊天缩略图和大图预览在 BitmapFactory 不支持时，回退 Android ImageDecoder，并按目标尺寸采样。
- Python `test_codex_history` 17 项通过；Android `testDebugUnitTest` 8 项通过；Debug APK 构建成功。
- 版本：0.76.11-dev.1，versionCode 363。
- 服务端健康检查通过；计划在所有对话空闲后重启 `codex-remote.service`。排队服务 MainPID 需记录于部署日志。
- 验证：服务端历史/图片测试 17 项通过；Android 单元测试 8 项通过；`:app:assembleDebug` 成功。
- APK：`artifacts/code-remote-android-0.76.11-dev.1-debug.apk`，7,112,874 字节，SHA-256 `13d4a66c3b7e1d57e1a365ffe7944096e13cb48752f93d3083f4cd5f5cbf837d`。
- PJZ110 已通过 `adb install -r` 覆盖安装并确认 versionCode 363。
- 已启动新版本并确认应用进程存活，检查的 AndroidRuntime 日志无异常；截图期间原图片仍处于加载态，因此不记录为图片显示真机验收通过。
- 服务端当时有 2 个活动对话，尚未重启。待空闲部署单元：`codex-remote-image-format-activate-07611.service`，以 PID 614177 为前置校验，等待 1800 秒，重启后检查 `/health`。
- 空闲部署单元已启动并等待活动对话结束；没有立即重启服务。
