# Vercel 快速开始

## 前置要求

1. Node.js 环境

   - Node.js 版本 >= 14.x
   - 推荐使用 Node.js LTS 版本
   - 可通过 nvm 管理 Node.js 版本

2. 包管理器

   - pnpm (推荐，更快的依赖安装)
   - npm (Node.js 自带)
   - yarn (可选)

3. Git 版本控制

   - Git >= 2.x
   - 配置 SSH key 或 Personal Access Token

4. 代码托管账号

   - GitHub (推荐)
   - GitLab
   - Bitbucket

## 注册和安装

### 1. Vercel 账号设置

1. 注册 Vercel 账号

   - 访问 [Vercel](https://vercel.com) 官网
   - 使用 GitHub 账号登录（推荐）
   - 完善个人信息和团队设置

2. 账号验证

   - 验证邮箱
   - 设置双因素认证（推荐）
   - 配置账号安全选项

### 2. CLI 工具安装

1. 全局安装 Vercel CLI

   ```bash
   # 使用 pnpm
   pnpm add -g vercel

   # 使用 npm
   npm i -g vercel

   # 使用 yarn
   yarn global add vercel
   ```

2. 验证安装

   ```bash
   vercel --version
   ```

## 项目初始化

### 1. CLI 登录认证

```bash
# 登录 Vercel CLI
vercel login

# 查看登录状态
vercel whoami
```

### 2. 项目设置

1. 新项目初始化

   ```bash
   # 创建新项目
   vercel init

   # 选择项目模板
   # - Next.js
   # - VitePress
   # - Nuxt.js
   # 等...
   ```

2. 现有项目部署

   ```bash
   # 进入项目目录
   cd your-project

   # 链接到 Vercel
   vercel link

   # 部署项目
   vercel
   ```

### 3. 配置文件设置

1. 创建 `vercel.json`

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "docs/.vitepress/dist"
         }
       }
     ]
   }
   ```

2. 配置 `.gitignore`

   ```bash
   # Vercel
   .vercel
   .env*.local
   ```

## 开发工作流

### 1. 本地开发

```bash
# 启动开发服务器
vercel dev

# 指定端口
vercel dev --port 3000
```

### 2. 预览部署

```bash
# 创建预览部署
vercel

# 指定部署配置
vercel --prod false
```

### 3. 生产部署

```bash
# 部署到生产环境
vercel --prod

# 指定团队部署
vercel --prod --scope team_name
```

## 常见问题

1. 部署失败

   - 检查 Node.js 版本兼容性
   - 验证项目依赖完整性
   - 查看构建日志

2. CLI 认证问题

   - 重新登录: `vercel logout && vercel login`
   - 清除缓存: `rm -rf ~/.vercel`

3. 项目配置问题

   - 确认 `vercel.json` 格式正确
   - 检查构建输出目录配置
   - 验证环境变量设置

## 下一步

- [部署配置](./deployment.md)
- [项目管理](./projects.md)
- [域名配置](./domains.md)
