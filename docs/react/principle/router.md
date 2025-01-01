# React 路由实现原理

## 路由系统概述

React 路由系统负责管理视图之间的导航,主要功能包括:

1. URL 管理
2. 视图匹配和渲染
3. 导航状态维护
4. 代码分割

## 实现原理

### 1. 路由管理器

```typescript
interface History {
  length: number;
  location: Location;
  action: Action;
  push(path: string, state?: any): void;
  replace(path: string, state?: any): void;
  go(n: number): void;
  goBack(): void;
  goForward(): void;
  block(prompt?: string | boolean | BlockerFunction): UnregisterCallback;
  listen(listener: LocationListener): UnregisterCallback;
}

class Router {
  history: History;
  routes: Route[];

  constructor(options: RouterOptions) {
    this.history = options.history || createBrowserHistory();
    this.routes = options.routes || [];

    // 监听路由变化
    this.history.listen(({ location, action }) => {
      this.handleLocationChange(location);
    });
  }

  handleLocationChange(location: Location) {
    // 匹配路由
    const matches = matchRoutes(this.routes, location.pathname);

    // 渲染对应组件
    if (matches) {
      const route = matches[matches.length - 1].route;
      this.renderRoute(route, matches);
    }
  }
}
```

### 2. 路由匹配

```javascript
function matchRoutes(routes, pathname) {
  const matches = [];

  // 递归匹配路由
  function matchRoutesRecursively(routes, pathname, parentParams = {}) {
    routes.some((route) => {
      // 解析路径参数
      const match = matchPath(pathname, {
        path: route.path,
        exact: route.exact,
      });

      if (match) {
        matches.push({
          route,
          match: {
            ...match,
            params: {
              ...parentParams,
              ...match.params,
            },
          },
        });

        // 继续匹配子路由
        if (route.routes) {
          matchRoutesRecursively(route.routes, pathname, match.params);
        }
      }

      return match;
    });
  }

  matchRoutesRecursively(routes, pathname);
  return matches;
}

// 路径匹配
function matchPath(pathname, options) {
  const { path, exact = false } = options;
  const pattern = pathToRegexp(path);
  const match = pattern.exec(pathname);

  if (!match) return null;

  const [url, ...values] = match;
  const isExact = pathname === url;

  if (exact && !isExact) return null;

  return {
    path,
    url,
    isExact,
    params: pattern.keys.reduce((memo, key, index) => {
      memo[key.name] = values[index];
      return memo;
    }, {}),
  };
}
```

### 3. 导航守卫

```javascript
class RouterGuard {
  guards: Guard[] = [];

  // 添加守卫
  addGuard(guard: Guard) {
    this.guards.push(guard);
    return () => {
      const index = this.guards.indexOf(guard);
      if (index > -1) this.guards.splice(index, 1);
    };
  }

  // 执行守卫链
  async runGuards(to: Route, from: Route) {
    for (const guard of this.guards) {
      const result = await guard(to, from);

      if (result === false) {
        // 取消导航
        return false;
      } else if (typeof result === "string") {
        // 重定向
        return result;
      }
    }

    return true;
  }
}

// 使用示例
router.beforeEach(async (to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return "/login";
  }
  return true;
});
```

### 4. 代码分割

```javascript
// 异步路由组件
const AsyncComponent = loadable({
  loader: () => import("./Component"),
  loading: Loading,
  delay: 200,
  timeout: 10000,
});

// 路由配置
const routes = [
  {
    path: "/dashboard",
    component: AsyncComponent,
    preload: () => import("./Component"),
  },
];

// 预加载实现
function preloadRoute(route) {
  if (typeof route.preload === "function") {
    route.preload();
  }

  if (route.routes) {
    route.routes.forEach(preloadRoute);
  }
}
```

## 性能优化

### 1. 路由缓存

```javascript
// 路由缓存管理
class RouteCache {
  cache = new Map();
  maxSize = 10;

  set(key: string, component: React.ComponentType) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      component,
      timestamp: Date.now(),
    });
  }

  get(key: string) {
    return this.cache.get(key)?.component;
  }
}

// 缓存路由组件
function CachedRoute({ path, component: Component }) {
  const cache = useContext(RouteCacheContext);
  const key = `${path}-${Component.name}`;

  let CachedComponent = cache.get(key);
  if (!CachedComponent) {
    CachedComponent = Component;
    cache.set(key, CachedComponent);
  }

  return <CachedComponent />;
}
```

### 2. 导航优化

```javascript
// 路由预加载
function Link({ to, children }) {
  const prefetch = () => {
    const route = findRoute(to);
    if (route?.preload) {
      route.preload();
    }
  };

  return (
    <a
      href={to}
      onMouseEnter={prefetch}
      onClick={(e) => {
        e.preventDefault();
        router.push(to);
      }}
    >
      {children}
    </a>
  );
}

// 批量预加载
function prefetchRoutes(routes) {
  return Promise.all(
    routes.map((route) =>
      typeof route.preload === "function" ? route.preload() : Promise.resolve()
    )
  );
}
```

## 注意事项

1. **避免重复渲染**

   ```javascript
   // ❌ 每次更新都重新创建路由配置
   function App() {
     const routes = [{ path: "/home", component: Home }];
     return <Router routes={routes} />;
   }

   // ✅ 使用固定的路由配置
   const routes = [{ path: "/home", component: Home }];

   function App() {
     return <Router routes={routes} />;
   }
   ```

2. **合理的代码分割**

   ```javascript
   // ❌ 过度分割
   const routes = [
     {
       path: "/dashboard",
       component: loadable(() => import("./Dashboard")),
       routes: [
         {
           path: "/dashboard/overview",
           component: loadable(() => import("./Overview")),
         },
       ],
     },
   ];

   // ✅ 适当的分割粒度
   const routes = [
     {
       path: "/dashboard",
       component: loadable(() =>
         import("./Dashboard").then((module) => ({
           default: module.Dashboard,
           Overview: module.Overview,
         }))
       ),
     },
   ];
   ```

3. **状态持久化**

   ```javascript
   // ❌ 路由切换丢失状态
   function UserList() {
     const [filter, setFilter] = useState("");
     return (
       <div>
         <input value={filter} onChange={(e) => setFilter(e.target.value)} />
         <List filter={filter} />
       </div>
     );
   }

   // ✅ 使用 URL 参数保持状态
   function UserList() {
     const [params] = useSearchParams();
     const filter = params.get("filter") || "";

     return (
       <div>
         <input
           value={filter}
           onChange={(e) => {
             const newParams = new URLSearchParams(params);
             newParams.set("filter", e.target.value);
             setSearchParams(newParams);
           }}
         />
         <List filter={filter} />
       </div>
     );
   }
   ```
