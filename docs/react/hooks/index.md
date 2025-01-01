# React Hooks 概述

Hooks 是 React 16.8 引入的新特性,让你在函数组件中使用状态和其他 React 特性。

## 为什么使用 Hooks

### 1. 更好的逻辑复用

- 自定义 Hooks 可以提取组件逻辑
- 不需要改变组件层次结构
- 避免 wrapper hell

### 2. 更简单的状态管理

```jsx
// 使用 Class 组件
class Example extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }
  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Add
        </button>
      </div>
    );
  }
}

// 使用 Hooks
function Example() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
}
```

### 3. 更清晰的副作用处理

```jsx
function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 订阅
    const unsubscribe = api.subscribe((user) => setUser(user));
    // 清理
    return () => unsubscribe();
  }, []);

  return <div>{user?.name}</div>;
}
```

## Hooks 规则

### 1. 只在最顶层使用 Hooks

- 不要在循环、条件或嵌套函数中调用 Hooks
- 确保 Hooks 的调用顺序保持一致

```jsx
// ❌ 错误示例
function Form() {
  const [name, setName] = useState("");

  if (name !== "") {
    useEffect(() => {
      // ...
    });
  }

  // ...
}

// ✅ 正确示例
function Form() {
  const [name, setName] = useState("");

  useEffect(() => {
    if (name !== "") {
      // ...
    }
  }, [name]);

  // ...
}
```

### 2. 只在 React 函数中调用 Hooks

- React 函数组件
- 自定义 Hooks

## 内置 Hooks

### 1. 状态 Hooks

- useState
- useReducer

### 2. 上下文 Hooks

- useContext

### 3. 副作用 Hooks

- useEffect
- useLayoutEffect

### 4. 性能 Hooks

- useMemo
- useCallback
- useRef

### 5. 其他 Hooks

- useImperativeHandle
- useDebugValue

## 自定义 Hooks

创建可复用的状态逻辑:

```jsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return size;
}

// 使用
function App() {
  const { width, height } = useWindowSize();
  return (
    <div>
      Window size: {width} x {height}
    </div>
  );
}
```

## 常见问题

### 1. 闭包陷阱

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // 这里的 count 是闭包中的旧值
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // 空依赖数组

  return <div>{count}</div>;
}

// 解决方案
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // 使用函数式更新
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}
```

### 2. 依赖项处理

```jsx
// ❌ 缺失依赖
function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults(query).then(setResults);
  }, []); // 应该包含 query

  // ...
}

// ✅ 正确处理依赖
function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults(query).then(setResults);
  }, [query]);

  // ...
}
```

## 最佳实践

### 1. 合理拆分 Hooks

```jsx
// ❌ 单个大型 Hook
function UserProfile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    /* 获取用户信息 */
  }, []);
  useEffect(() => {
    /* 获取帖子 */
  }, []);
  useEffect(() => {
    /* 获取评论 */
  }, []);

  // ...
}

// ✅ 拆分为多个小型 Hooks
function useUser(userId) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    /* 获取用户信息 */
  }, [userId]);
  return user;
}

function usePosts(userId) {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    /* 获取帖子 */
  }, [userId]);
  return posts;
}

function UserProfile({ userId }) {
  const user = useUser(userId);
  const posts = usePosts(userId);
  // ...
}
```

### 2. 使用 TypeScript

```typescript
interface User {
  id: number;
  name: string;
}

function useUser(id: number): User | null {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return user;
}
```

## 下一步

- [useState](./use-state.md)
- [useEffect](./use-effect.md)
- [自定义 Hooks](./custom-hooks.md)
