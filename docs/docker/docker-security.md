# Docker 安全配置

## 基础安全配置

### 1. 容器权限

```bash
# 以非 root 用户运行容器
docker run --user 1000:1000 nginx

# 移除不必要的权限
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx
```

### 2. 资源限制

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
```

### 3. 安全选项

```bash
# 启用安全选项
docker run --security-opt=no-new-privileges \
           --security-opt=apparmor=docker-default \
           --security-opt=seccomp=/path/to/seccomp.json \
           nginx
```

## 镜像安全

### 1. 镜像扫描

```bash
# 使用 Docker Scan
docker scan nginx:latest

# 使用 Trivy
trivy image nginx:latest

# 使用 Snyk
snyk container test nginx:latest
```

### 2. 最小化基础镜像

```dockerfile
# 使用精简基础镜像
FROM alpine:3.18

# 或使用 distroless 镜像
FROM gcr.io/distroless/nodejs:18
```

### 3. 多阶段构建

```dockerfile
# 构建阶段
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# 运行阶段
FROM node:18-alpine
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]
```

## 网络安全

### 1. 网络隔离

```yaml
services:
  frontend:
    networks:
      - frontend
  backend:
    networks:
      - backend

networks:
  frontend:
    internal: false
  backend:
    internal: true
```

### 2. TLS 配置

```yaml
services:
  web:
    environment:
      - ENABLE_TLS=true
    volumes:
      - ./certs:/etc/certs:ro
    command: >
      --tls
      --tlscert=/etc/certs/cert.pem
      --tlskey=/etc/certs/key.pem
```

### 3. 防火墙规则

```bash
# 限制容器网络访问
docker network create --internal private-network

# 配置 iptables 规则
iptables -I DOCKER-USER -i ext_if ! -s 192.168.1.0/24 -j DROP
```

## 数据安全

### 1. 敏感数据管理

```yaml
services:
  app:
    secrets:
      - db_password
      - ssl_cert

secrets:
  db_password:
    file: ./secrets/db_password.txt
  ssl_cert:
    file: ./secrets/ssl_cert.pem
```

### 2. 数据加密

```yaml
services:
  db:
    environment:
      - ENCRYPT_DATA=true
    volumes:
      - db_data:/var/lib/mysql:rw
      - ./encryption-key:/etc/mysql/encryption-key:ro
```

### 3. 备份策略

```bash
# 创建加密备份
docker run --rm \
  -v db_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf - /data | gpg -c > /backup/data.tar.gz.gpg
```

## 运行时安全

### 1. 系统调用限制

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "allowedCalls": ["accept", "bind", "clone", "close", "connect"]
}
```

### 2. AppArmor 配置

```yaml
services:
  app:
    security_opt:
      - apparmor=docker-default
```

### 3. SELinux 策略

```bash
# 启用 SELinux
docker run --security-opt label=type:container_t nginx
```

## 监控和审计

### 1. 日志配置

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 2. 审计系统

```bash
# 启用 Docker 审计
auditctl -w /usr/bin/docker -k docker
auditctl -w /var/lib/docker -k docker
```

### 3. 监控告警

```yaml
services:
  monitoring:
    image: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
```

## 最佳实践

### 1. 更新和补丁

- 定期更新 Docker Engine
- 及时更新基础镜像
- 监控安全公告

### 2. 访问控制

- 实施最小权限原则
- 使用 RBAC
- 定期审查权限

### 3. 安全基线

- 遵循 CIS Docker Benchmark
- 使用安全扫描工具
- 制定安全策略
