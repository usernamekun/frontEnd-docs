# Docker 快速入门

## 安装 Docker

### 1. Windows 安装

1. 系统要求：

   - Windows 10 Pro/Enterprise/Education (64 位)
   - 开启 Hyper-V 和容器功能

2. 安装步骤：

   ```bash
   # 1. 下载 Docker Desktop
   # 2. 双击安装包
   # 3. 完成安装后重启
   ```

### 2. MacOS 安装

```bash
# 使用 Homebrew 安装
brew install --cask docker

# 或下载 Docker Desktop for Mac
```

### 3. Linux 安装

```bash
# Ubuntu
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# CentOS
sudo yum install docker-ce docker-ce-cli containerd.io
```

## 基本概念

### 1. 镜像 (Image)

- 只读模板
- 包含运行应用所需的所有内容
- 可以基于其他镜像创建

```bash
# 列出本地镜像
docker images

# 拉取镜像
docker pull nginx:latest

# 删除镜像
docker rmi nginx:latest
```

### 2. 容器 (Container)

- 镜像的运行实例
- 相互隔离
- 可以启动、停止、删除

```bash
# 创建并运行容器
docker run -d --name my-nginx nginx:latest

# 列出运行中的容器
docker ps

# 停止容器
docker stop my-nginx

# 删除容器
docker rm my-nginx
```

### 3. 仓库 (Registry)

- 存储和分发镜像的服务
- Docker Hub (公共仓库)
- 私有仓库

```bash
# 登录 Docker Hub
docker login

# 推送镜像
docker push username/image-name

# 从私有仓库拉取
docker pull registry.example.com/image-name
```

## 创建镜像

### 1. Dockerfile 基础

```dockerfile
# 基础镜像
FROM node:18-alpine

# 工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

### 2. 构建命令

```bash
# 基本构建
docker build -t my-app:1.0 .

# 使用自定义 Dockerfile
docker build -f Dockerfile.prod -t my-app:prod .

# 使用构建参数
docker build --build-arg NODE_ENV=production -t my-app .
```

### 3. 多阶段构建

```dockerfile
# 构建阶段
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

## 容器管理

### 1. 运行容器

```bash
# 基本运行
docker run nginx

# 后台运行
docker run -d nginx

# 端口映射
docker run -p 8080:80 nginx

# 挂载卷
docker run -v /host/path:/container/path nginx
```

### 2. 容器操作

```bash
# 进入容器
docker exec -it container-id bash

# 查看日志
docker logs container-id

# 查看容器信息
docker inspect container-id

# 复制文件
docker cp file.txt container-id:/path
```

### 3. 网络管理

```bash
# 创建网络
docker network create my-network

# 连接容器到网络
docker network connect my-network container-id

# 查看网络
docker network ls

# 断开网络
docker network disconnect my-network container-id
```

## 数据管理

### 1. 数据卷 (Volumes)

```bash
# 创建数据卷
docker volume create my-data

# 使用数据卷
docker run -v my-data:/app/data nginx

# 查看数据卷
docker volume ls

# 删除数据卷
docker volume rm my-data
```

### 2. 绑定挂载

```bash
# 挂载本地目录
docker run -v $(pwd):/app nginx

# 只读挂载
docker run -v $(pwd):/app:ro nginx
```

### 3. tmpfs 挂载

```bash
# 临时文件系统挂载
docker run --tmpfs /app/temp nginx
```

## 常见问题排查

### 1. 容器无法启动

```bash
# 查看详细错误
docker logs container-id

# 检查配置
docker inspect container-id

# 检查系统资源
docker system df
```

### 2. 网络问题

```bash
# 检查网络连接
docker network inspect bridge

# 测试容器网络
docker exec container-id ping host

# 查看端口映射
docker port container-id
```

### 3. 性能问题

```bash
# 查看资源使用
docker stats

# 限制资源使用
docker run --memory=512m --cpus=0.5 nginx
```
