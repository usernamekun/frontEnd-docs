# UnoCSS 核心概念

## 原子化 CSS

原子化 CSS 是一种 CSS 的架构方式，它倾向于小巧且用途单一的 class，并且会以视觉效果进行命名。

### 优势

- 🚀 更小的 CSS 体积
- 🎯 更好的可复用性
- 🔧 更容易维护
- 📦 更好的性能

### 示例

```html
<!-- 传统写法 -->
<div class="card">
  <h2 class="title">Hello</h2>
</div>

<style>
.card {
  padding: 1rem;
  margin: 0.5rem;
  border-radius: 0.25rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}
</style>

<!-- 原子化写法 -->
<div class="p-4 m-2 rounded bg-white shadow-sm">
  <h2 class="text-xl font-bold text-gray-800">Hello</h2>
</div>
```

## 规则系统

UnoCSS 的规则系统是其核心特性之一，它提供了强大而灵活的方式来定义样式规则。

### 1. 静态规则

```ts
rules: [
  ['m-1', { margin: '0.25rem' }],
  ['p-2', { padding: '0.5rem' }],
  ['text-red', { color: 'red' }]
]
```

### 2. 动态规则

```ts
rules: [
  [/^m-(\d+)$/, ([, d]) => ({ margin: `${d * 0.25}rem` })],
  [/^p-(\d+)$/, ([, d]) => ({ padding: `${d * 0.25}rem` })],
  [/^text-(.+)$/, ([, c]) => ({ color: c })]
]
```

### 3. 快捷方式

```ts
shortcuts: {
  'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md',
  'input': 'border rounded px-4 py-2 outline-none focus:ring-2',
  'card': 'p-4 bg-white rounded-lg shadow'
}
```

## 预设系统

预设是一组预定义的规则、快捷方式和主题配置。

### 1. 官方预设

```ts
import presetUno from '@unocss/preset-uno'
import presetAttributify from '@unocss/preset-attributify'
import presetIcons from '@unocss/preset-icons'
import presetTypography from '@unocss/preset-typography'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
    presetTypography()
  ]
})
```

### 2. 自定义预设

```ts
const myPreset = definePreset({
  name: 'my-preset',
  rules: [
    // 自定义规则
  ],
  shortcuts: {
    // 自定义快捷方式
  },
  theme: {
    // 主题配置
  }
})
```

## 主题系统

主题系统允许你定义和复用设计令牌。

```ts
export default defineConfig({
  theme: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        // ...
      }
    },
    spacing: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem'
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px'
    }
  }
})
```

## 变体系统

变体允许你根据不同的条件应用样式。

### 1. 伪类变体

```html
<div class="hover:bg-blue-500 focus:outline-none active:bg-blue-600">
  Hover me
</div>
```

### 2. 响应式变体

```html
<div class="sm:text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```

### 3. 暗色模式

```html
<div class="dark:bg-gray-800 dark:text-white">
  Dark mode support
</div>
```

## 工具函数

UnoCSS 提供了多种工具函数来辅助样式生成。

```ts
import { parseColor, formatColor } from '@unocss/preset-mini/utils'

// 颜色处理
const color = parseColor('blue-500')
const formatted = formatColor(color, 'rgb') // 'rgb(59, 130, 246)'

// 尺寸计算
const { numberWithUnit } = require('@unocss/preset-mini/utils')
const size = numberWithUnit('2.5', 'rem') // '2.5rem'
```

## 构建优化

UnoCSS 提供了多种优化选项来提升构建性能。

### 1. 预检

```ts
export default defineConfig({
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

### 2. 安全列表

```ts
export default defineConfig({
  safelist: [
    'p-1',
    'p-2',
    'm-1',
    'm-2',
    /^bg-.*$/
  ]
})
```

### 3. 块列表

```ts
export default defineConfig({
  blocklist: [
    'container',
    /^border-.*$/
  ]
})
```

## 最佳实践

1. **组织规则**

   - 按功能分组
   - 保持命名一致性
   - 避免过度使用动态规则
2. **性能优化**

   - 使用静态规则代替动态规则
   - 合理使用安全列表
   - 避免过度使用正则表达式
3. **可维护性**

   - 使用有意义的快捷方式
   - 保持主题配置的一致性
   - 文档化自定义规则

## 下一步

- 了解[预设系统](./presets.md)的详细用法
- 探索[工具链](./tooling.md)的使用方法
- 实践[最佳实践](./best-practices.md)中的建议
