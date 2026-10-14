# 移动浏览器键盘上方留白修复

## 目标与分类

修复手机浏览器打开软键盘后，聊天输入框停在页面中段、键盘上方留下大块空白的问题。本次属于 PATCH：修正已有移动端输入布局，目标版本为 `0.8.0-dev.9`。

## 现场原因

- 用户截图来自 Android Chrome，不是项目内的 Android WebView。
- 现有视口补偿只处理带原生桥接的 WebView 平移情况；普通浏览器只使用 `visualViewport.height`。
- Chrome 在输入框聚焦时还会通过 `visualViewport.offsetTop` 平移可视区域，单用高度会让页面可见底部少算这段偏移；当前代码也没有监听 `visualViewport.scroll`。

## 实施步骤

1. 输入区聚焦且移动浏览器可视区域发生平移时，使用 `visualViewport.height + offsetTop` 对齐页面底部；保留 Android WebView 现有处理。
2. 监听可视区域滚动以及输入区焦点变化，及时同步高度。
3. 更新 Web 版本、Android `versionName` 和变更记录；不修改 Android 原生代码、不生成 APK、不递增 `versionCode`。
4. 构建网页资源供当前 preview 服务使用，不重启管理 Codex 进程的服务。
5. 不新增或运行测试；检查差异并只提交本次文件，不推送 GitHub。

## 完成标准

- 手机浏览器软键盘弹出并聚焦输入框时，输入框贴近键盘上沿，没有大片空白。
- 键盘收起或输入区失焦后，页面高度回到当前可视视口。
- 保留用户已有的 `docs/ANDROID_APK_DEVELOPMENT.md` 修改。

## 实施结果

- 移动浏览器在输入区聚焦并平移可视区域时，页面高度按可视区域底部同步；增加可视区域滚动和输入区焦点事件监听。
- `pnpm --filter codex-remote build` 成功，当前 preview 返回 HTTP 200，且提供的 `index.html` 与本次构建产物一致。
- 未运行测试，未在用户手机上复验；未生成 APK，Android `versionCode` 保持不变。
