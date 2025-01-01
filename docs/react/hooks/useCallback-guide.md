# useCallback 使用指南

## 核心使用场景

### 1. 将回调函数传递给使用 memo 优化的组件

```javascript
function ProductPage({ productId, referrer }) {
  const handleSubmit = useCallback(
    (orderDetails) => {
      post("/product/" + productId + "/buy", {
        referrer,
        orderDetails,
      });
    },
    [productId, referrer] // 仅当这些依赖项变化时才会改变
  );

  return <ShippingForm onSubmit={handleSubmit} />;
}

// 使用 memo 包装的子组件
const ShippingForm = memo(function ShippingForm({ onSubmit }) {
  // 当 handleSubmit 引用不变时，这个组件不会重新渲染
  return <form onSubmit={onSubmit}>{/* 表单内容 */}</form>;
});
```

### 2. 自定义 Hook 中的回调函数

```javascript
function useProductAPI() {
  const [product, setProduct] = useState(null);

  // 缓存请求函数，以便其他 Hook 可以订阅这个函数
  const fetchProduct = useCallback(async (productId) => {
    const response = await fetch(`/api/products/${productId}`);
    const nextProduct = await response.json();
    setProduct(nextProduct);
  }, []); // 没有依赖项，永远不会改变

  return { product, fetchProduct };
}

// 使用自定义 Hook
function ProductDetails({ productId }) {
  const { product, fetchProduct } = useProductAPI();

  // fetchProduct 的引用稳定，不会导致效果重新运行
  useEffect(() => {
    fetchProduct(productId);
  }, [fetchProduct, productId]);

  return <div>{/* 产品详情 */}</div>;
}
```

### 3. 作为其他 Hook 的依赖项

```javascript
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState("");

  // 缓存回调以用作依赖项
  const createOptions = useCallback(
    () => ({
      serverUrl: "https://localhost:1234",
      roomId: roomId,
    }),
    [roomId] // 仅当 roomId 改变时更新
  );

  useEffect(() => {
    const connection = createConnection(createOptions());
    connection.connect();
    return () => connection.disconnect();
  }, [createOptions]); // ✅ 仅当 createOptions 改变时重新连接

  return <div>{/* 聊天界面 */}</div>;
}
```

## 性能优化考虑

### 1. 组件重新渲染优化

```javascript
function TodoList({ theme, todos }) {
  // ❌ 不必要的优化
  const handleClick = useCallback(() => {
    console.log("You clicked a todo.");
  }, []); // 简单的事件处理不需要缓存

  // ✅ 需要优化的场景
  const handleDelete = useCallback(
    (todoId) => {
      todos.delete(todoId);
      analytics.track("Todo deleted", { todoId, theme });
    },
    [todos, theme]
  ); // 依赖复杂对象或需要在多处使用

  return (
    <div>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          theme={theme}
          onDelete={() => handleDelete(todo.id)}
        />
      ))}
    </div>
  );
}
```

### 2. 避免无限循环

```javascript
function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // ✅ 防止 useEffect 无限循环
  const debouncedFetch = useCallback(
    debounce(async (q) => {
      const response = await fetch(`/api/search?q=${q}`);
      const results = await response.json();
      setResults(results);
    }, 300),
    [] // 空依赖数组确保 debounce 函数只创建一次
  );

  useEffect(() => {
    debouncedFetch(query);
  }, [debouncedFetch, query]);

  return <div>{/* 搜索结果 */}</div>;
}
```

## 注意事项

### 1. 依赖项管理

```javascript
function Form({ onSubmit }) {
  // ❌ 错误：缺少依赖项
  const handleSubmit = useCallback((data) => {
    onSubmit(data);
  }, []); // 应该包含 onSubmit

  // ✅ 正确：包含所有依赖项
  const handleSubmitFixed = useCallback(
    (data) => {
      onSubmit(data);
    },
    [onSubmit]
  );
}
```

### 2. 内联回调与 useCallback 对比

```javascript
function ProductItem({ product, onDelete }) {
  // 方案 1: 直接传递内联函数
  return (
    <div>
      {/* 如果父组件已经使用 memo，这种方式可能导致不必要的重新渲染 */}
      <button onClick={() => onDelete(product.id)}>Delete</button>
    </div>
  );

  // 方案 2: 使用 useCallback
  const handleDelete = useCallback(() => {
    onDelete(product.id);
  }, [onDelete, product.id]);

  return (
    <div>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

### 3. 性能取舍

```javascript
function SearchBox({ onSearch }) {
  // ❌ 过度优化
  const handleChange = useCallback(
    (e) => {
      onSearch(e.target.value);
    },
    [onSearch]
  );

  // ✅ 在这种简单场景下，直接使用内联函数可能更好
  return (
    <input onChange={(e) => onSearch(e.target.value)} placeholder="Search..." />
  );
}
```

## 最佳实践

1. **仅在必要时使用**

   - 传递给使用 memo 的组件的回调
   - 回调被用作其他 Hook 的依赖项
   - 回调包含复杂的计算或依赖复杂的状态

2. **正确设置依赖项**

   - 包含所有回调中使用的外部值
   - 使用 ESLint 规则检查依赖项完整性

3. **避免过度优化**

   - 简单组件不需要 useCallback
   - 性能优化应该基于实际测量
