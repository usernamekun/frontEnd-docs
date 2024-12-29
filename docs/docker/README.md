# Docker 基础指南

## 什么是 Docker？

Docker 是一个开源的容器化平台，它可以让你将应用程序和它的所有依赖打包到一个标准化的单元（称为容器）中进行开发、部署和运行。

### 1. 核心概念

- **容器**：轻量级、可移植的运行环境
- **镜像**：容器的模板，包含了应用程序和依赖
- **Dockerfile**：构建镜像的脚本文件
- **Docker Hub**：镜像仓库，类似于 GitHub

### 2. 主要特点

- 轻量级：比虚拟机更轻量
- 可移植：一次构建，到处运行
- 隔离性：应用程序相互独立
- 快速部署：秒级启动容器

## 为什么使用 Docker？

### 1. 开发优势

- 统一开发环境
- 快速搭建环境
- 版本控制
- 代码复用

### 2. 部署优势

- 持续集成/部署
- 环境一致性
- 快速扩展
- 资源隔离

## 基本使用

### 1. 安装 Docker

```bash
# Ubuntu
sudo apt-get update
sudo apt-get install docker-ce

# MacOS
brew install docker

# Windows
# 下载 Docker Desktop
```

### 2. 常用命令

```bash
# 拉取镜像
docker pull node:18

# 运行容器
docker run -d -p 3000:3000 my-app

# 查看容器
docker ps

# 停止容器
docker stop container-id
```

### 3. Dockerfile 示例

```dockerfile
# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖
RUN npm install

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

## 最佳实践

### 1. 镜像优化

- 使用多阶段构建
- 最小化层数
- 使用 .dockerignore
- 选择合适的基础镜像

### 2. 安全性

- 使用非 root 用户
- 扫描安全漏洞
- 定期更新基础镜像
- 限制容器权限

### 3. 性能优化

- 合理使用缓存
- 优化构建顺序
- 减小镜像大小
- 资源限制

## 常见问题

### 1. 构建问题

- 构建失败
- 依赖问题
- 权限问题
- 网络问题

### 2. 运行问题

- 容器无法启动
- 端口冲突
- 资源不足
- 网络连接问题

### 3. 性能问题

- 容器占用资源过高
- 启动速度慢
- 存储空间不足
- 网络延迟

## 进阶主题

### 1. Docker Compose

用于定义和运行多容器应用：

```yaml
version: "3"
services:
  web:
    build: .
    ports:
      - "3000:3000"
  db:
    image: mongo
    volumes:
      - db-data:/data/db

volumes:
  db-data:
```

### 2. Docker Swarm

集群管理和编排：

```bash
# 初始化 swarm
docker swarm init

# 部署服务
docker service create --name my-app -p 3000:3000 my-image
```

### 3. 监控和日志

```bash
# 查看容器日志
docker logs container-id

# 查看容器状态
docker stats

# 查看容器详情
docker inspect container-id
```

## 相关资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Docker 安全指南](https://docs.docker.com/engine/security/)
