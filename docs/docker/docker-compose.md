# Docker Compose 使用指南

## 什么是 Docker Compose

Docker Compose 是一个用于定义和运行多容器 Docker 应用程序的工具。通过 Compose，你可以使用 YAML 文件来配置应用程序的服务。

## 安装

### 1. Linux 安装

```bash
# 下载
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 2. MacOS/Windows

Docker Desktop 已包含 Docker Compose，无需单独安装。

## 基本使用

### 1. docker-compose.yml 示例

```yaml
version: "3.8"

services:
  # Web 应用服务
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  # 数据库服务
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret

  # Redis 缓存服务
  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 2. 常用命令

```bash
# 启动服务
docker-compose up

# 后台启动
docker-compose up -d

# 停止服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs
```

## 配置详解

### 1. 服务配置

```yaml
services:
  web:
    # 构建配置
    build:
      context: .
      dockerfile: Dockerfile.dev
      args:
        - NODE_ENV=development

    # 容器配置
    container_name: my-web-app
    restart: unless-stopped

    # 资源限制
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 512M
```

### 2. 网络配置

```yaml
services:
  web:
    networks:
      - frontend
      - backend

  db:
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### 3. 数据卷配置

```yaml
services:
  db:
    volumes:
      # 命名卷
      - db_data:/var/lib/mysql
      # 绑定挂载
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
      # 匿名卷
      - /var/lib/mysql

volumes:
  db_data:
    driver: local
```

## 环境变量

### 1. 环境变量文件

```yaml
services:
  web:
    env_file:
      - .env
      - .env.production
```

### 2. 直接定义

```yaml
services:
  web:
    environment:
      - NODE_ENV=production
      - API_KEY=secret
```

## 开发实践

### 1. 开发环境配置

```yaml
# docker-compose.dev.yml
version: "3.8"

services:
  web:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
```

### 2. 生产环境配置

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  web:
    build:
      target: production
    restart: always
    command: npm start
```

### 3. 使用多配置文件

```bash
# 开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# 生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## 扩展和依赖

### 1. 服务扩展

```bash
# 扩展服务实例
docker-compose up -d --scale web=3
```

### 2. 依赖管理

```yaml
services:
  web:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
```

## 健康检查

```yaml
services:
  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 常见问题

### 1. 网络问题

- 容器间无法通信
- 端口映射失败
- DNS 解析问题

### 2. 数据持久化

- 数据卷权限问题
- 数据备份和恢复
- 卷挂载路径问题

### 3. 性能优化

- 资源限制设置
- 日志管理
- 缓存利用
