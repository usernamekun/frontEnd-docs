# React 介绍

React 是一个用于构建用户界面的 JavaScript 库。它由 Facebook 开发和维护,主要用于构建单页应用程序。

## 核心特性

### 1. 声明式

React 使用声明式编程范式,让你可以轻松描述应用的最终状态:

```jsx
function Welcome() {
  return <h1>Hello, React</h1>;
}
```

### 2. 组件化

使用组件将 UI 拆分成独立、可复用的代码片段:

```jsx
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}
```

### 3. 单向数据流

数据通过 props 从父组件流向子组件,保证了应用的可预测性:

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  return <Child count={count} onIncrement={() => setCount(count + 1)} />;
}
```

### 4. 虚拟 DOM

React 通过虚拟 DOM 实现高效的 UI 更新:

- 在内存中维护一个虚拟 DOM 树
- 当数据改变时,计算最小更新
- 只更新需要变化的 DOM 节点

## 开发环境搭建

### 1. 使用 Create React App

```bash
# 创建新项目
npx create-react-app my-app

# 启动开发服务器
cd my-app
npm start
```

### 2. 使用 Vite

```bash
# 创建 React + Vite 项目
npm create vite@latest my-app -- --template react

# 安装依赖
cd my-app
npm install

# 启动开发服务器
npm run dev
```

## 基本概念

### 1. JSX

JSX 是 JavaScript 的语法扩展:

```jsx
const element = (
  <div className="greeting">
    <h1>Hello, {formatName(user)}</h1>
  </div>
);
```

### 2. 组件 & Props

组件接收参数(props)并返回 React 元素:

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
```

### 3. State & 生命周期

组件可以维护自己的状态:

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

## 开发工具

### 1. React Developer Tools

- Chrome/Firefox 扩展
- 组件树检查
- Props/State 查看
- 性能分析

### 2. VS Code 插件

- ES7+ React/Redux/React-Native snippets
- Prettier
- ESLint

## 最佳实践

### 1. 组件设计

- 单一职责
- 保持简单
- 合理拆分
- Props 接口设计

### 2. 状态管理

- 合理使用 local state
- 状态提升
- 使用 Context
- 考虑使用状态管理库

### 3. 性能优化

- 使用 memo 避免不必要渲染
- 合理使用 useMemo/useCallback
- 实现代码分割
- 使用 React.lazy 懒加载

## 下一步

- [快速开始](./getting-started.md)
- [JSX 语法](./jsx.md)
- [组件基础](./components.md)
