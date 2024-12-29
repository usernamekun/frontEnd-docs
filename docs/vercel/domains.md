# 域名配置

## 域名管理

### 1. 添加自定义域名

```bash
# 使用 CLI 添加域名
vercel domains add example.com

# 添加子域名
vercel domains add blog.example.com
```

配置步骤：

1. 进入项目设置 -> Domains
2. 点击 "Add Domain"
3. 输入域名并验证所有权
4. 按照指引完成 DNS 配置

### 2. DNS 设置

#### A 记录配置

```txt
记录类型: A
主机名: @
值: 76.76.21.21
```

#### CNAME 配置

```txt
记录类型: CNAME
主机名: www
值: cname.vercel-dns.com.
```

### 3. SSL 证书

- 自动 SSL

  - Vercel 自动提供和更新
  - Let's Encrypt 证书
  - 支持通配符证书

- 自定义证书
  ```bash
  # 上传自定义证书
  vercel certs add example.com --cert cert.pem --key key.pem
  ```

### 4. 重定向规则

```json
{
  "redirects": [
    {
      "source": "/old-blog/:path*",
      "destination": "/blog/:path*",
      "permanent": true
    },
    {
      "source": "/docs",
      "destination": "/documentation",
      "statusCode": 301
    }
  ]
}
```

## 域名类型

### 1. apex 域名

- 配置要求：
  - A 记录指向 Vercel IP
  - 正确的 DNS 传播
  - SSL 证书配置

### 2. 子域名

- 常见用途：
  ```txt
  blog.example.com    -> 博客
  docs.example.com    -> 文档
  api.example.com     -> API
  staging.example.com -> 预览环境
  ```

### 3. 通配符域名

```json
{
  "domains": [
    {
      "domain": "*.example.com",
      "type": "wildcard"
    }
  ]
}
```

## 高级配置

### 1. DNS 验证

验证方法：

- TXT 记录验证
- 文件验证
- HTTP 验证

```bash
# 验证域名所有权
vercel domains verify example.com
```

### 2. CNAME 设置

```json
{
  "cnames": [
    {
      "source": "www.example.com",
      "destination": "cname.vercel-dns.com"
    }
  ]
}
```

### 3. A 记录设置

```json
{
  "records": [
    {
      "type": "A",
      "name": "@",
      "value": "76.76.21.21",
      "ttl": 3600
    }
  ]
}
```

### 4. 域名转移

转移步骤：

1. 解锁域名
2. 获取转移码
3. 启动转移流程
4. 确认转移

## 域名安全

### 1. DNSSEC 配置

```bash
# 启用 DNSSEC
vercel domains dnssec enable example.com
```

### 2. 强制 HTTPS

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### 3. 域名锁定

```bash
# 锁定域名防止意外修改
vercel domains lock example.com
```

## 性能优化

### 1. CDN 配置

```json
{
  "cdn": true,
  "regions": ["all"]
}
```

### 2. 缓存控制

```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 故障排查

### 1. DNS 问题

- 检查 DNS 记录
- 验证 DNS 传播
- 清除 DNS 缓存

### 2. SSL 问题

- 证书更新
- 证书验证
- HTTPS 重定向

### 3. 域名绑定问题

- 验证域名所有权
- 检查 DNS 配置
- 确认域名状态
