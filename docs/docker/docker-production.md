# Docker 生产环境部署

## 部署准备

### 1. 系统要求

- 操作系统：推荐 Linux (Ubuntu/CentOS)
- 内存：最低 2GB，推荐 4GB+
- CPU：最低 2 核，推荐 4 核+
- 存储：至少 20GB 可用空间

### 2. 环境配置

```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg \
  lsb-release
```

### 3. Docker 安装

```bash
# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
```

## 容器编排

### 1. Docker Compose 配置

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    image: your-app:latest
    restart: always
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
    environment:
      - NODE_ENV=production
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  app-network:
    driver: overlay
```

### 2. 服务扩展

```bash
# 扩展服务实例
docker-compose up -d --scale app=3

# 查看服务状态
docker-compose ps
```

### 3. 负载均衡

```nginx
# /etc/nginx/nginx.conf
upstream app_servers {
    server app_1:3000;
    server app_2:3000;
    server app_3:3000;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 持续部署

### 1. CI/CD 配置

```yaml
# .github/workflows/docker-deploy.yml
name: Docker Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          push: true
          tags: your-registry/app:latest

      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
```

### 2. 自动化部署

```bash
# 部署脚本
#!/bin/bash
set -e

# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 优雅停止旧容器
docker-compose -f docker-compose.prod.yml down --remove-orphans

# 启动新容器
docker-compose -f docker-compose.prod.yml up -d

# 清理未使用的资源
docker system prune -f
```

### 3. 回滚策略

```bash
# 回滚到指定版本
docker-compose -f docker-compose.prod.yml down
docker tag your-registry/app:previous your-registry/app:latest
docker-compose -f docker-compose.prod.yml up -d
```

## 监控和日志

### 1. 监控配置

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
```

### 2. 日志管理

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "logging=production"
```

### 3. 告警设置

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rules:
  - alert: HighCPUUsage
    expr: container_cpu_usage_seconds_total > 80
    for: 5m
    labels:
      severity: warning
```

## 性能优化

### 1. 容器优化

- 使用多阶段构建
- 优化镜像大小
- 合理设置资源限制

### 2. 网络优化

- 使用 overlay 网络
- 配置 DNS 缓存
- 启用网络加密

### 3. 存储优化

- 使用数据卷
- 配置存储驱动
- 定期清理未使用资源

## 安全加固

### 1. 容器安全

- 使用非 root 用户
- 限制系统调用
- 启用安全选项

### 2. 网络安全

- 配置防火墙
- 使用 TLS
- 实施访问控制

### 3. 数据安全

- 加密敏感数据
- 定期备份
- 安全审计
