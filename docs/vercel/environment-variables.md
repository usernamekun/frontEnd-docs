# 环境变量配置

## 基础概念

### 1. 环境变量类型

- 开发环境 (Development)
- 预览环境 (Preview)
- 生产环境 (Production)

### 2. 变量作用域

- 项目级变量
- 团队级变量
- 用户级变量

## 配置方法

### 1. 通过 Dashboard 配置

1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加变量：
   - 名称
   - 值
   - 环境
   - 加密选项

### 2. 通过 CLI 配置

```bash
# 添加环境变量
vercel env add SECRET_TOKEN production

# 删除环境变量
vercel env rm SECRET_TOKEN production

# 列出所有环境变量
vercel env ls
```

### 3. 配置文件方式

```bash
# .env
API_KEY=xxx

# .env.production
NODE_ENV=production
API_URL=https://api.example.com

# .env.preview
NODE_ENV=preview
API_URL=https://preview-api.example.com
```

## 加密和安全

### 1. 敏感信息处理

```json
{
  "env": {
    "DATABASE_URL": "@database-url",
    "API_SECRET": "@api-secret"
  }
}
```

### 2. 加密存储

```bash
# 添加加密变量
vercel secrets add my-secret "my-secret-value"

# 使用加密变量
vercel env add DATABASE_URL @database-url
```

### 3. 访问控制

- 环境隔离
- 团队权限
- 部署限制

## 高级用法

### 1. 动态环境变量

```javascript
module.exports = {
  env: {
    DEPLOY_TIME: new Date().toISOString(),
    BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA,
  },
};
```

### 2. 条件变量

```json
{
  "env": {
    "PRODUCTION_API": {
      "development": "http://localhost:3000",
      "preview": "https://staging-api.example.com",
      "production": "https://api.example.com"
    }
  }
}
```

### 3. 系统变量

内置环境变量：

- `VERCEL_ENV`
- `VERCEL_URL`
- `VERCEL_REGION`
- `VERCEL_GIT_COMMIT_SHA`

## 最佳实践

### 1. 命名规范

```bash
# 推荐的命名方式
NEXT_PUBLIC_API_URL=https://api.example.com
INTERNAL_SECRET_KEY=xxx
DATABASE_URL=postgres://...
```

### 2. 环境分离

```bash
# 开发环境
.env.development

# 预览环境
.env.preview

# 生产环境
.env.production
```

### 3. 版本控制

```gitignore
# .gitignore
.env*
.vercel
```

## 故障排查

### 1. 常见问题

- 变量未生效
- 权限问题
- 加密失败

### 2. 调试方法

```bash
# 验证环境变量
vercel env pull

# 检查构建日志
vercel logs

# 本地调试
vercel dev
```

### 3. 安全审计

- 定期检查变量
- 更新密钥
- 移除未使用变量
