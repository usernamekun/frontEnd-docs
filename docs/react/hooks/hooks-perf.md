# React Hooks 性能优化

## useCallback 使用场景

useCallback 主要用于缓存函数引用,适用于以下场景:

### 1. 传递回调给优化的子组件

```javascript
// ✅ 适合使用 useCallback 的场景
function Parent() {
  const [items, setItems] = useState([]);

  const handleDelete = useCallback((id) => {
    setItems((items) => items.filter((item) => item.id !== id));
  }, []); // 不依赖外部变量,空依赖数组

  return (
    <ExpensiveChild
      onDelete={handleDelete} // 传递给使用 memo 的子组件
    />
  );
}

const ExpensiveChild = memo(function ({ onDelete }) {
  console.log("ExpensiveChild render");
  return <button onClick={onDelete}>Delete</button>;
});
```

### 2. 回调函数作为其他 Hook 的依赖

```javascript
function SearchResults() {
  const [query, setQuery] = useState("");

  // ✅ 缓存 fetchData 以避免 useEffect 不必要的触发
  const fetchData = useCallback(async () => {
    const result = await axios.get(`/api/search?q=${query}`);
    return result.data;
  }, [query]); // 仅在 query 改变时更新函数

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData 作为 useEffect 的依赖

  return <div>{/* 渲染搜索结果 */}</div>;
}
```

### 3. 防止非优化组件的重复渲染

```javascript
// ❌ 不必要的 useCallback
function SimpleComponent() {
  const handleClick = useCallback(() => {
    console.log("Clicked");
  }, []); // 对于简单组件,这是过度优化

  return <button onClick={handleClick}>Click me</button>;
}

// ✅ 复杂组件中合理使用
function ComplexComponent() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");

  const handleFilter = useCallback(
    (event) => {
      const value = event.target.value;
      setFilter(value);
      // 复杂的过滤逻辑
      const filtered = complexFilter(items, value);
      setItems(filtered);
    },
    [items]
  ); // 仅在 items 变化时更新函数

  return (
    <div>
      <ExpensiveFilter onChange={handleFilter} />
      <ExpensiveList items={items} />
    </div>
  );
}
```

## useMemo 使用场景

useMemo 用于缓存计算结果,适用于以下场景:

### 1. 昂贵的计算

```javascript
function DataGrid({ data, config }) {
  // ✅ 缓存复杂计算结果
  const processedData = useMemo(() => {
    return data.map((item) => {
      // 复杂的数据处理
      const processed = complexProcessing(item);
      const calculated = expensiveCalculation(processed);
      return {
        ...item,
        processed,
        calculated,
      };
    });
  }, [data]); // 仅在 data 变化时重新计算

  return <Table data={processedData} />;
}
```

### 2. 避免子组件不必要的重渲染

```javascript
function ParentComponent({ items, tab }) {
  // ✅ 缓存派生数据
  const filteredItems = useMemo(() => {
    return items.filter((item) => item.type === tab);
  }, [items, tab]);

  return (
    <div>
      <ExpensiveChild items={filteredItems} />
      <OtherChild /> {/* 父组件重渲染时不会影响这个子组件 */}
    </div>
  );
}

const ExpensiveChild = memo(function ({ items }) {
  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});
```

### 3. 引用相等性很重要的场景

```javascript
function MapComponent({ points }) {
  // ✅ 保持配置对象的引用稳定
  const options = useMemo(
    () => ({
      center: calculateCenter(points),
      zoom: calculateZoom(points),
      markers: points.map((p) => ({
        position: { lat: p.lat, lng: p.lng },
      })),
    }),
    [points]
  );

  return <GoogleMap options={options} />;
}
```

## 注意事项

1. **避免过度使用**

```javascript
// ❌ 简单值不需要 useMemo
function Counter() {
  const count = useMemo(() => 1 + 2, []); // 过度优化
  return <div>{count}</div>;
}

// ✅ 合适的使用场景
function Counter({ value }) {
  const expensiveValue = useMemo(() => {
    return complexCalculation(value); // 耗时的计算
  }, [value]);

  return <div>{expensiveValue}</div>;
}
```

2. **正确的依赖管理**

```javascript
// ❌ 错误的依赖管理
function SearchBar({ onSearch }) {
  const handleChange = useCallback((e) => {
    onSearch(e.target.value);
  }, []); // 缺少 onSearch 依赖

  // ✅ 正确的依赖
  const handleChangeFixed = useCallback(
    (e) => {
      onSearch(e.target.value);
    },
    [onSearch]
  ); // 包含所有外部依赖
}
```

3. **性能权衡**

```javascript
// ❌ 过度优化可能导致性能更差
function List({ items }) {
  const processedItems = useMemo(() => {
    return items.map((item) => item.name); // 简单操作不需要缓存
  }, [items]);

  // ✅ 值得缓存的场景
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // 复杂的排序逻辑
      return complexSort(a, b);
    });
  }, [items]);
}
```
