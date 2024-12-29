# 构建设置

## 构建基础

### 1. 构建命令

常用构建命令配置：

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "pnpm docs:build",
        "outputDirectory": "docs/.vitepress/dist"
      }
    }
  ]
}
```

### 2. 构建器类型

Vercel 支持多种构建器：

1. `@vercel/static`

   - 用于静态文件
   - 无需构建过程

2. `@vercel/node`

   - Node.js 应用
   - 支持 Serverless Functions

3. `@vercel/static-build`

   - 静态站点生成
   - 支持自定义构建命令

4. `@vercel/python`

   - Python 应用
   - 支持 WSGI/ASGI

## 高级构建配置

### 1. 多构建配置

```json
{
  "builds": [
    {
      "src": "docs/**/*.md",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ]
}
```

### 2. 构建环境变量

```json
{
  "build": {
    "env": {
      "NODE_VERSION": "18",
      "PNPM_VERSION": "8",
      "API_BASE_URL": "https://api.example.com"
    }
  }
}
```

### 3. 构建钩子

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "prebuild": "node ./scripts/prebuild.js",
        "postbuild": "node ./scripts/postbuild.js"
      }
    }
  ]
}
```

## 构建优化

### 1. 缓存配置

```json
{
  "build": {
    "cache": {
      "directories": [".next/cache", "node_modules/.cache"]
    }
  }
}
```

### 2. 依赖优化

- 使用 pnpm 加速安装
- 配置依赖缓存
- 优化依赖大小

```json
{
  "installCommand": "pnpm install --frozen-lockfile",
  "build": {
    "cache": "pnpm"
  }
}
```

### 3. 构建输出优化

```json
{
  "outputDirectory": "docs/.vitepress/dist",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "status": 404, "dest": "/404.html" }
  ]
}
```

## 构建监控

### 1. 构建日志

- 访问构建日志

  ```bash
  vercel logs
  ```

- 实时监控构建

  ```bash
  vercel logs --follow
  ```

### 2. 构建通知

```json
{
  "github": {
    "silent": false,
    "autoAlias": true
  }
}
```

### 3. 构建状态检查

```yaml
# GitHub Actions 构建状态检查
jobs:
  build:
    steps:
      - name: Check Build Status
        run: |
          STATUS=$(curl -s \
            -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
            "https://api.vercel.com/v6/deployments")
          echo $STATUS
```

## 常见构建问题

### 1. 内存问题

解决方案：

- 增加构建内存
  ```json
  {
    "build": {
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=4096"
      }
    }
  }
  ```

### 2. 超时问题

处理方法：

- 设置更长的超时时间
- 优化构建过程
- 减少构建步骤

### 3. 依赖冲突

解决步骤：

1. 清理依赖缓存
2. 更新 lockfile
3. 检查版本兼容性

## 最佳实践

### 1. 构建性能优化

- 使用构建缓存
- 优化依赖安装
- 并行构建任务

### 2. 构建安全

- 使用环境变量
- 验证依赖安全性
- 定期更新依赖

### 3. 构建自动化

- 集成 CI/CD
- 自动化测试
- 自动化部署
