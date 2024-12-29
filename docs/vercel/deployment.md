# 部署配置

## 部署方式

### 1. Git 集成部署

- GitHub 集成

  ```bash
  # 关联 GitHub 仓库
  vercel link

  # 导入 GitHub 项目
  vercel import
  ```

- 自动部署设置

  - 推送到主分支自动部署
  - PR 预览部署
  - 分支部署规则

### 2. CLI 部署

```bash
# 开发环境部署
vercel

# 生产环境部署
vercel --prod

# 指定配置部署
vercel --build-env NODE_ENV=production
```

### 3. Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
```

### 4. API 部署

```bash
curl -X POST "https://api.vercel.com/v1/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -d '{
    "name": "my-project",
    "files": [...],
    "projectSettings": {
      "framework": "vitepress"
    }
  }'
```

## 部署配置文件

### 1. vercel.json 基础配置

```json
{
  "version": 2,
  "buildCommand": "pnpm docs:build",
  "outputDirectory": "docs/.vitepress/dist",
  "framework": "vitepress",
  "installCommand": "pnpm install",
  "public": true,
  "github": {
    "enabled": true,
    "silent": true,
    "autoAlias": true
  }
}
```

### 2. 高级配置选项

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Access-Control-Allow-Origin", "value": "*" }]
    }
  ],
  "redirects": [{ "source": "/old-page", "destination": "/new-page" }],
  "rewrites": [{ "source": "/api/:path*", "destination": "/api/proxy/:path*" }]
}
```

## 部署环境

### 1. Production (生产环境)

- 特点：

  - 使用生产域名
  - 启用 CDN 缓存
  - 性能优化最大化

- 配置：

  ```bash
  # 环境变量
  NODE_ENV=production
  API_URL=https://api.example.com
  ```

### 2. Preview (预览环境)

- 功能：

  - 独立的预览 URL
  - 自动生成的分支预览
  - 集成测试环境

- 设置：

  ```json
  {
    "git": {
      "deploymentEnabled": {
        "preview": true,
        "production": false
      }
    }
  }
  ```

### 3. Development (开发环境)

- 本地开发：

  ```bash
  vercel dev
  ```

- 环境变量：

  ```bash
  vercel env pull .env.local
  ```

## 自动部署

### 1. GitHub Actions 集成

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 2. 分支预览

- 自动预览设置：

  ```json
  {
    "github": {
      "enabled": true,
      "autoAlias": true,
      "silent": true
    }
  }
  ```

- 预览 URL 格式：
  `https://<branch>-<project>-<team>.vercel.app`

### 3. PR 部署

- PR 评论集成
- 部署状态检查
- 自动预览链接

## 部署优化

### 1. 构建优化

- 缓存策略
  ```json
  {
    "build": {
      "env": {
        "NEXT_PUBLIC_API_URL": "https://api.example.com"
      }
    }
  }
  ```

### 2. 部署速度优化

- 依赖缓存
- 构建缓存
- 增量构建

### 3. 监控和日志

- 部署状态监控
- 错误追踪
- 性能分析

## 常见问题排查

1. 构建失败

   - 检查依赖版本
   - 验证构建命令
   - 查看构建日志

2. 部署超时

   - 优化构建过程
   - 检查依赖大小
   - 调整超时设置

3. 环境变量问题

   - 验证变量配置
   - 检查作用域
   - 更新变量值
