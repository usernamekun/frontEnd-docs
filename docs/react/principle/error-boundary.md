# React 错误边界实现原理

## 错误边界概述

错误边界(Error Boundaries)是 React 组件,它可以捕获子组件树中的 JavaScript 错误,记录错误并展示备用 UI。

## 实现原理

### 1. 基本结构

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新 state 使下一次渲染能够显示降级 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 可以将错误日志上报给服务器
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级 UI
      return this.props.fallback || <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### 2. 错误捕获机制

```javascript
function captureError(fiber: Fiber, errorInfo: CapturedValue<mixed>) {
  // 查找最近的错误边界
  let boundary = null;
  let errorBoundaryFound = false;
  let willRetry = false;
  let errorRetryLanes = NoLanes;

  // 向上遍历查找错误边界
  let node = fiber;
  while (node !== null) {
    if (node.tag === ClassComponent) {
      const instance = node.stateNode;
      if (typeof instance.componentDidCatch === "function") {
        if (!errorBoundaryFound) {
          errorBoundaryFound = true;
          boundary = node;
          willRetry = true;
        }
      }
    }
    node = node.return;
  }

  if (boundary !== null) {
    // 找到错误边界,触发更新
    const root = enqueueCapturedUpdate(boundary, errorInfo);
    retryTimedOutBoundary(boundary, retryLane);
  }
}

function enqueueCapturedUpdate(boundary: Fiber, error: CapturedValue<mixed>) {
  // 创建更新
  const update = createClassErrorUpdate(boundary, error);

  // 加入更新队列
  const fiber = boundary;
  const root = markUpdateLaneFromFiberToRoot(fiber);

  if (root !== null) {
    ensureRootIsScheduled(root);
  }

  return root;
}
```

### 3. 生命周期集成

```javascript
function throwException(
  root: FiberRoot,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: mixed,
  renderLanes: Lanes
): void {
  // 这是一个未捕获的错误
  sourceFiber.flags |= Incomplete;
  sourceFiber.firstEffect = sourceFiber.lastEffect = null;

  if (
    value !== null &&
    typeof value === "object" &&
    typeof value.then === "function"
  ) {
    // 这是一个 Promise
    const wakeable: Wakeable = (value: any);
    handleSuspense(sourceFiber, wakeable, renderLanes);
  } else {
    // 这是一个错误
    const error = value;
    captureError(sourceFiber, createCapturedValue(error, sourceFiber));
  }
}
```

### 4. 错误恢复机制

```javascript
function retryTimedOutBoundary(boundaryFiber: Fiber, retryLane: Lane) {
  // 检查是否可以重试
  if (retryLane === NoLane) {
    retryLane = requestRetryLane(boundaryFiber);
  }

  // 创建重试更新
  const update = createRootErrorUpdate(boundaryFiber, retryLane);

  // 加入更新队列
  enqueueUpdate(boundaryFiber, update);
  scheduleUpdateOnFiber(boundaryFiber, retryLane);
}

function createRootErrorUpdate(fiber: Fiber, lane: Lane): Update<mixed> {
  const update = createUpdate(lane);
  update.tag = ErrorUpdate;
  return update;
}
```

## 性能优化

### 1. 错误边界粒度

```javascript
// ❌ 粒度太大
function App() {
  return (
    <ErrorBoundary>
      <ComplexComponent />
    </ErrorBoundary>
  );
}

// ✅ 合理的粒度
function App() {
  return (
    <>
      <ErrorBoundary>
        <CriticalFeature />
      </ErrorBoundary>
      <ErrorBoundary>
        <NonCriticalFeature />
      </ErrorBoundary>
    </>
  );
}
```

### 2. 错误恢复策略

```javascript
class SmartErrorBoundary extends React.Component {
  state = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // 实现渐进式重试
    const retryAfter = Math.min(
      1000 * Math.pow(2, this.state.retryCount),
      30000
    );

    setTimeout(() => {
      this.setState((state) => ({
        hasError: false,
        retryCount: state.retryCount + 1,
      }));
    }, retryAfter);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorUI retryIn={this.state.retryCount} />;
    }
    return this.props.children;
  }
}
```

## 注意事项

1. **事件处理器错误**

   ```javascript
   // ❌ 错误边界不能捕获事件处理器中的错误
   function Button() {
     const onClick = () => {
       throw new Error("Event Error");
     };
     return <button onClick={onClick}>Click</button>;
   }

   // ✅ 使用 try-catch 处理
   function Button() {
     const onClick = () => {
       try {
         riskyOperation();
       } catch (error) {
         handleError(error);
       }
     };
     return <button onClick={onClick}>Click</button>;
   }
   ```

2. **异步错误处理**

   ```javascript
   // ❌ 错误边界不能捕获异步错误
   async function fetchData() {
     const response = await fetch("/api");
     const data = await response.json();
     if (!response.ok) throw new Error("API Error");
     return data;
   }

   // ✅ 使用错误边界配合 Suspense
   function AsyncComponent() {
     const data = use(fetchData());
     return <div>{data}</div>;
   }

   <ErrorBoundary>
     <Suspense fallback={<Loading />}>
       <AsyncComponent />
     </Suspense>
   </ErrorBoundary>;
   ```

3. **服务端渲染**

   ```javascript
   // ❌ 可能导致服务端渲染失败
   class ErrorBoundary extends React.Component {
     state = { hasError: false };

     componentDidCatch(error) {
       // 在服务端,这里不会被调用
       this.setState({ hasError: true });
     }
   }

   // ✅ 处理服务端渲染
   class ErrorBoundary extends React.Component {
     static getDerivedStateFromError(error) {
       // 这个方法在服务端和客户端都会被调用
       return { hasError: true };
     }

     componentDidCatch(error) {
       // 只在客户端记录错误
       if (typeof window !== "undefined") {
         logError(error);
       }
     }
   }
   ```
