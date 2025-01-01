# Fiber 架构原理

## 什么是 Fiber

Fiber 是 React 16 引入的新的协调引擎,它的主要目标是支持虚拟 DOM 的增量渲染。

### 1. 设计目标

- **增量渲染**: 将渲染工作分解为小单元
- **可中断**: 能暂停工作,稍后继续
- **优先级**: 为不同类型的更新分配优先级

### 2. 基本概念

```typescript
interface Fiber {
  // 静态数据结构
  type: any;
  key: null | string;
  elementType: any;

  // 实例
  stateNode: any;

  // Fiber 关系
  return: Fiber | null; // 父节点
  child: Fiber | null; // 第一个子节点
  sibling: Fiber | null; // 下一个兄弟节点

  // 工作单元
  pendingProps: any;
  memoizedProps: any;
  updateQueue: UpdateQueue<any> | null;
  memoizedState: any;

  // 副作用
  flags: Flags;
  subtreeFlags: Flags;
  deletions: Array<Fiber> | null;

  // 调度
  lanes: Lanes;
  childLanes: Lanes;
}
```

## 工作原理

### 1. 双缓冲技术

```javascript
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    // 创建新的 Fiber
    workInProgress = createFiber(current.tag, pendingProps, current.key);

    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用已有的 Fiber
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }

  return workInProgress;
}
```

### 2. 工作循环

```javascript
function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && workInProgressRoot) {
    // 完成一次渲染
    completeRoot();
  }

  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
  // 1. 处理当前 Fiber
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 2. 返回下一个工作单元
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.return;
  }
}
```

### 3. 优先级调度

```javascript
const NoLanes = 0b0000;
const SyncLane = 0b0001;
const InputContinuousLane = 0b0010;
const DefaultLane = 0b0100;
const IdleLane = 0b1000;

function schedulerPriority(lane) {
  switch (lane) {
    case SyncLane:
      return ImmediatePriority;
    case InputContinuousLane:
      return UserBlockingPriority;
    case DefaultLane:
      return NormalPriority;
    case IdleLane:
      return IdlePriority;
    default:
      return NormalPriority;
  }
}
```

## 渲染过程

### 1. Render 阶段

```javascript
function beginWork(current, workInProgress) {
  // 根据 fiber.tag 处理不同类型的组件
  switch (workInProgress.tag) {
    case FunctionComponent: {
      const Component = workInProgress.type;
      const props = workInProgress.pendingProps;
      const children = Component(props);
      reconcileChildren(current, workInProgress, children);
      return workInProgress.child;
    }
    case HostComponent: {
      // 处理原生 DOM 元素
      const type = workInProgress.type;
      const props = workInProgress.pendingProps;
      let children = props.children;

      // 更新 DOM 属性
      updateHostComponent(current, workInProgress, type, props);
      reconcileChildren(current, workInProgress, children);
      return workInProgress.child;
    }
  }
}
```

### 2. Commit 阶段

```javascript
function commitRoot(root) {
  const finishedWork = root.finishedWork;

  // 处理副作用列表
  let nextEffect = finishedWork.firstEffect;

  do {
    const flags = nextEffect.flags;

    // 处理不同类型的副作用
    if (flags & Placement) {
      commitPlacement(nextEffect);
    }
    if (flags & Update) {
      commitUpdate(nextEffect);
    }
    if (flags & Deletion) {
      commitDeletion(nextEffect);
    }

    nextEffect = nextEffect.nextEffect;
  } while (nextEffect !== null);
}
```

## 并发特性

### 1. 时间切片

```javascript
const ENOUGH_TIME = 1; // 1ms

function shouldYield() {
  const currentTime = getCurrentTime();
  if (currentTime >= deadline) {
    // 检查是否有更高优先级的任务
    if (needsPaint || scheduling.hasHigherPriorityWork()) {
      return true;
    }
  }
  return false;
}
```

### 2. 优先级中断

```javascript
function ensureRootIsScheduled(root) {
  const nextLanes = getNextLanes(root);

  if (nextLanes === NoLanes) {
    return;
  }

  const newCallbackPriority = getHighestPriorityLane(nextLanes);
  const existingCallbackPriority = root.callbackPriority;

  if (existingCallbackPriority === newCallbackPriority) {
    return;
  }

  // 取消现有的调度并创建新的
  if (existingCallbackNode !== null) {
    cancelCallback(existingCallbackNode);
  }

  const newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}
```

## 性能优化

### 1. 批量更新

```javascript
function batchedUpdates(fn) {
  const prevIsBatchingUpdates = isBatchingUpdates;
  isBatchingUpdates = true;
  try {
    return fn();
  } finally {
    isBatchingUpdates = prevIsBatchingUpdates;
    if (!isBatchingUpdates) {
      flushSyncCallbacks();
    }
  }
}
```

### 2. 优先级排序

```javascript
function markUpdateLaneFromFiberToRoot(fiber, lane) {
  fiber.lanes |= lane;
  let alternate = fiber.alternate;
  if (alternate !== null) {
    alternate.lanes |= lane;
  }

  // 向上遍历更新祖先节点的 lanes
  let node = fiber.return;
  while (node !== null) {
    node.childLanes |= lane;
    alternate = node.alternate;
    if (alternate !== null) {
      alternate.childLanes |= lane;
    }
    node = node.return;
  }
}
```

## 调试技巧

### 1. Fiber 树可视化

```javascript
function debugFiberTree(fiber, depth = 0) {
  const indent = " ".repeat(depth * 2);
  console.log(`${indent}${fiber.type || "HOST"}[${fiber.key || ""}]`);

  let child = fiber.child;
  while (child) {
    debugFiberTree(child, depth + 1);
    child = child.sibling;
  }
}
```

### 2. 性能追踪

```javascript
const enableSchedulerTracing = true;

function trace(name, startTime) {
  if (enableSchedulerTracing) {
    const endTime = now();
    console.log(`${name} took ${endTime - startTime}ms`);
  }
}
```

## 注意事项

1. **避免长时间任务**

   - 合理拆分组件
   - 使用 `useMemo` 和 `useCallback` 缓存计算结果
   - 实现虚拟列表

2. **优先级设置**

   - 用户交互优先
   - 动画次之
   - 数据更新最后

3. **副作用处理**

   - 清理定时器
   - 取消订阅
   - 释放资源
