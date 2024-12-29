import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Docker & UnoCSS 中文文档',
  description: 'Docker 和 UnoCSS 完整指南与最佳实践',

  themeConfig: {
    nav: [
      { text: 'Docker', link: '/docker/getting-started/' },
      { text: 'UnoCSS', link: '/unocss/' },
      { text: 'Vercel', link: '/vercel/' },
      { text: '部署', link: '/deploy/vercel-deploy/' },
      { text: 'Gitee', link: 'https://gitee.com/YOUR_USERNAME/docs' }
    ],

    sidebar: {
      '/docker/': [
        {
          text: 'Docker',
          items: [
            { text: '快速开始', link: '/docker/getting-started' },
            { text: 'Docker Compose', link: '/docker/docker-compose' },
            { text: '网络配置', link: '/docker/docker-network' },
            { text: '安全配置', link: '/docker/docker-security' },
            { text: '生产环境部署', link: '/docker/docker-production' },
            { text: '监控配置', link: '/docker/docker-monitoring' }
          ]
        }
      ],
      '/unocss/': [
        {
          text: '入门',
          items: [
            { text: '介绍', link: '/unocss/' },
            { text: '快速开始', link: '/unocss/getting-started' },
            { text: '核心概念', link: '/unocss/core-concepts' }
          ]
        },
        {
          text: '进阶',
          items: [
            { text: '预设系统', link: '/unocss/presets' },
            { text: '工作原理', link: '/unocss/principles' },
            { text: '工具链', link: '/unocss/tooling' },
            { text: '最佳实践', link: '/unocss/best-practices' },
            { text: '集成指南', link: '/unocss/integrations' }
          ]
        }
      ],
      '/vercel/': [
        {
          text: 'Vercel',
          items: [
            { text: '介绍', link: '/vercel/' },
            { text: '快速开始', link: '/vercel/getting-started' },
            { text: '项目管理', link: '/vercel/projects' },
            { text: '构建设置', link: '/vercel/builds' },
            { text: '部署管理', link: '/vercel/deployment' },
            { text: '域名配置', link: '/vercel/domains' },
            { text: '环境变量', link: '/vercel/environment-variables' },
            { text: '监控分析', link: '/vercel/monitoring' },
            { text: '团队协作', link: '/vercel/teams' }
          ]
        }
      ],
      '/deploy/': [
        {
          text: '部署指南',
          items: [
            { text: 'Vercel部署', link: '/deploy/vercel-deploy' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/unocss/unocss' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/YOUR_USERNAME/docs/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    }
  }
}) 