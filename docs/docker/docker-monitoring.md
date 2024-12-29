# Docker 监控配置

## 监控系统搭建

### 1. Prometheus 配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "docker"
    static_configs:
      - targets: ["localhost:9323"]

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "cadvisor"
    static_configs:
      - targets: ["cadvisor:8080"]
```

### 2. Grafana 配置

```yaml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secret
      - GF_USERS_ALLOW_SIGN_UP=false
```

### 3. 监控组件

```yaml
# docker-compose.monitoring.yml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
```

## 指标收集

### 1. 容器指标

```yaml
# 容器资源使用监控
- alert: ContainerHighCPU
  expr: container_cpu_usage_seconds_total > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    description: "Container {{ $labels.name }} CPU usage is high"

- alert: ContainerHighMemory
  expr: container_memory_usage_bytes > 1e9
  for: 5m
  labels:
    severity: warning
```

### 2. 系统指标

```yaml
# 系统资源监控
- alert: HighSystemLoad
  expr: node_load1 > 5
  for: 5m
  labels:
    severity: warning

- alert: LowDiskSpace
  expr: node_filesystem_free_bytes{} / node_filesystem_size_bytes{} * 100 < 10
  for: 5m
  labels:
    severity: critical
```

### 3. 应用指标

```yaml
# 应用健康监控
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    description: "Service {{ $labels.job }} is down"
```

## 日志管理

### 1. ELK 配置

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.9.3
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:7.9.3
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.9.3
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### 2. Fluentd 配置

```yaml
# fluentd.conf
<source>
@type forward
port 24224
bind 0.0.0.0
</source>

<match docker.**>
@type elasticsearch
host elasticsearch
port 9200
logstash_format true
</match>
```

### 3. 日志聚合

```yaml
services:
  app:
    logging:
      driver: "fluentd"
      options:
        fluentd-address: localhost:24224
        tag: docker.{{.Name}}
```

## 告警配置

### 1. AlertManager 配置

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ["alertname"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: "slack"

receivers:
  - name: "slack"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/xxx"
        channel: "#alerts"
```

### 2. 告警规则

```yaml
groups:
  - name: docker_alerts
    rules:
      - alert: ContainerDown
        expr: absent(container_last_seen{name="app"})
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Container down"
```

### 3. 通知集成

```yaml
services:
  alertmanager:
    image: prom/alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

## 可视化

### 1. Grafana 仪表板

```json
{
  "dashboard": {
    "id": null,
    "title": "Docker Monitoring",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "container_cpu_usage_seconds_total"
          }
        ]
      }
    ]
  }
}
```

### 2. 监控面板

- 系统概览
- 容器状态
- 资源使用
- 日志查看
- 告警历史

### 3. 报表生成

```yaml
services:
  grafana:
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secret
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=smtp.example.com:587
```

## 性能分析

### 1. 性能指标

- CPU 使用率
- 内存使用
- 磁盘 I/O
- 网络流量

### 2. 性能优化

- 资源限制调整
- 容器编排优化
- 网络配置优化

### 3. 容量规划

- 资源使用趋势
- 扩展建议
- 成本分析
