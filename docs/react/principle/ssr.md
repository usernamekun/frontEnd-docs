# React 服务端渲染实现原理

## SSR 概述

服务端渲染(Server Side Rendering)允许在服务器上渲染 React 组件,可以:

1. 提升首屏加载性能
2. 优化 SEO
3. 支持流式渲染
4. 实现同构应用

## 实现原理

### 1. 渲染流程

```javascript
// 服务端入口
async function renderToHTML(req, res) {
  // 1. 创建 ServerContext
  const context = createServerContext(req);

  // 2. 数据预取
  const dataPromises = matchRoutes(routes, req.url).map(({ route, match }) => {
    return route.loader ? route.loader(match.params) : Promise.resolve(null);
  });
  const data = await Promise.all(dataPromises);

  // 3. 渲染 HTML
  const stream = renderToPipeableStream(
    <DataContext.Provider value={data}>
      <StaticRouter location={req.url}>
        <App />
      </StaticRouter>
    </DataContext.Provider>,
    {
      bootstrapScripts: ["/client.js"],
      onShellReady() {
        res.setHeader("content-type", "text/html");
        stream.pipe(res);
      },
      onError(error) {
        console.error(error);
        res.statusCode = 500;
        res.end("Internal Server Error");
      },
    }
  );
}
```

### 2. 数据注水和脱水

```javascript
// 服务端数据注水
function dehydrate(data) {
  const dehydratedState = {
    queries: {},
    mutations: {},
    subscriptions: {},
  };

  // 序列化数据
  for (const [queryKey, queryData] of Object.entries(data)) {
    dehydratedState.queries[queryKey] = {
      data: queryData,
      dataUpdateCount: 1,
    };
  }

  return dehydratedState;
}

// 客户端数据脱水
function hydrate(dehydratedState) {
  const cache = new Map();

  // 恢复数据
  for (const [queryKey, { data }] of Object.entries(dehydratedState.queries)) {
    cache.set(queryKey, {
      data,
      subscribers: new Set(),
    });
  }

  return cache;
}

// 使用示例
function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 客户端hydrate
    if (typeof window !== "undefined") {
      const dehydratedState = window.__INITIAL_DATA__;
      queryClient.hydrate(dehydratedState);
    }
  }, []);

  return <div>{/* 应用内容 */}</div>;
}
```

### 3. 流式渲染

```javascript
function renderToStream(element) {
  const encoder = new TextEncoder();
  let bootstrapped = false;

  return new ReadableStream({
    start(controller) {
      // 初始 HTML
      controller.enqueue(
        encoder.encode("<!DOCTYPE html><html><head></head><body>")
      );

      const stream = renderToPipeableStream(element, {
        onShellReady() {
          // Shell 完成
          bootstrapped = true;
        },
        onAllReady() {
          // 所有内容完成
          controller.enqueue(encoder.encode("</body></html>"));
          controller.close();
        },
        onError(error) {
          // 错误处理
          console.error(error);
          controller.error(error);
        },
      });

      stream.pipe({
        write(chunk) {
          controller.enqueue(encoder.encode(chunk));
        },
      });
    },
  });
}
```

### 4. 选择性注水

```javascript
// 组件级注水控制
const SelectiveHydration = {
  // 标记需要注水的组件
  markNeedHydration(fiber) {
    fiber.flags |= NeedHydration;
  },

  // 检查是否需要注水
  shouldHydrate(fiber) {
    return (fiber.flags & NeedHydration) !== 0;
  },

  // 执行注水
  hydrate(fiber) {
    const root = fiber.stateNode;
    const container = root.containerInfo;
    const hostParent = getHostParent(fiber);

    hydrateFiber(fiber, hostParent, container);
  },
};

// 使用示例
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <SelectiveHydration>
        <Component />
      </SelectiveHydration>
    </Suspense>
  );
}
```

## 性能优化

### 1. 缓存策略

```javascript
// 页面级缓存
const cache = new Map();

async function renderPage(url) {
  // 检查缓存
  if (cache.has(url)) {
    const cached = cache.get(url);
    if (!isStale(cached)) {
      return cached.html;
    }
  }

  // 渲染页面
  const html = await renderToString(<App url={url} />);

  // 存入缓存
  cache.set(url, {
    html,
    timestamp: Date.now(),
  });

  return html;
}

// 组件级缓存
const ComponentCache = {
  cache: new Map(),

  get(key) {
    return this.cache.get(key);
  },

  set(key, value, ttl = 60000) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  },

  clear() {
    this.cache.clear();
  },
};
```

### 2. 代码分割

```javascript
// 动态导入组件
const DynamicComponent = lazy(() => import("./Component"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <DynamicComponent />
    </Suspense>
  );
}

// 服务端处理
async function preloadComponent(Component) {
  if (typeof Component.preload === "function") {
    await Component.preload();
  }
  return Component;
}
```

## 注意事项

1. **避免状态不一致**

   ```javascript
   // ❌ 服务端和客户端状态不同步
   function App() {
     const [count, setCount] = useState(
       typeof window !== "undefined" ? window.initialCount : 0
     );
     return <div>{count}</div>;
   }

   // ✅ 使用统一的初始状态
   function App() {
     const [count, setCount] = useState(getInitialState("count"));
     return <div>{count}</div>;
   }
   ```

2. **处理副作用**

   ```javascript
   // ❌ 服务端不应该有浏览器相关的副作用
   useEffect(() => {
     window.addEventListener("scroll", onScroll);
   }, []);

   // ✅ 使用条件判断
   useEffect(() => {
     if (typeof window !== "undefined") {
       window.addEventListener("scroll", onScroll);
       return () => window.removeEventListener("scroll", onScroll);
     }
   }, []);
   ```

3. **数据预取**

   ```javascript
   // ❌ 客户端渲染时重复请求
   function Page() {
     const { data } = useQuery("key", fetchData);
     return <div>{data}</div>;
   }

   // ✅ 预取并复用数据
   function Page({ dehydratedState }) {
     const queryClient = useQueryClient();

     useEffect(() => {
       queryClient.setQueryData("key", dehydratedState);
     }, []);

     const { data } = useQuery("key", fetchData, {
       initialData: dehydratedState,
     });

     return <div>{data}</div>;
   }
   ```
