# UnoCSS 工具链

UnoCSS 提供了丰富的工具链支持，帮助开发者提高开发效率和代码质量。

## VS Code 扩展

### 1. 安装配置

```bash
# 通过 VS Code 扩展市场安装
code --install-extension antfu.unocss

# 或在 VS Code 中搜索 "UnoCSS"
```

### 2. 功能特性

- **智能提示**：

  - 类名自动完成
  - 属性值建议
  - 颜色预览
  - 实时预览
- **语法高亮**：

  - 自定义规则高亮
  - 变体语法高亮
  - 错误提示
- **代码片段**：

  ```json
  {
    "unocss-config": {
      "prefix": "unocss",
      "body": [
        "import { defineConfig } from 'unocss'",
        "",
        "export default defineConfig({",
        "  rules: [",
        "    $1",
        "  ],",
        "  shortcuts: {",
        "    $2",
        "  }",
        "})"
      ]
    }
  }
  ```

### 3. 配置选项

```json
{
  "editor.quickSuggestions": {
    "strings": true
  },
  "unocss.root": "packages/client",
  "css.validate": false,
  "unocss.remToPxPreview": true,
  "unocss.colorPreview": true
}
```

## CLI 工具

### 1. 安装使用

```bash
# 全局安装
npm i -g @unocss/cli

# 项目安装
npm i -D @unocss/cli
```

### 2. 命令行选项

```bash
# 生成 CSS
unocss "src/**/*.{html,js,vue,ts,jsx,tsx}"

# 监听文件变化
unocss --watch "src/**/*.{html,js,vue,ts,jsx,tsx}"

# 指定输出文件
unocss "src/**/*" -o dist/uno.css

# 使用自定义配置
unocss --config unocss.config.ts
```

### 3. 配置文件

```ts
// unocss.cli.config.ts
export default {
  patterns: ['src/**/*.{html,js,vue,ts,jsx,tsx}'],
  outFile: 'dist/uno.css',
  watch: true,
  minify: true
}
```

## 开发工具

### 1. Inspector

```ts
// vite.config.ts
import UnoCSS from 'unocss/vite'

export default {
  plugins: [
    UnoCSS({
      inspector: true, // 启用检查器
      inspectorOptions: {
        enabled: true,
        port: 3000
      }
    })
  ]
}
```

### 2. DevTools

```ts
import { createApp } from 'vue'
import { UnocssDevtools } from '@unocss/devtools'

const app = createApp(App)
app.use(UnocssDevtools)
```

功能特性：

- 实时预览
- 规则检查
- 性能分析
- 调试工具

### 3. ESLint 插件

```bash
npm i -D @unocss/eslint-plugin
```

```js
// .eslintrc.js
module.exports = {
  plugins: ['@unocss'],
  rules: {
    '@unocss/order': 'error',
    '@unocss/class-order': 'error',
    '@unocss/class-prefix': ['error', { prefix: 'un-' }]
  }
}
```

## 调试工具

### 1. 日志系统

```ts
export default defineConfig({
  logging: {
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    timestamp: true
  }
})
```

### 2. 性能监控

```ts
export default defineConfig({
  performance: {
    hints: true,
    tracking: {
      rules: true,
      variants: true,
      generation: true
    },
    reporters: [
      (stats) => {
        console.log('Performance Stats:', stats)
      }
    ]
  }
})
```

### 3. 调试模式

```ts
// 启用调试模式
export default defineConfig({
  debug: true,
  details: true,
  sourcemap: true
})
```

## 集成工具

### 1. PostCSS 插件

```bash
npm i -D @unocss/postcss
```

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('@unocss/postcss')({
      content: ['./src/**/*.{html,js,vue,ts,jsx,tsx}']
    })
  ]
}
```

### 2. Webpack 插件

```bash
npm i -D @unocss/webpack
```

```js
// webpack.config.js
const UnoCSS = require('@unocss/webpack').default

module.exports = {
  plugins: [
    UnoCSS({
      // Webpack 特定配置
    })
  ]
}
```

### 3. Rollup 插件

```bash
npm i -D @unocss/rollup
```

```js
// rollup.config.js
import UnoCSS from '@unocss/rollup'

export default {
  plugins: [
    UnoCSS({
      // Rollup 特定配置
    })
  ]
}
```

## 最佳实践

### 1. 开发环境配置

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    UnoCSS({
      inspector: true,
      hmr: true,
      sourcemap: true
    })
  ]
})
```

### 2. 生产环境优化

```ts
export default defineConfig({
  plugins: [
    UnoCSS({
      minify: true,
      sourcemap: false,
      inspector: false
    })
  ]
})
```

### 3. 团队协作

1. **统一配置**：

   - 共享 ESLint 规则
   - 统一 VS Code 设置
   - 使用配置预设
2. **开发流程**：

   - 使用版本控制
   - 编写测试用例
   - 文档化配置
3. **性能优化**：

   - 启用缓存
   - 优化构建
   - 监控性能

## 下一步

- 了解[集成指南](./integrations.md)
- 探索[最佳实践](./best-practices.md)
- 查看[预设系统](./presets.md)
