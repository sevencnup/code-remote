# Claude Code 流式启动修复

## 目标与分类

修复网页发送 Claude Code 消息后立即失败的问题。此修改恢复已有的 Claude 对话能力，属于 PATCH，目标版本为 `0.14.1-dev.1`。

## 现场结论

- 本机 Claude CLI 为 `2.1.247`；其 `--print --output-format stream-json` 组合要求同时传入 `--verbose`。当前服务遗漏该参数，CLI 在发起模型请求前退出，stderr 提示：`When using --print, --output-format=stream-json requires --verbose`。
- 使用 `--verbose` 且不保存会话的独立诊断请求成功；对原历史会话使用 `--resume --fork-session --no-session-persistence` 的诊断请求也成功。两次 CLI 均报告模型为 `claude-sonnet-5`。本机设置的默认模型别名为 `sonnet`。网页是否对失败请求另选模型存于浏览器本地偏好，服务端无法从失败记录反推。
- 当前服务丢弃 stderr，所有非零退出都显示为登录或权限问题，无法区分 CLI 启动失败和模型请求失败。

## 实施步骤

1. 在 Claude CLI 的流式调用参数中加入 `--verbose`。
2. 按是否收到 CLI 初始化事件区分启动失败与请求失败，避免把参数错误误报成登录或权限问题；仍不向网页或日志输出可能包含私人内容的 stderr。
3. 更新版本标识和简短版本记录；本轮不创建 Android 安装包，保留现有 `versionCode`。
4. 只审查修改与运行状态，不新增或运行实现测试；创建本地提交，不推送 GitHub。保留用户现有的 `docs/ANDROID_APK_DEVELOPMENT.md` 修改。

## 生效条件

Python 服务加载新代码后，Claude 对话才能使用修复。当前服务运行在对话期间，重启会断开已有对话；完成代码后记录是否已经加载，避免无提示地重启。

## 实施记录

- 已添加 CLI 必需的 `--verbose` 参数，并区分 CLI 初始化失败和模型请求失败的提示；stderr 继续留在本机且不输出。
- 已更新版本标识和版本记录。原生 Android 代码及安装包未改，`versionCode` 维持原值。
- `git diff --check` 无格式问题。未新增或运行实现测试。
- 运行中的 `codex-remote.service` 使用 `KillMode=control-group`，当前 Codex 对话进程也在同一服务组内；本轮不直接重启，以免中断当前对话。修复需在安全重启后生效。
