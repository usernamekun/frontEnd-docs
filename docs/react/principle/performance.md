# React 性能优化实现原理

## 性能优化概述

React 性能优化主要涉及以下几个方面:

1. 渲染优化
2. 状态管理优化
3. 加载优化
4. 运行时优化

## 实现原理

### 1. 虚拟 DOM 优化

```javascript
// 优化 diff 算法
function optimizedDiff(oldVNode, newVNode) {
  // 1. 类型检查
  if (oldVNode.type !== newVNode.type) {
    return replaceNode(oldVNode, newVNode);
  }

  // 2. 快速路径
  if (isPrimitive(newVNode)) {
    return updateTextNode(oldVNode, newVNode);
  }

  // 3. 组件优化
  if (isComponent(newVNode)) {
    if (oldVNode.memo && !shouldComponentUpdate(oldVNode, newVNode)) {
      return oldVNode;
    }
  }

  // 4. 列表优化
  if (isArray(oldVNode.children)) {
    return reconcileChildren(oldVNode, newVNode);
  }

  // 5. 属性更新
  return updateAttributes(oldVNode, newVNode);
}

// 列表 diff 优化
function reconcileChildren(oldVNode, newVNode) {
  const oldChildren = oldVNode.children;
  const newChildren = newVNode.children;
  const keyMap = new Map();

  // 构建 key 映射
  oldChildren.forEach((child, index) => {
    const key = child.key || index;
    keyMap.set(key, {
      child,
      index,
    });
  });

  // 最小化 DOM 操作
  let lastIndex = 0;
  newChildren.forEach((newChild, newIndex) => {
    const key = newChild.key || newIndex;
    const oldEntry = keyMap.get(key);

    if (oldEntry) {
      // 复用节点
      patchVNode(oldEntry.child, newChild);
      if (oldEntry.index < lastIndex) {
        // 需要移动
        move(newChild, newIndex);
      } else {
        lastIndex = oldEntry.index;
      }
    } else {
      // 插入新节点
      mount(newChild, newIndex);
    }
  });
}
```

### 2. 组件优化

```typescript
// 组件缓存
const MemoComponent = memo(
  function Component(props) {
    return <div>{/* 复杂渲染逻辑 */}</div>;
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return isEqual(prevProps, nextProps);
  }
);

// 渲染优化
class OptimizedComponent extends React.Component {
  // 1. 避免不必要的更新
  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState)
    );
  }

  // 2. 事件处理优化
  @boundMethod
  handleClick() {
    // 避免每次渲染创建新函数
  }

  // 3. 计算属性缓存
  @memoize
  computeExpensiveValue(props) {
    // 复杂计算
    return result;
  }

  render() {
    const value = this.computeExpensiveValue(this.props);
    return <div onClick={this.handleClick}>{value}</div>;
  }
}
```

### 3. 状态管理优化

```javascript
// 1. 状态分片
function useSharedState(initialState) {
  const store = useRef(new StateManager(initialState));
  const [state, setState] = useState(initialState);

  useEffect(() => {
    return store.current.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  return [state, (updater) => store.current.update(updater)];
}

// 2. 批量更新
function batchedUpdates(callback) {
  const prevIsBatchingUpdates = isBatchingUpdates;
  isBatchingUpdates = true;
  try {
    return callback();
  } finally {
    isBatchingUpdates = prevIsBatchingUpdates;
    if (!isBatchingUpdates) {
      flushBatchedUpdates();
    }
  }
}

// 3. 选择器优化
const selectVisibleTodos = createSelector(
  [(state) => state.todos, (state) => state.filter],
  (todos, filter) => todos.filter((todo) => matchesFilter(todo, filter))
);
```

### 4. 加载优化

```javascript
// 1. 代码分割
const AsyncComponent = lazy(() => import("./Component"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}

// 2. 预加载
const prefetchComponent = (path) => {
  const component = import(/* webpackPrefetch: true */ path);
  return component;
};

// 3. 资源优化
function optimizeAssets(assets) {
  return assets.map((asset) => ({
    ...asset,
    // 压缩
    content: compress(asset.content),
    // 添加 hash
    filename: addHash(asset.filename),
    // 设置缓存
    headers: {
      "Cache-Control": "max-age=31536000",
    },
  }));
}
```

## 性能监控

### 1. 性能指标收集

```javascript
// 性能监控
class PerformanceMonitor {
  metrics = new Map();

  // 收集渲染时间
  measureRender(Component) {
    return class WrappedComponent extends React.Component {
      componentWillMount() {
        this.startTime = performance.now();
      }

      componentDidMount() {
        const duration = performance.now() - this.startTime;
        this.recordMetric("render", duration);
      }

      recordMetric(name, value) {
        const metric = this.metrics.get(name) || [];
        metric.push({
          value,
          timestamp: Date.now(),
        });
        this.metrics.set(name, metric);
      }

      render() {
        return <Component {...this.props} />;
      }
    };
  }

  // 分析性能数据
  analyzeMetrics() {
    return Array.from(this.metrics.entries()).map(([name, values]) => ({
      name,
      average: average(values),
      p95: percentile(values, 95),
      max: Math.max(...values),
    }));
  }
}
```

## 注意事项

1. **避免过度优化**

   ```javascript
   // ❌ 过度优化
   function SimpleComponent({ text }) {
     return React.memo(<div>{text}</div>);
   }

   // ✅ 合理优化
   const ComplexComponent = React.memo(function ({ data }) {
     // 复杂的渲染逻辑
     return <ExpensiveView data={data} />;
   });
   ```

2. **正确的依赖管理**

   ```javascript
   // ❌ 缺失依赖
   useEffect(() => {
     fetchData(props.id);
   }, []); // 缺少 props.id 依赖

   // ✅ 完整依赖
   useEffect(() => {
     fetchData(props.id);
   }, [props.id]);
   ```

3. **合理的缓存策略**

   ```javascript
   // ❌ 过度缓存
   const value = useMemo(() => a + b, []); // 永远使用初始值

   // ✅ 按需缓存
   const value = useMemo(
     () => expensiveComputation(a, b),
     [a, b] // 仅在 a 或 b 变化时重新计算
   );
   ```
