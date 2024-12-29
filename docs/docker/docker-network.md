# Docker 网络配置

## 网络类型

### 1. bridge 网络

默认的网络驱动程序，适用于单机容器通信：

```bash
# 创建 bridge 网络
docker network create --driver bridge my-network

# 查看网络详情
docker network inspect my-network
```

配置示例：

```yaml
services:
  web:
    networks:
      - my-network
    ports:
      - "8080:80"
```

### 2. host 网络

直接使用主机网络，无需端口映射：

```bash
# 使用 host 网络运行容器
docker run --network host nginx
```

### 3. overlay 网络

用于 Swarm 服务之间的通信：

```bash
# 创建 overlay 网络
docker network create --driver overlay my-overlay-net

# 创建服务使用 overlay 网络
docker service create --network my-overlay-net nginx
```

## 网络配置

### 1. 端口映射

```bash
# 单端口映射
docker run -p 8080:80 nginx

# 多端口映射
docker run -p 8080:80 -p 443:443 nginx

# 随机端口映射
docker run -P nginx
```

### 2. DNS 配置

```yaml
services:
  web:
    dns:
      - 8.8.8.8
      - 8.8.4.4
    dns_search:
      - example.com
```

### 3. 网络别名

```yaml
services:
  db:
    networks:
      backend:
        aliases:
          - database
          - mysql
```

## 网络隔离

### 1. 内部网络

```yaml
networks:
  internal:
    internal: true
    driver: bridge
```

### 2. 网络策略

```yaml
services:
  web:
    networks:
      - frontend
  api:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend
```

### 3. 访问控制

```yaml
services:
  web:
    networks:
      frontend:
        ipv4_address: 172.16.238.10
    network_mode: "bridge"
```

## 网络故障排查

### 1. 连接测试

```bash
# 测试容器连接
docker exec container-id ping other-container

# 查看网络配置
docker exec container-id ip addr

# 测试端口连接
docker exec container-id nc -zv host port
```

### 2. 常见问题

```bash
# 查看网络列表
docker network ls

# 清理未使用的网络
docker network prune

# 重新连接网络
docker network connect network-name container-id
```

### 3. 日志分析

```bash
# 查看容器网络日志
docker logs container-id

# 查看 Docker daemon 日志
journalctl -u docker.service
```

## 高级配置

### 1. 负载均衡

```yaml
services:
  web:
    deploy:
      replicas: 3
      endpoint_mode: vip
```

### 2. 服务发现

```yaml
services:
  web:
    networks:
      - my-network
    deploy:
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.web.rule=Host(`example.com`)"
```

### 3. 网络加密

```yaml
networks:
  secure:
    driver: overlay
    driver_opts:
      encrypted: "true"
```

## 性能优化

### 1. MTU 配置

```yaml
networks:
  app_net:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1500
```

### 2. 网络模式选择

- bridge：单机容器通信
- host：高性能网络访问
- overlay：跨主机容器通信
- macvlan：直接访问物理网络

### 3. 性能监控

```bash
# 查看网络统计
docker stats

# 监控网络流量
iftop -i docker0
```

## 安全建议

### 1. 网络隔离

- 使用内部网络
- 限制端口暴露
- 实施访问控制

### 2. 加密通信

- 使用 TLS
- 启用网络加密
- 证书管理

### 3. 监控和审计

- 日志记录
- 流量监控
- 安全扫描
