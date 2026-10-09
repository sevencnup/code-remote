# 本机数据盘迁移开发文档

## 目标

将本机的大型项目、构建依赖缓存和 Docker/containerd 数据迁移到 `/mnt/data`，释放系统盘空间，同时保留原路径兼容性。

## 迁移范围

1. 大型且不承担当前工作区的 `/code` 项目目录。
2. `/root/.gradle`，通过原路径软链接兼容 Gradle。
3. `/root/.local/share/pnpm`，保留 pnpm 原 store 路径兼容性。
4. `/var/lib/docker` 与 `/var/lib/containerd`，停服务后迁移并恢复 Docker/containerd 配置。
5. 保留当前 `/code/codex-remote`、当前 VS Code 活动版本和业务源码，不在活动会话中移动。

## 开发步骤

1. 记录新磁盘挂载状态、源目录大小、活动进程、Docker 容器和卷信息。
2. 在 `/mnt/data` 创建对应目标目录，使用保留权限、硬链接和扩展属性的方式复制数据。
3. 校验源目标大小和关键文件后，停止需要短暂停机的 Gradle/Docker 服务。
4. 为原路径建立软链接或更新服务配置，使项目和工具继续使用原路径。
5. 启动并验证 Docker/containerd、项目路径、Gradle、pnpm 和当前工作区。
6. 验证通过后保留可回滚备份；不直接删除源数据，确认稳定后再清理。

## 验证标准

- `/mnt/data` 仍正常挂载，系统盘使用率明显下降。
- 原路径仍可访问，Git 仓库和项目文件完整。
- Docker/containerd 正常运行，容器、卷和镜像均可见。
- pnpm、Gradle 可以从原路径工作。
- 当前 Codex/VS Code 工作区不被中断。

## 回滚

停止相关服务，移除软链接或恢复原配置，恢复原目录和 Docker/containerd 数据根；确认服务正常后再处理迁移副本。
