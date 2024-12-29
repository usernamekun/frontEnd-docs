# UnoCSS 快速开始

## 安装配置

### Vite 项目

```bash
# 安装依赖
npm i -D unocss @unocss/preset-uno

# 如果需要图标支持
npm i -D @unocss/preset-icons
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import presetUno from '@unocss/preset-uno'
import presetIcons from '@unocss/preset-icons'

export default defineConfig({
  plugins: [
    UnoCSS({
      presets: [
        presetUno(),
        presetIcons()
      ],
      // 自定义规则
      rules: [
        ['custom-rule', { color: 'red' }]
      ],
      // 快捷方式
      shortcuts: {
        'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md',
        'btn-green': 'text-white bg-green-500 hover:bg-green-700'
      }
    })
  ]
})
```

```ts
// main.ts
import 'uno.css'
```

### Nuxt 项目

```bash
npm i -D @unocss/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@unocss/nuxt'],
  unocss: {
    // 预设
    uno: true,
    icons: true,
    attributify: true,
    
    // 规则
    rules: [
      ['custom-rule', { color: 'red' }]
    ],
    
    // 快捷方式
    shortcuts: {
      'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md'
    }
  }
})
```

## 基础使用

### 1. 使用原子化类

```html
<div class="text-center p-4 bg-blue-500 text-white">
  Hello UnoCSS
</div>
```

### 2. 使用属性模式

```html
<button 
  text="sm white"
  p="y-2 x-4"
  bg="blue-400 hover:blue-500"
>
  Button
</button>
```

### 3. 使用图标

```html
<div class="i-carbon-airplay text-3xl"/>
```

### 4. 使用快捷方式

```html
<button class="btn btn-green">
  Green Button
</button>
```

## 开发工具配置

### VS Code 配置

1. 安装 UnoCSS VS Code 扩展
```bash
code --install-extension antfu.unocss
```

2. 配置 settings.json
```json
{
  "editor.quickSuggestions": {
    "strings": true
  },
  "unocss.root": "packages/client",
  "css.validate": false
}
```

### ESLint 配置

```bash
npm i -D @unocss/eslint-plugin
```

```js
// .eslintrc.js
module.exports = {
  plugins: ['@unocss'],
  rules: {
    '@unocss/order': 'error',
    '@unocss/class-order': 'error'
  }
}
```

## 常见问题

1. **样式未生效**
   - 检查是否导入了 `uno.css`
   - 验证构建工具配置是否正确
   - 检查类名是否符合规范

2. **热更新问题**
   - 确保 Vite 配置正确
   - 检查文件监听设置
   - 清除缓存重试

3. **与其他框架冲突**
   - 调整插件加载顺序
   - 检查配置兼容性
   - 使用隔离模式

## 下一步

- 深入了解[核心概念](./core-concepts.md)
- 探索[预设系统](./presets.md)
- 查看[最佳实践](./best-practices.md) 