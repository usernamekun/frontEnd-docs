# React Context 实现原理

## Context 的本质

Context 提供了一种在组件树中共享数据的方式,而不必显式地通过组件树的逐层传递 props。

## 实现原理

### 1. 基本数据结构

```typescript
interface Context<T> {
  $$typeof: Symbol | number;
  Provider: Provider<T>;
  Consumer: Consumer<T>;
  _currentValue: T;
  _currentValue2: T;
  _threadCount: number;
  _defaultValue: T;
}

interface Provider<T> {
  $$typeof: Symbol | number;
  _context: Context<T>;
  props: {
    value: T;
    children: ReactNode;
  };
}

interface Consumer<T> {
  $$typeof: Symbol | number;
  _context: Context<T>;
  props: {
    children: (value: T) => ReactNode;
  };
}
```

### 2. Context 创建

```javascript
function createContext<T>(defaultValue: T): Context<T> {
  const context: Context<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    Provider: null,
    Consumer: null,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    _defaultValue: defaultValue,
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  context.Consumer = {
    $$typeof: REACT_CONTEXT_TYPE,
    _context: context,
  };

  return context;
}
```

### 3. Provider 实现

```javascript
class ContextProvider extends React.Component {
  constructor(props) {
    super(props);
    const context = (this.context = props.context);
    this.state = {
      value: props.value,
      children: props.children,
    };

    // 保存旧值
    this.oldValue = context._currentValue;
    // 更新 context 值
    context._currentValue = props.value;
  }

  componentDidUpdate(prevProps) {
    const context = this.props.context;
    const newValue = this.props.value;

    if (newValue !== prevProps.value) {
      // 保存旧值
      const oldValue = context._currentValue;
      // 更新 context 值
      context._currentValue = newValue;
      // 触发更新
      this.updateContextConsumers(context, oldValue, newValue);
    }
  }

  componentWillUnmount() {
    // 恢复旧值
    this.context._currentValue = this.oldValue;
  }

  updateContextConsumers(context, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    // 获取所有消费该 context 的组件
    const consumers = getContextConsumers(context);

    // 触发更新
    consumers.forEach((consumer) => {
      scheduleWork(consumer);
    });
  }

  render() {
    return this.props.children;
  }
}
```

### 4. Consumer 实现

```javascript
function ContextConsumer(props) {
  return (
    <ReactCurrentDispatcher.Consumer>
      {(dispatcher) => {
        const context = props.context;
        const contextValue = readContext(context);

        return props.children(contextValue);
      }}
    </ReactCurrentDispatcher.Consumer>
  );
}

function readContext(context) {
  const currentValue = isPrimaryRenderer
    ? context._currentValue
    : context._currentValue2;

  if (lastFullyObservedContext === context) {
    // 已经订阅过
  } else {
    // 订阅 context 变化
    subscribeToContext(context);
  }

  return currentValue;
}
```

### 5. 优化实现

```javascript
// 使用位运算优化更新检查
const MAX_SIGNED_31_BIT_INT = 1073741823;

function calculateChangedBits(context, newValue, oldValue) {
  // 默认实现
  return MAX_SIGNED_31_BIT_INT;
}

// 使用 WeakMap 存储订阅关系
const contextSubscriptions = new WeakMap();

function subscribeToContext(context, consumer) {
  let subscribers = contextSubscriptions.get(context);
  if (!subscribers) {
    subscribers = new Set();
    contextSubscriptions.set(context, subscribers);
  }
  subscribers.add(consumer);

  return () => {
    subscribers.delete(consumer);
  };
}
```

## 性能优化

### 1. 避免不必要的重渲染

```javascript
// 使用 memo 优化 Consumer
const MemoizedConsumer = React.memo(({ context, children }) => (
  <context.Consumer>{(value) => children(value)}</context.Consumer>
));

// 拆分 Provider 的 value
function ParentComponent() {
  const [theme, setTheme] = useState({ color: "blue" });
  const [user, setUser] = useState({ name: "John" });

  // ❌ 每次渲染都创建新对象
  // <ThemeContext.Provider value={{ theme, user }}>

  // ✅ 分开提供 context
  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        <App />
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}
```

### 2. 使用 Context Selector

```javascript
function useContextSelector(context, selector) {
  const value = useContext(context);
  const prevValue = useRef(value);
  const prevSelected = useRef(selector(value));

  // 只在选择的值变化时更新
  if (value !== prevValue.current) {
    const nextSelected = selector(value);
    if (!Object.is(prevSelected.current, nextSelected)) {
      prevSelected.current = nextSelected;
    }
    prevValue.current = value;
  }

  return prevSelected.current;
}

// 使用示例
function TodoCount() {
  const count = useContextSelector(TodoContext, (state) => state.todos.length);
  return <div>{count} todos</div>;
}
```

## 注意事项

1. **避免过度使用**

   ```javascript
   // ❌ 滥用 Context
   <ThemeContext.Provider value={theme}>
     <LayoutContext.Provider value={layout}>
       <DataContext.Provider value={data}>
         <App />
       </DataContext.Provider>
     </LayoutContext.Provider>
   </ThemeContext.Provider>

   // ✅ 合理组织 Context
   <AppContext.Provider value={{ theme, layout, data }}>
     <App />
   </AppContext.Provider>
   ```

2. **合理的粒度**

   ```javascript
   // ❌ 粒度太大
   const AppContext = createContext({
     theme: defaultTheme,
     user: defaultUser,
     settings: defaultSettings,
     // ...更多无关数据
   });

   // ✅ 合理的粒度
   const ThemeContext = createContext(defaultTheme);
   const UserContext = createContext(defaultUser);
   const SettingsContext = createContext(defaultSettings);
   ```

3. **默认值设计**

   ```javascript
   // ❌ 不提供默认值
   const ThemeContext = createContext();

   // ✅ 提供合理的默认值
   const ThemeContext = createContext({
     primaryColor: "#000",
     secondaryColor: "#fff",
     // 提供必要的 API
     toggleTheme: () => {},
   });
   ```
