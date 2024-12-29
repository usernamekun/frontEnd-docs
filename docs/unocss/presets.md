# UnoCSS 预设系统

预设系统是 UnoCSS 的核心特性之一，它允许你以模块化的方式组织和复用规则、主题和变体。

## 官方预设

### 1. @unocss/preset-uno

默认预设，提供流行的原子化 CSS 实用工具。

```bash
npm i -D @unocss/preset-uno
```

```ts
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  presets: [
    presetUno({
      // 预设配置选项
      dark: 'class',
      attributifyPseudo: true,
      preflight: true,
    })
  ]
})
```

### 2. @unocss/preset-attributify

支持属性化模式的预设。

```bash
npm i -D @unocss/preset-attributify
```

```ts
import presetAttributify from '@unocss/preset-attributify'

export default defineConfig({
  presets: [
    presetAttributify({
      // 预设配置选项
      prefix: 'un-',
      strict: true,
      ignoreAttributes: ['class', 'className']
    })
  ]
})
```

使用示例：

```html
<button
  bg="blue-400 hover:blue-500 dark:blue-500"
  text="sm white"
  font="mono light"
  p="y-2 x-4"
  border="2 rounded blue-200"
>
  Button
</button>
```

### 3. @unocss/preset-icons

提供流行图标集的预设。

```bash
npm i -D @unocss/preset-icons @iconify-json/[collection]
```

```ts
import presetIcons from '@unocss/preset-icons'

export default defineConfig({
  presets: [
    presetIcons({
      // 预设配置选项
      scale: 1.2,
      cdn: 'https://esm.sh/',
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
        mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default)
      }
    })
  ]
})
```

使用示例：

```html
<div class="i-carbon-airplay text-3xl"/>
<div class="i-mdi-account text-red-500"/>
```

### 4. @unocss/preset-typography

提供排版相关的预设。

```bash
npm i -D @unocss/preset-typography
```

```ts
import presetTypography from '@unocss/preset-typography'

export default defineConfig({
  presets: [
    presetTypography({
      // 预设配置选项
      selectorName: 'prose',
      cssExtend: {
        'code': {
          color: '#8b5cf6',
        }
      }
    })
  ]
})
```

## 自定义预设

### 1. 基本结构

```ts
import { Preset } from 'unocss'

export function presetCustom(): Preset {
  return {
    name: 'preset-custom',
    rules: [
      // 规则定义
      ['custom-rule', { color: 'red' }],
      [/^custom-\w+$/, ([match]) => ({ padding: match })]
    ],
    shortcuts: [
      // 快捷方式定义
      ['custom-btn', 'px-4 py-2 rounded bg-blue-500 text-white']
    ],
    variants: [
      // 变体定义
      matcher => {
        if (!matcher.startsWith('custom-')) return matcher
        return {
          matcher: matcher.slice(7),
          selector: s => `${s}:custom`
        }
      }
    ],
    theme: {
      // 主题定义
      colors: {
        custom: {
          primary: '#3b82f6',
          secondary: '#6b7280'
        }
      }
    }
  }
}
```

### 2. 高级功能

#### 动态规则生成

```ts
function createDynamicRules() {
  const rules = []
  for (let i = 1; i <= 10; i++) {
    rules.push([
      `p-${i}`, 
      { padding: `${i * 0.25}rem` }
    ])
  }
  return rules
}

export function presetDynamic(): Preset {
  return {
    name: 'preset-dynamic',
    rules: createDynamicRules()
  }
}
```

#### 条件变体

```ts
export function presetConditional(): Preset {
  return {
    name: 'preset-conditional',
    variants: [
      (matcher) => {
        const [variant, rest] = matcher.split(':')
        if (!rest || !variant.startsWith('@')) return matcher
      
        return {
          matcher: rest,
          parent: variant.slice(1)
        }
      }
    ]
  }
}
```

## 预设组合

### 1. 基础组合

```ts
export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
    presetTypography(),
    presetCustom()
  ]
})
```

### 2. 条件组合

```ts
export default defineConfig({
  presets: [
    presetUno(),
    process.env.NODE_ENV === 'development'
      ? presetDevelopment()
      : presetProduction()
  ]
})
```

### 3. 预设覆盖

```ts
export default defineConfig({
  presets: [
    presetUno(),
    {
      name: 'preset-override',
      theme: {
        colors: {
          // 覆盖默认颜色
          blue: {
            500: '#4f46e5'
          }
        }
      }
    }
  ]
})
```

## 最佳实践

### 1. 预设设计原则

- 保持单一职责
- 提供合理的默认值
- 支持灵活的配置选项
- 文档化配置和用法

### 2. 性能优化

- 避免过度使用动态规则
- 合理使用正则表达式
- 缓存计算结果
- 延迟加载大型资源

### 3. 维护建议

- 版本控制预设代码
- 编写测试用例
- 提供使用示例
- 及时更新文档

## 下一步

- 了解[工作原理](./principles.md)
- 探索[集成指南](./integrations.md)
- 查看[工具链](./tooling.md)
