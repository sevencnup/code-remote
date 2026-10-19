# Claude 输入框高度与 Codex 图标颜色开发文档

## 目标

1. 缩小 Claude Code 模式下空输入框的默认编辑区高度，减少底部回复输入模块的空白；Codex 模式保持现有默认高度。
2. Claude Code 模式切换到 Codex 的图标使用与侧栏一致的品牌蓝。

## 范围

- Claude Code 输入框默认编辑区从 72px 调整为 52px。
- 保留拖动调整高度的能力，并分别记住 Codex 与 Claude Code 模式的手动高度。
- 只调整 Claude Code 模式下的 Codex 品牌图标，不改其他图标颜色。
- 本次属于 PATCH / 界面紧凑度与品牌颜色修正，版本更新为 `0.37.0-dev.5`；Android `versionCode` 保持不变，不生成安装包。

## 实施步骤

1. 为 Codex 与 Claude Code 分别维护输入框高度状态；Claude Code 未手动调整时使用 52px 默认值，Codex 保持 72px。
2. Claude Code 模式下，将切换到 Codex 的图标固定为现有品牌蓝 `#7188c2`。
3. 更新 Web 与 Android `versionName`、`CHANGELOG.md` 和本开发记录。
4. 运行生产构建与差异检查；不运行测试、不推送远端、不生成 APK。

## 验收标准

- Claude Code 模式空输入框比原来更紧凑；切换到 Codex 后恢复 Codex 输入框高度。
- 两种模式手动拖动后的高度分别保留。
- Claude Code 模式下 Codex 图标为 `#7188c2`。
- 生产构建与差异检查通过。

## 完成记录

- Claude Code 输入框默认编辑区调整为 52px，Codex 保持 72px；两种模式的手动调整高度分别记忆。
- Claude Code 模式切换到 Codex 时使用品牌蓝 `#7188c2`。
- Web 与 Android `versionName` 更新为 `0.37.0-dev.5`；Android `versionCode` 保持 `279`，未生成 APK。
- `pnpm build` 与 `git diff --check` 通过；构建输出既有的大型 chunk 提示，未影响生成；未新增或运行测试。
