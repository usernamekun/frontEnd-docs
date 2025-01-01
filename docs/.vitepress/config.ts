import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'ikun前端学习  文档',
  description: 'ikun前端学习笔记',

  themeConfig: {
    nav: [
      { text: 'Docker', link: '/docker/getting-started/' },
      { text: 'UnoCSS', link: '/unocss/' },
      { text: 'Vercel', link: '/vercel/' },
      { text: '部署', link: '/deploy/vercel-deploy/' },
      { text: 'Gitee', link: 'https://gitee.com/YOUR_USERNAME/docs' },
      { text: 'React', link: '/react/guide/' }
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
      ],
      '/react/': [
        {
          text: '基础指南',
          items: [
            { text: '介绍', link: '/react/guide/' },
            { text: '快速开始', link: '/react/guide/getting-started' },
            { text: 'JSX语法', link: '/react/guide/jsx' },
            { text: '组件基础', link: '/react/guide/components' },
            { text: '状态管理', link: '/react/guide/state' },
            { text: '事件处理', link: '/react/guide/events' },
            { text: '条件渲染', link: '/react/guide/conditional' },
            { text: '列表渲染', link: '/react/guide/lists' }
          ]
        },
        {
          text: 'Hooks',
          items: [
            { text: 'Hooks概述', link: '/react/hooks/' },
            { text: 'useState', link: '/react/hooks/use-state' },
            { text: 'useEffect', link: '/react/hooks/use-effect' },
            { text: 'useContext', link: '/react/hooks/use-context' },
            { text: 'useReducer', link: '/react/hooks/use-reducer' },
            { text: 'useCallback', link: '/react/hooks/use-callback' },
            { text: 'useMemo', link: '/react/hooks/use-memo' },
            { text: 'useRef', link: '/react/hooks/use-ref' },
            { text: '自定义Hooks', link: '/react/hooks/custom-hooks' }
          ]
        },
        {
          text: '高级特性',
          items: [
            { text: 'Context', link: '/react/advanced/context' },
            { text: 'Refs', link: '/react/advanced/refs' },
            { text: 'Portals', link: '/react/advanced/portals' },
            { text: '错误边界', link: '/react/advanced/error-boundaries' },
            { text: '高阶组件', link: '/react/advanced/hoc' },
            { text: 'Render Props', link: '/react/advanced/render-props' }
          ]
        },
        {
          text: '设计模式',
          items: [
            { text: '组件设计', link: '/react/patterns/component-design' },
            { text: '组合模式', link: '/react/patterns/composition' },
            { text: '状态提升', link: '/react/patterns/lifting-state' },
            { text: '受控组件', link: '/react/patterns/controlled-components' },
            { text: '容器组件', link: '/react/patterns/container-components' }
          ]
        },
        {
          text: '性能优化',
          items: [
            { text: '性能概述', link: '/react/performance/' },
            { text: '代码分割', link: '/react/performance/code-splitting' },
            { text: '虚拟化长列表', link: '/react/performance/virtualization' },
            { text: 'Memo优化', link: '/react/performance/memo' },
            { text: '懒加载', link: '/react/performance/lazy-loading' }
          ]
        },
        {
          text: '原理解析',
          items: [
            { text: '架构概览', link: '/react/principle/' },
            { text: '虚拟DOM', link: '/react/principle/virtual-dom' },
            { text: 'Diff算法', link: '/react/principle/diff' },
            { text: 'Fiber架构', link: '/react/principle/fiber' },
            { text: '调度机制', link: '/react/principle/scheduler' },
            { text: '状态更新', link: '/react/principle/state-updates' },
            { text: 'Hooks原理', link: '/react/principle/hooks' }
          ]
        },
        {
          text: '生态系统',
          items: [
            { text: '路由', link: '/react/ecosystem/router' },
            { text: '状态管理', link: '/react/ecosystem/state-management' },
            { text: '样式方案', link: '/react/ecosystem/styling' },
            { text: '表单处理', link: '/react/ecosystem/forms' },
            { text: '测试', link: '/react/ecosystem/testing' },
            { text: '构建工具', link: '/react/ecosystem/build-tools' }
          ]
        },
        {
          text: 'React 原理',
          items: [
            { text: 'Context 实现原理', link: '/react/principle/context' },
            { text: '事件系统原理', link: '/react/principle/events' },
            { text: '并发模式原理', link: '/react/principle/concurrent' },
            { text: '错误边界实现', link: '/react/principle/error-boundary' },
            { text: 'Suspense 实现原理', link: '/react/principle/suspense' },
            { text: '服务端渲染原理', link: '/react/principle/ssr' },
            { text: '状态管理原理', link: '/react/principle/state-management' },
            { text: '路由系统原理', link: '/react/principle/router' },
            { text: '性能优化原理', link: '/react/principle/performance' }
          ]
        },
        {
          text: 'Hooks 指南',
          items: [
            { text: 'Hooks 性能优化', link: '/react/hooks/hooks-perf' },
            { text: 'useCallback 使用指南', link: '/react/hooks/useCallback-guide' },
            { text: 'useMemo 使用指南', link: '/react/hooks/useMemo-guide' }
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

    editLink: {
      pattern: 'https://github.com/YOUR_USERNAME/docs/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    search: {
      provider: 'local'
    }
  },
}) 