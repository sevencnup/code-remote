# 网页聊天消息链接可点击

## 分类与目标

本次属于新增功能 / MINOR：用户可以直接打开 AI 回复中的链接。当前版本为 `0.41.0-dev.1`，目标版本为 `0.42.0-dev.1`。

## 实施步骤

1. 在聊天消息的普通文本和表格单元格中识别 Markdown 链接、`http(s)` 地址和 `www.` 地址。
2. 仅将 HTTP、HTTPS 和 mailto 链接转换为锚点；外部网页使用新标签打开，并设置安全的 `rel` 属性。
3. 保持围栏代码块原样展示，保留换行和原有表格渲染，为链接增加适配各主题的可见样式。
4. 执行网页生产构建，并检查修改范围与版本记录。

## 验收标准

- AI 回复中的 `[标题](https://example.com)`、`https://example.com` 和 `www.example.com` 可点击。
- 无效或不安全协议不会变成可执行链接。
- 代码块中的 URL 仍按代码显示，不会转成链接。

## Follow-up — stop auto-links before adjacent Chinese text

### Classification

PATCH: prevent ordinary Chinese text immediately following a bare URL from being included in the underlined link.

### Design and implementation steps

1. Extract inline link segmentation into a small pure helper so its boundaries can be regression-tested without rendering the full page.
2. For bare HTTP(S), mailto, and `www.` URLs, stop the link before adjacent CJK prose; keep Markdown links' explicit URL boundaries unchanged.
3. Add tests for a URL immediately followed by Chinese prose and for Markdown links with trailing prose.
4. Increment the web patch development version and add a concise changelog entry.
5. Run the focused link tests, theme tests, production build, and `git diff --check`.

### Verification

- Bare URLs now stop before adjacent Han, Hiragana, Katakana, Hangul, and full-width CJK punctuation; explicit Markdown links continue to use their closing parenthesis as the boundary.
- `node --test tests/webAssistantMessageLinks.test.mjs tests/themePreferences.test.mjs` passes (18/18).
- `pnpm build` and `git diff --check` pass.
- Version `0.45.6-dev.5` and changelog entry added.

## Follow-up — keep Markdown emphasis markers outside bare links

### Classification

PATCH: fix bare URLs in assistant replies that are wrapped in Markdown emphasis and currently remain plain text.

### Design and implementation steps

1. When trimming a bare URL, recognize a trailing emphasis marker only when the matching opening marker is immediately before the URL.
2. Keep the closing marker in the remaining message text and preserve valid URL characters when no matching Markdown marker exists.
3. Increment the web patch development version and add a concise changelog entry.
4. Review the diff and commit the change locally.
