# React Suspense 实现原理

## Suspense 概述

Suspense 允许组件在渲染之前等待某些操作完成,比如数据加载。它可以:

1. 展示加载状态
2. 协调加载顺序
3. 防止加载状态闪烁
4. 支持流式 SSR

## 实现原理

### 1. 基本结构

```typescript
interface SuspenseState {
  dehydrated: null | DehydratedFragment;
  treeContext: null | TreeContext;
  retryLane: Lane;
  children: any;
  fallback: ReactElement;
}

interface SuspenseContext {
  showFallback: boolean;
  suspenseId: null | SuspenseId;
  isBackwards: boolean;
}

function Suspense(props: Props) {
  const { children, fallback = null, suspenseCallback = null } = props;

  return {
    $$typeof: REACT_SUSPENSE_TYPE,
    type: REACT_SUSPENSE_TYPE,
    key: null,
    ref: null,
    props: {
      children,
      fallback,
      suspenseCallback,
    },
  };
}
```

### 2. 挂起机制

```javascript
function throwException(root: FiberRoot, value: mixed, lanes: Lanes): void {
  if (value !== null && typeof value === "object") {
    if (typeof value.then === "function") {
      // 这是一个 Promise
      const wakeable: Wakeable = (value: any);

      // 获取当前 Suspense 边界
      const suspenseBoundary = getNearestSuspenseBoundary();

      // 添加到等待列表
      const thrownValue = {
        $$typeof: REACT_SUSPENSE_TYPE,
        promise: wakeable,
        result: null,
        error: null,
      };

      // 标记需要挂起
      suspenseBoundary.flags |= ShouldCapture;

      // 切换到 fallback
      const root = enqueueSuspenseUpdate(suspenseBoundary, thrownValue, lanes);

      scheduleUpdateOnFiber(root, suspenseBoundary, lanes);
    }
  }
}

function suspenseWorkLoop() {
  // 检查是否有挂起的组件
  while (workInProgress !== null) {
    if (workInProgress.flags & ShouldCapture) {
      // 显示 fallback
      showFallback(workInProgress);
    } else {
      // 继续渲染
      performUnitOfWork(workInProgress);
    }
  }
}
```

### 3. 恢复机制

```javascript
function updateSuspenseComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
) {
  const nextProps = workInProgress.pendingProps;

  // 检查是否可以显示内容
  if (shouldAttemptToRenderChildren()) {
    // 尝试渲染子组件
    const prevCapturedValues = suspenseHandlerStackCursor.current;
    const prevDidTimeout = workInProgress.memoizedState !== null;

    try {
      // 渲染子组件
      const children = nextProps.children;
      reconcileChildren(current, workInProgress, children, renderLanes);

      // 渲染成功,清除 fallback
      workInProgress.memoizedState = null;
    } catch (error) {
      if (shouldCapture(error)) {
        // 渲染失败,显示 fallback
        const fallback = nextProps.fallback;
        reconcileChildren(current, workInProgress, fallback, renderLanes);

        // 保存状态
        workInProgress.memoizedState = {
          dehydrated: null,
          retryLane: NoLane,
          treeContext: null,
        };
      }
    }
  }

  return workInProgress.child;
}
```

### 4. 资源管理

```javascript
// 资源缓存
const resourceCache = new Map();

function preloadResource(resource) {
  if (!resourceCache.has(resource)) {
    const promise = resource.preload();
    resourceCache.set(resource, {
      status: "pending",
      value: null,
      promise,
    });

    promise.then(
      (value) => {
        resourceCache.set(resource, {
          status: "resolved",
          value,
          promise: null,
        });
      },
      (error) => {
        resourceCache.set(resource, {
          status: "rejected",
          value: error,
          promise: null,
        });
      }
    );
  }
  return resourceCache.get(resource);
}

// 资源读取
function readResource(resource) {
  const cached = resourceCache.get(resource);
  if (!cached) {
    throw preloadResource(resource).promise;
  }

  switch (cached.status) {
    case "pending":
      throw cached.promise;
    case "rejected":
      throw cached.value;
    case "resolved":
      return cached.value;
  }
}
```

## 性能优化

### 1. 加载优先级

```javascript
function SuspenseList({ children, revealOrder = "forwards" }) {
  return {
    $$typeof: REACT_SUSPENSE_LIST_TYPE,
    type: REACT_SUSPENSE_LIST_TYPE,
    key: null,
    ref: null,
    props: {
      children,
      revealOrder,
    },
  };
}

// 使用示例
function LoadSequence() {
  return (
    <SuspenseList revealOrder="forwards">
      <Suspense fallback={<Spinner />}>
        <SlowComponent1 />
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <SlowComponent2 />
      </Suspense>
    </SuspenseList>
  );
}
```

### 2. 预加载策略

```javascript
// 资源预加载
const imageResource = {
  preload() {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/large-image.jpg";
      img.onload = () => resolve(img);
    });
  },
};

// 组件使用
function ImageComponent() {
  const image = use(imageResource);
  return <img src={image.src} />;
}

// 提前预加载
function App() {
  // 路由切换前预加载
  const preloadImage = () => {
    preloadResource(imageResource);
  };

  return (
    <Link onMouseEnter={preloadImage}>
      <Suspense fallback={<Spinner />}>
        <ImageComponent />
      </Suspense>
    </Link>
  );
}
```

## 注意事项

1. **避免瀑布流请求**

   ```javascript
   // ❌ 串行加载
   function Profile() {
     const user = use(fetchUser());
     const posts = use(fetchUserPosts(user.id)); // 等待用户数据
     return <PostList posts={posts} />;
   }

   // ✅ 并行加载
   function Profile() {
     const userPromise = fetchUser();
     const postsPromise = fetchUserPosts(); // 同时开始加载

     const user = use(userPromise);
     const posts = use(postsPromise);

     return <PostList posts={posts} />;
   }
   ```

2. **合理的 Suspense 边界**

   ```javascript
   // ❌ 粒度太细
   function UserList({ users }) {
     return users.map((user) => (
       <Suspense fallback={<Spinner />}>
         <UserCard user={user} />
       </Suspense>
     ));
   }

   // ✅ 合适的粒度
   function UserList({ users }) {
     return (
       <Suspense fallback={<ListSkeleton />}>
         {users.map((user) => (
           <UserCard user={user} />
         ))}
       </Suspense>
     );
   }
   ```

3. **错误处理**

   ```javascript
   // ❌ 缺少错误处理
   function AsyncComponent() {
     const data = use(fetchData());
     return <div>{data}</div>;
   }

   // ✅ 完整的错误处理
   function AsyncComponent() {
     return (
       <ErrorBoundary fallback={<ErrorMessage />}>
         <Suspense fallback={<Loading />}>
           <DataComponent />
         </Suspense>
       </ErrorBoundary>
     );
   }
   ```
