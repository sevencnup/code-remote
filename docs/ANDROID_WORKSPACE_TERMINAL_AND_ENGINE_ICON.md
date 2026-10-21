# Android 文件树终端入口与模式图标

## 分类与版本

- 分类：新增功能 / MINOR。Android 文件树此前不能把所选目录带入终端；本次补上该操作，并使“加入输入框”菜单图标跟随 Codex / Claude 模式。
- 目标版本：`0.60.0-dev.2`，Android `versionCode 323`。
- 更新记录：支持从 Android 文件树把目录加入终端，并按当前模式显示输入框入口图标。

## 实施步骤

1. 在 Android 文件夹长按菜单添加“加入终端”。文件和文件夹的“加入输入框”使用当前模式品牌图标。
2. 复用终端连接返回的 shell 类型，生成对应 shell 的安全 `cd` 命令；打开终端并将命令放进输入行，等待用户确认发送，不自动执行。
3. 支持终端尚在连接时暂存所选目录；终端关闭时清除待处理路径。
4. 更新英文界面文案、版本号、更新记录和本开发记录。
5. 构建 APK，安装至已连接设备并核对包版本；不运行独立测试套件。
6. 检查差异并创建本地提交，不推送 GitHub。

## 验收标准

- 仅文件夹菜单显示“加入终端”；点击后打开终端并预填切换到该目录的命令，命令不自动运行。
- 终端连接完成后再加入目录，也能把命令插入终端输入行。
- “加入输入框”在 Codex 与 Claude 模式分别显示相应品牌图标。
- Android Debug APK 构建成功并安装，设备版本信息与目标版本一致。

## 实施结果

- Android 文件夹长按菜单新增“加入终端”。命令按 PowerShell、CMD 或 POSIX shell 语法转义，终端连接完成后放入命令输入行，不会自动执行；连接中的目录选择会暂存，关闭终端时清除。
- “加入输入框”菜单项使用当前 Codex 或 Claude 品牌图标及对应主题颜色；新增英文文案 `Add to terminal`。
- `./gradlew :app:assembleDebug` 构建成功，未运行独立测试套件。
- APK：`artifacts/codex-remote-android-0.60.0-dev.2-debug.apk`，SHA-256：`cdac56f4948ccbfdaa894b40a8fbeefb6d58a7b7c2a0e186399a90f1300e0409`。
- 已通过 `adb install -r` 安装到 PJZ110；Package Manager 确认 `0.60.0-dev.2` / `versionCode 323`。原应用数据保留。
