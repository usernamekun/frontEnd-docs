# UnoCSS 最佳实践

本文档汇总了使用 UnoCSS 的最佳实践和推荐方案，帮助你更好地在项目中使用 UnoCSS。

## 项目结构

### 1. 推荐的目录结构

```
src/
├── styles/
│   ├── uno.config.ts     # UnoCSS 配置文件
│   ├── shortcuts.ts      # 快捷方式定义
│   ├── rules.ts         # 自定义规则
│   ├── themes/          # 主题配置
│   │   ├── light.ts
│   │   └── dark.ts
│   └── presets/         # 自定义预设
│       ├── typography.ts
│       └── components.ts
├── components/          # 组件目录
└── pages/              # 页面目录
```

### 2. 配置文件组织

```ts
// uno.config.ts
import { defineConfig } from 'unocss'
import { rules } from './rules'
import { shortcuts } from './shortcuts'
import { theme } from './themes'
import { presetCustom } from './presets'

export default defineConfig({
  rules,
  shortcuts,
  theme,
  presets: [
    presetCustom()
  ]
})
```

### 3. 模块化管理

```ts
// shortcuts.ts
export const shortcuts = {
  'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md',
  'input': 'border rounded px-4 py-2 outline-none focus:ring-2',
  'card': 'p-4 bg-white rounded-lg shadow'
}

// rules.ts
export const rules = [
  ['custom-rule', { color: 'red' }],
  [/^custom-(\w+)$/, ([, name]) => ({ padding: name })]
]
```

## 性能优化

### 1. 规则优化

```ts
// ❌ 避免过度使用动态规则
rules: [
  [/^.+-\w+$/, () => ({ /* ... */ })]
]

// ✅ 使用更精确的匹配
rules: [
  [/^size-(\d+)$/, ([, d]) => ({ width: `${d}px`, height: `${d}px` })]
]
```

### 2. 缓存策略

```ts
// 配置缓存
export default defineConfig({
  cache: {
    enabled: true,
    storage: 'filesystem', // 'memory' | 'filesystem'
    directory: '.unocss-cache'
  }
})
```

### 3. 构建优化

```ts
// 生产环境优化
export default defineConfig({
  minify: true,
  sourcemap: false,
  preflight: false,
  optimizeCss: {
    minify: true,
    charset: false
  }
})
```

## 代码组织

### 1. 组件封装

```tsx
// ❌ 避免直接使用大量原子类
function Button() {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2">
      Click me
    </button>
  )
}

// ✅ 使用快捷方式
function Button() {
  return (
    <button className="btn btn-primary">
      Click me
    </button>
  )
}
```

### 2. 主题管理

```ts
// themes/base.ts
export const baseTheme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      // ...
    }
  }
}

// themes/dark.ts
import { baseTheme } from './base'

export const darkTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    primary: {
      50: '#1a1a1a',
      100: '#2a2a2a',
      // ...
    }
  }
}
```

### 3. 响应式设计

```html
<!-- ❌ 避免过多的响应式类 -->
<div class="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
  Content
</div>

<!-- ✅ 使用预定义的响应式类 -->
<div class="responsive-text">
  Content
</div>
```

## 团队协作

### 1. 编码规范

```js
// .eslintrc.js
module.exports = {
  plugins: ['@unocss'],
  rules: {
    '@unocss/order': 'error',
    '@unocss/class-order': 'error',
    '@unocss/no-unused-classes': 'warn'
  }
}
```

### 2. 文档规范

```ts
// 为自定义规则添加文档
export const rules = [
  /**
   * 自定义边框样式
   * @example
   * ```html
   * <div class="custom-border-1">
   *   Content
   * </div>
   * ```
   */
  ['custom-border', { border: '1px solid #eee' }]
]
```

### 3. Git 提交规范

```bash
# .gitignore
.unocss-cache/
dist/
*.uno.css
```

## 调试与测试

### 1. 开发环境配置

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    UnoCSS({
      inspector: true,
      hmr: true,
      sourcemap: true,
      logging: {
        level: 'info'
      }
    })
  ]
})
```

### 2. 测试配置

```ts
// test/uno.test.ts
import { createGenerator } from 'unocss'
import { describe, expect, it } from 'vitest'
import { rules, shortcuts } from '../src/styles'

describe('UnoCSS Config', () => {
  const uno = createGenerator({ rules, shortcuts })

  it('should generate correct CSS', async () => {
    const { css } = await uno.generate('<div class="btn-primary">')
    expect(css).toContain('background-color')
  })
})
```

### 3. 性能监控

```ts
export default defineConfig({
  performance: {
    hints: true,
    tracking: {
      rules: true,
      variants: true
    },
    reporters: [
      (stats) => {
        console.log('Performance Stats:', stats)
      }
    ]
  }
})
```

## 常见问题解决

### 1. 样式冲突

```ts
// 使用前缀避免冲突
export default defineConfig({
  prefix: 'un-',
  preflight: false,
  blocklist: [
    'container',
    /^border-.*$/
  ]
})
```

### 2. 构建问题

```ts
// 处理构建问题
export default defineConfig({
  safelist: [
    'btn',
    'card',
    /^bg-.*$/
  ],
  preflights: [
    {
      getCSS: () => `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
      `
    }
  ]
})
```

### 3. IDE 支持

```json
// .vscode/settings.json
{
  "editor.quickSuggestions": {
    "strings": true
  },
  "css.validate": false,
  "unocss.root": "src",
  "files.associations": {
    "*.css": "css",
    "uno.config.ts": "typescript"
  }
}
```

## 进阶使用

### 1. 自定义变体

```ts
export default defineConfig({
  variants: [
    // 自定义媒体查询
    (matcher) => {
      if (!matcher.startsWith('custom-media:')) return matcher
      return {
        matcher: matcher.slice(13),
        parent: '@media (min-width: 32rem)'
      }
    }
  ]
})
```

### 2. 动态主题

```ts
// 运行时切换主题
const toggleTheme = () => {
  const html = document.documentElement
  const isDark = html.classList.toggle('dark')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}
```

### 3. 条件编译

```ts
export default defineConfig({
  shortcuts: [
    [
      'btn',
      process.env.NODE_ENV === 'development'
        ? 'px-4 py-2 bg-blue-500'
        : 'px-4 py-2 bg-blue-600'
    ]
  ]
})
```

## 下一步

- 探索[工具链](./tooling.md)的高级用法
- 了解[预设系统](./presets.md)的扩展方式
- 查看[工作原理](./principles.md)深入理解
