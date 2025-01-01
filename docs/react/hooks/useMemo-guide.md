# useMemo 使用指南

## 核心使用场景

### 1. 跳过代价昂贵的重新计算

```javascript
function TodoList({ todos, tab, theme }) {
  // ✅ 仅在 todos 或 tab 变化时重新计算
  const visibleTodos = useMemo(() => {
    // 🔴 避免在没有依赖项变化时重复执行昂贵的过滤和排序
    const filtered = filterTodos(todos, tab);
    const sorted = sortTodos(filtered);
    return sorted;
  }, [todos, tab]);

  return (
    <div className={theme}>
      {visibleTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
```

### 2. 避免子组件的不必要重新渲染

```javascript
function ChartContainer({ data, dimensions }) {
  // ✅ 仅在数据或尺寸变化时重新创建配置
  const chartConfig = useMemo(() => ({
    data: processDataForChart(data),
    dimensions,
    options: {
      animation: true,
      responsive: true,
      maintainAspectRatio: false,
      // ... 其他配置项
    }
  }), [data, dimensions]);

  return (
    <Chart
      config={chartConfig} // Chart 是一个 memo 组件
    />
  );
}

const Chart = memo(function Chart({ config }) {
  // 仅当 config 引用改变时重新渲染
  return <canvas ref={/* ... */} />;
});
```

### 3. 记忆复杂对象以用作其他 Hook 的依赖

```javascript
function MapView({ points, selectedId }) {
  // ✅ 稳定化配置对象以避免 useEffect 不必要的重新运行
  const mapOptions = useMemo(
    () => ({
      center: calculateCenter(points),
      zoom: calculateZoom(points),
      markers: points.map((point) => ({
        position: { lat: point.lat, lng: point.lng },
        icon: point.id === selectedId ? "selected.png" : "normal.png",
      })),
    }),
    [points, selectedId]
  );

  useEffect(() => {
    const map = new GoogleMap(mapOptions);
    return () => map.destroy();
  }, [mapOptions]); // 依赖稳定的配置对象

  return <div id="map" />;
}
```

## 性能优化策略

### 1. 计算结果缓存

```javascript
function ProductCatalog({ products, filters }) {
  // ✅ 分层缓存计算结果
  const filteredProducts = useMemo(
    () => products.filter(applyFilters(filters)),
    [products, filters]
  );

  const sortedProducts = useMemo(
    () => [...filteredProducts].sort(sortByPrice),
    [filteredProducts] // 依赖上一层的计算结果
  );

  const groupedProducts = useMemo(
    () => groupByCategory(sortedProducts),
    [sortedProducts]
  );

  return (
    <div>
      {Object.entries(groupedProducts).map(([category, items]) => (
        <ProductGroup key={category} category={category} items={items} />
      ))}
    </div>
  );
}
```

### 2. 条件性缓存

```javascript
function SearchResults({ query, filters }) {
  // ✅ 根据条件决定是否使用缓存
  const searchResults = useMemo(() => {
    // 只有当查询字符串足够长时才执行复杂搜索
    if (query.length < 3) {
      return [];
    }

    return performExpensiveSearch(query, filters);
  }, [query, filters]);

  // 使用 transition 处理搜索状态
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      {isPending ? <LoadingSpinner /> : <ResultsList results={searchResults} />}
    </div>
  );
}
```

## 注意事项

### 1. 避免过早优化

```javascript
// ❌ 不需要 useMemo 的简单计算
function Profile({ user }) {
  const fullName = useMemo(
    () => `${user.firstName} ${user.lastName}`,
    [user.firstName, user.lastName]
  );

  // ✅ 直接计算就好
  const fullNameSimple = `${user.firstName} ${user.lastName}`;

  return <h1>{fullNameSimple}</h1>;
}
```

### 2. 正确的依赖收集

```javascript
function UserProfile({ user, theme }) {
  // ❌ 错误：遗漏依赖项
  const userStyle = useMemo(
    () => ({
      backgroundColor: theme.background,
      color: theme.text,
    }),
    []
  ); // 应该包含 theme

  // ✅ 正确：包含所有依赖项
  const userStyleFixed = useMemo(
    () => ({
      backgroundColor: theme.background,
      color: theme.text,
    }),
    [theme.background, theme.text]
  );

  return <div style={userStyleFixed}>{user.name}</div>;
}
```

### 3. 内存使用考虑

```javascript
function DataGrid({ data }) {
  // ❌ 可能导致内存问题的缓存
  const hugeData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      // 存储大量额外数据
      extraData: generateHugeObject(item),
    }));
  }, [data]);

  // ✅ 更好的方式：按需计算或分页处理
  const visibleData = useMemo(() => {
    return data.slice(startIndex, endIndex).map((item) => ({
      ...item,
      extraData: generateHugeObject(item),
    }));
  }, [data, startIndex, endIndex]);

  return <Table data={visibleData} />;
}
```

## 最佳实践

1. **选择性使用**

   - 计算代价昂贵的场景
   - 需要保持引用相等的对象
   - 作为其他 Hook 的依赖项

2. **优化策略**

   - 将复杂计算拆分为多个 useMemo
   - 使用 React Profiler 识别性能瓶颈
   - 考虑使用 Web Workers 处理极其耗时的计算

3. **依赖管理**

   - 确保依赖项列表完整
   - 考虑使用 useCallback 配合 useMemo
   - 使用 ESLint 插件检查依赖项
