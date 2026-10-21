# CPA Usage Shared Server Settings

## 用户可见分类与版本

- 分类：新增功能（MINOR）。连接 CPA Manager 的配置从单个浏览器扩展为同一 Codex Remote 服务下共享，其他已配对设备无需重复录入管理密钥。
- 目标版本：`0.56.0-dev.1`。

## 目标

由 Codex Remote 后端统一保存 CPA Manager 地址和管理密钥。已配对的网页客户端从后端读取连接状态，保存配置时由后端测试接口并持久化；统计查询也经由后端代理到 CPA Manager。管理密钥不返回浏览器，也不写入浏览器本地存储。

## 实施步骤

1. 将共享配置事务性地保存到已有的 `shared-state.sqlite3` 私有状态库，并能在服务重启后恢复。
2. 增加经过现有配对令牌认证的配置读取、测试并保存、清除、统计代理接口。对 CPA Manager 使用固定的 analytics 路径，校验 http(s) 地址，禁用重定向，设置请求超时和响应大小上限。
3. 前端通过 Codex Remote API 读取和保存配置，移除 CPA 管理密钥的 localStorage/direct-browser 请求路径；在配置页只显示已配置状态，不回传密钥。
4. 统计页继续显示原有时间范围、筛选和指标，但查询经 Codex Remote 后端代理，并使用同一个共享配置。
5. 更新 CHANGELOG 与 package 版本，执行类型检查/构建和相关针对性检查；检查 diff 与仓库状态，提交本地 Git 变更，不推送 GitHub。

## 安全与兼容

- 所有读写与查询接口均要求现有配对认证。
- 后端仅回传 Manager 地址与是否已配置，不回传管理密钥。
- 管理密钥保存在服务器 `shared-state.sqlite3` 中；POSIX 文件权限为 `0600`，Windows 依赖服务数据目录的 ACL。
- 已存在于浏览器 localStorage 的旧配置可在该浏览器首次加载后迁移到服务端；成功迁移后删除旧 localStorage 项。其他设备只需访问共享状态。
- 统计数据仍由 CPA-Manager-Plus Full Mode 保存；Codex Remote 仅持有 Manager 连接凭据并代理查询。

## 验收要点

- 一个浏览器保存配置后，另一台已配对设备能看到相同地址和已配置状态。
- 浏览器网络响应与 localStorage 均不包含 Manager 管理密钥。
- 已配置设备可读取统计；无效凭据可得到可读错误；清除后所有设备均看到未配置状态。
- 服务重启后共享配置仍可读。
- 前端构建及针对性后端检查通过。
