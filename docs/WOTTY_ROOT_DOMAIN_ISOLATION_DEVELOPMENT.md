# YHK 主域名隔离开发文档

## 目标

修复 YHK 上 Nginx 未匹配 `wotty.app` 时错误落入 note 项目的默认虚拟主机问题，确保 note 只响应其自身域名。

## 开发步骤

1. 记录 YHK 当前 Nginx 配置、监听状态、容器状态和 note 站点响应。
2. 在 YHK 保留原配置备份，新增 `wotty.app` 的显式隔离规则；不修改 note 容器和 note 的代理目标。
3. 执行 `nginx -t`，通过后热加载 Nginx。
4. 分别使用 `wotty.app` 与 `note.sevencn.com` 的 Host/SNI 验证响应，确认主域名不再返回 note 页面，note 域名仍正常。

## 验证标准

- Nginx 配置测试通过并保持运行。
- `wotty.app` 不再命中 `127.0.0.1:56326`。
- `note.sevencn.com` 仍返回 note 项目页面。
- note 容器保持原运行状态。

## 回滚

删除本次新增的主域名隔离配置，执行 `nginx -t` 并热加载 Nginx；原 note 配置和备份文件保留。
