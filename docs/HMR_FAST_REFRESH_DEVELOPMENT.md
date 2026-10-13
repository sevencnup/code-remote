# 页面热更新稳定性开发记录

## 目标

修复开发页面编辑后无法稳定实时更新、需要手动刷新，以及 React Fast Refresh 退化为整页重载的问题。

## 已确认原因

- 当前页面由 Vite 开发服务器提供，`@vite/client` 已注入，服务端日志有 HMR 更新记录。
- Vite 日志反复提示 `CodexRemotePage.tsx` 因导出非组件函数 `readThemePreferences` 无法 Fast Refresh。
- React 页面模块混合导出 UI 组件与主题偏好工具，导致修改时失去稳定的 React Refresh 边界。

## 实施步骤

1. 将主题偏好类型、读取/保存、颜色规范化和根样式生成函数移到独立的纯逻辑模块。
2. 调整页面与 App 的导入，让 `CodexRemotePage.tsx` 只保留 React 组件运行时导出。
3. 为主题偏好存储、规范化及 CSS 变量生成增加回归测试。
4. 更新版本记录，运行测试、生产构建和差异检查；不重启服务，不推送 GitHub，按规范创建本地提交。

## 验收标准

- `CodexRemotePage.tsx` 不再因非组件运行时导出触发 Fast Refresh invalidation。
- 主题读取、保存、颜色及背景透明度行为与改动前一致。
- 全部测试、`pnpm build` 和 `git diff --check` 通过。
