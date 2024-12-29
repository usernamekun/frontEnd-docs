# Vercel 自动化部署指南

本指南将帮助你使用 Vercel 部署文档站点。

## 前置准备

1. 注册 [Vercel](https://vercel.com) 账号
2. 安装 Vercel CLI (可选)
   ```bash
   npm i -g vercel
   ```

## 部署步骤

### 方式一：通过 Vercel 控制台部署

1. 登录 Vercel 控制台
2. 点击 "New Project"
3. 导入你的 Git 仓库
4. 配置部署选项：
   - Framework Preset: 选择 "Vitepress"
   - Build Command: `pnpm docs:build`
   - Output Directory: `docs/.vitepress/dist`
5. 点击 "Deploy" 开始部署

### 方式二：通过 GitHub Actions 自动部署

1. 在 GitHub 仓库设置中，添加以下 Secrets：

   - `VERCEL_TOKEN`: Vercel 个人访问令牌
   - `VERCEL_ORG_ID`: 组织 ID
   - `VERCEL_PROJECT_ID`: 项目 ID

2. 配置 GitHub Actions

   在 `.github/workflows/deploy-vercel.yml` 文件中添加以下内容：

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

         - name: Install Node.js
           uses: actions/setup-node@v3
           with:
             node-version: 18

         - uses: pnpm/action-setup@v2
           with:
             version: 8

         - name: Install dependencies
           run: pnpm install

         - name: Build
           run: pnpm docs:build

         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v20
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             working-directory: ./
   ```

   此工作流程会：

   - 在推送到 main 分支或创建 PR 时触发
   - 使用 Node.js 18 和 pnpm 8
   - 安装依赖并构建项目
   - 使用 Vercel Action 进行部署

## 获取配置信息

1. Vercel Token:

   - 访问 [Vercel Settings](https://vercel.com/account/tokens)
   - 创建新的令牌

2. 组织 ID 和项目 ID:

   - 使用 `vercel login` 登录
   - 使用 `vercel link` 关联项目
   - 查看 `.vercel/project.json` 文件

## 常见问题

1. 构建失败

   - 检查构建命令
   - 检查依赖安装
   - 查看构建日志

2. 部署后 404

   - 检查输出目录配置
   - 检查路由配置

3. 自动部署未触发

   - 检查 GitHub Actions 配置
   - 检查 Secrets 配置

## 项目配置

### 1. Vercel 项目配置

创建 `vercel.json` 文件在项目根目录：

```json
{
  "buildCommand": "pnpm docs:build",
  "outputDirectory": "docs/.vitepress/dist",
  "framework": "vitepress",
  "installCommand": "pnpm install",
  "github": {
    "enabled": true,
    "silent": true
  }
}
```

### 2. 忽略文件配置

在 `.gitignore` 中添加：

```bash
# Vercel
.vercel
```

### 3. 环境变量配置

在 Vercel 项目设置中配置以下环境变量（如果需要）：

- `NODE_VERSION`: 18
- `PNPM_VERSION`: 8

## 部署流程说明

1. 首次部署：

   ```bash
   # 登录 Vercel
   vercel login

   # 初始化并部署项目
   vercel
   ```

2. 后续更新：

   - 推送代码到 GitHub 将自动触发部署
   - 或手动运行：`vercel --prod`

## 高级配置

### 1. 自定义构建输出

如果需要自定义构建输出，可以在 `vercel.json` 中配置：

```json
{
  "routes": [{ "handle": "filesystem" }, { "src": "/(.*)", "dest": "/" }]
}
```

### 2. 团队协作

1. 添加团队成员：

   - 在 Vercel 控制台 -> Team Settings
   - 邀请成员并设置权限

2. 分支预览：

   - 每个 PR 会自动创建预览环境
   - 可在 PR 中查看预览链接

### 3. 性能优化

1. 启用自动压缩：

   ```json
   {
     "compression": true
   }
   ```

2. 配置缓存策略：

   ```json
   {
     "headers": [
       {
         "source": "/assets/(.*)",
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

1. 部署失败：

   - 检查 `vercel.json` 配置
   - 确认项目依赖版本兼容性
   - 查看详细构建日志

2. 预览环境问题：

   - 确认分支权限设置
   - 检查 GitHub 集成状态

3. 性能问题：

   - 使用 Vercel Analytics 监控
   - 检查资源加载优化
   - 考虑启用边缘缓存
