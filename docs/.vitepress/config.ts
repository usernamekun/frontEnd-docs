import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'UnoCSS 中文文档',
  description: 'UnoCSS 完整指南与最佳实践',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide' },
      { text: '配置', link: '/config' },
      { text: 'Gitee', link: 'https://gitee.com/YOUR_USERNAME/unocss-docs' }
    ],

    sidebar: [
      {
        text: '入门',
        items: [
          { text: '快速开始', link: '/getting-started' },
          { text: '核心概念', link: '/core-concepts' }
        ]
      },
      {
        text: '进阶',
        items: [
          { text: '预设系统', link: '/presets' },
          { text: '工作原理', link: '/principles' },
          { text: '工具链', link: '/tooling' },
          { text: '最佳实践', link: '/best-practices' }
        ]
      }
    ],

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
      pattern: 'https://github.com/YOUR_USERNAME/unocss-docs/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    }
  }
}) 