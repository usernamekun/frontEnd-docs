# React 并发模式实现原理

## 并发模式概述

并发模式(Concurrent Mode)是 React 的新特性,它允许 React 中断渲染工作,使得:

1. 可以响应高优先级更新
2. 保持 UI 响应
3. 在后台准备新的内容
4. 避免不必要的加载状态

## 实现原理

### 1. 时间切片

```javascript
// 时间切片实现
function workLoopConcurrent() {
  // 循环处理工作单元
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

function shouldYield() {
  // 检查是否需要让出执行权
  const currentTime = getCurrentTime();
  if (currentTime >= deadline) {
    // 有高优先级任务或已超时,应该让出执行权
    if (needsPaint || scheduling.isInputPending()) {
      return true;
    }
  }
  return false;
}

// 调度一个时间片
const channel = new MessageChannel();
const port = channel.port2;
requestHostCallback = function (callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
};
```

### 2. 优先级调度

```typescript
// 优先级定义
type Lane = number;
type Lanes = number;

const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;
const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
const InputContinuousLane: Lane = /*             */ 0b0000000000000000000000000000100;
const DefaultLane: Lane = /*                     */ 0b0000000000000000000000000010000;
const IdleLane: Lane = /*                        */ 0b0100000000000000000000000000000;

// 优先级调度实现
function scheduleUpdateOnFiber(fiber: Fiber, lane: Lane) {
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);
  if (root === null) {
    return null;
  }

  // 标记根节点有更新
  markRootUpdated(root, lane);

  if (lane === SyncLane) {
    // 同步更新
    performSyncWorkOnRoot(root);
  } else {
    // 异步更新
    ensureRootIsScheduled(root);
  }
}

// 优先级合并
function mergeLanes(a: Lanes, b: Lanes): Lanes {
  return a | b;
}
```

### 3. 可中断渲染

```javascript
function renderRootConcurrent(root: FiberRoot) {
  const finishedWork = root.current.alternate;

  // 开始工作循环
  do {
    try {
      workLoopConcurrent();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);

  // 完成渲染
  if (workInProgress !== null) {
    // 还有工作要做
    return RootIncomplete;
  } else {
    // 渲染完成
    root.finishedWork = finishedWork;
    root.finishedLanes = lanes;
    return RootCompleted;
  }
}

// 工作循环的实现
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

### 4. Suspense 集成

```javascript
function updateSuspenseComponent(current, workInProgress) {
  const nextProps = workInProgress.pendingProps;

  // 检查是否需要挂起
  if (shouldSuspend(workInProgress)) {
    const suspenseContext = suspenseStackCursor.current;

    // 显示 fallback
    const nextFallbackChildren = nextProps.fallback;
    const nextPrimaryChildren = nextProps.children;

    // 构建 Suspense 树
    const fallbackFragment = mountSuspenseFallbackChildren(
      workInProgress,
      nextPrimaryChildren,
      nextFallbackChildren,
      suspenseContext
    );

    workInProgress.child = fallbackFragment;
    return fallbackFragment;
  } else {
    // 正常渲染
    return updateSuspenseNormalChildren(
      current,
      workInProgress,
      nextProps.children
    );
  }
}
```

## 性能优化

### 1. 优先级管理

```javascript
function ensureRootIsScheduled(root: FiberRoot) {
  const nextLanes = getNextLanes(root, NoLanes);

  // 获取最高优先级
  const newCallbackPriority = getHighestPriorityLane(nextLanes);

  // 取消低优先级任务
  if (existingCallbackPriority !== newCallbackPriority) {
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }

    // 调度新任务
    let newCallbackNode;
    if (newCallbackPriority === SyncLane) {
      newCallbackNode = scheduleSyncCallback(
        performSyncWorkOnRoot.bind(null, root)
      );
    } else {
      const schedulerPriorityLevel =
        lanesToSchedulerPriority(newCallbackPriority);

      newCallbackNode = scheduleCallback(
        schedulerPriorityLevel,
        performConcurrentWorkOnRoot.bind(null, root)
      );
    }

    root.callbackNode = newCallbackNode;
    root.callbackPriority = newCallbackPriority;
  }
}
```

### 2. 批量更新

```javascript
// 自动批处理
function batchedUpdates<A, R>(fn: (A) => R): R {
  const prevExecutionContext = executionContext;
  executionContext |= BatchedContext;
  try {
    return fn();
  } finally {
    executionContext = prevExecutionContext;
    if (executionContext === NoContext) {
      // 刷新同步队列
      flushSyncCallbackQueue();
    }
  }
}

// 使用示例
function handleClick() {
  batchedUpdates(() => {
    setCount((c) => c + 1);
    setFlag((f) => !f);
  });
}
```

## 注意事项

1. **优先级设置**

   ```javascript
   // ❌ 不恰当的优先级
   function handleScroll() {
     startTransition(() => {
       // 滚动处理不应该使用 transition
       setScrollPosition(newPosition);
     });
   }

   // ✅ 合理的优先级
   function handleScroll() {
     // 滚动应该立即响应
     setScrollPosition(newPosition);
   }
   ```

2. **避免优先级饥饿**

   ```javascript
   // ❌ 可能导致低优先级任务饥饿
   function processQueue() {
     startTransition(() => {
       while (queue.length > 0) {
         processItem(queue.pop());
       }
     });
   }

   // ✅ 分批处理
   function processQueue() {
     startTransition(() => {
       const batch = queue.splice(0, 100);
       batch.forEach(processItem);

       if (queue.length > 0) {
         scheduleCallback(IdlePriority, processQueue);
       }
     });
   }
   ```

3. **合理使用 Suspense**

   ```javascript
   // ❌ 过度使用 Suspense
   function App() {
     return (
       <Suspense fallback={<Loading />}>
         <Suspense fallback={<Loading />}>
           <Component1 />
         </Suspense>
         <Suspense fallback={<Loading />}>
           <Component2 />
         </Suspense>
       </Suspense>
     );
   }

   // ✅ 合理的粒度
   function App() {
     return (
       <Suspense fallback={<PageLoading />}>
         <Layout>
           <Suspense fallback={<ContentLoading />}>
             <Content />
           </Suspense>
         </Layout>
       </Suspense>
     );
   }
   ```
