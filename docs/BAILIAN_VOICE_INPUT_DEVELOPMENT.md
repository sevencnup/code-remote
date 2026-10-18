# 阿里云百炼语音输入开发说明

目标版本：`0.37.0-dev.1`（新增功能 / MINOR）。

## 目标

在 React 网页聊天输入框中增加语音听写：用户主动开始/结束录音，界面显示识别中的文字，最终转写结果插入输入框光标处；不自动发送，也不触发百炼生成回答或语音。

本轮范围为桌面网页和支持麦克风的手机浏览器；不改独立原生 Kotlin 聊天界面。

## 方案与边界

- 浏览器请求麦克风后通过 Web Audio 将输入重采样为单声道 16 kHz、PCM16 little-endian；通过已配对认证的 WebSocket 发送至 Codex Remote 后端。
- 后端优先从服务端项目设置读取百炼配置，环境变量 `DASHSCOPE_API_KEY`、`BAILIAN_WORKSPACE_ID`、`BAILIAN_REGION`（默认 `cn-beijing`）、`BAILIAN_REALTIME_MODEL`（默认 `qwen3.8-omni-flash-realtime`）和 `BAILIAN_TRANSCRIPTION_MODEL`（默认 `qwen3-asr-flash-realtime`）作为回退。密钥不能下发至浏览器或写入日志。
- 后端为听写提供独立 WebSocket 端点，不复用会自动驱动对话的 `/api/v1/codex/ws`。
- 百炼会话启用 `qwen3-asr-flash-realtime` 输入转写并使用手动轮次模式。客户端停止录音后提交 `input_audio_buffer.commit`；只转发输入音频转写 partial/completed 事件，绝不发送 `response.create`。
- 提供取消、连接失败、权限拒绝、未配置凭证、空识别等状态；任何结束路径都停止浏览器音轨并关闭 WebSocket。
- 浏览器麦克风要求安全上下文（HTTPS 或 localhost）；不安全来源需明确提示用户，不能静默失败。

## 实施步骤

1. 新增百炼实时听写适配器，支持服务端 WebSocket 鉴权、手动模式配置、音频追加/提交、转写事件解析及资源关闭，并提供可注入连接器以便离线单测。
2. 在 FastAPI 添加配对令牌校验的听写 WebSocket 路由；采用首条 hello 消息认证，校验音频消息与控制消息，不把百炼凭证返回客户端。
3. 在前端客户端增加听写 WebSocket 封装；增加 AudioWorklet 音频采集/重采样模块，处理服务端 partial/completed/error 事件和连接清理。
4. 在聊天输入框操作区增加麦克风按钮及录音/转写状态；转写完成后插入光标处，不覆盖已有输入、不自动提交；支持取消。
5. 补充后端协议与认证单测、更新 `CHANGELOG.md` 和项目版本号至 `0.37.0-dev.1`。
6. 执行相关 Python 测试、`pnpm build` 与 `git diff --check`；只提交本次相关文件，不推送远端，不生成 Android APK。

## 验收标准

- 浏览器录音时，转写 partial 可显示；停止录音后最终文本被插入当前编辑位置，已有文字保留。
- 整个流程不发送聊天消息、不调用 Codex/Claude、不请求百炼生成回复或音频。
- 缺少配对令牌、百炼配置、麦克风权限或安全上下文时能显示明确错误；取消或断连后不残留麦克风占用和后台任务。
- 服务商密钥只在后端环境中读取；日志不含密钥、音频或转写正文。
- 单测、前端生产构建和差异检查通过。
