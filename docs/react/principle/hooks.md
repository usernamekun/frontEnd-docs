# React Hooks 实现原理

## Hooks 的本质

Hooks 本质上是一种链表结构,每个组件实例维护了一个 hooks 链表。

### 1. 基本数据结构

```typescript
interface Hook {
  memoizedState: any; // hook 的状态值
  baseState: any; // 基础状态
  baseQueue: Update<any> | null; // 基础更新队列
  queue: UpdateQueue<any> | null; // 更新队列
  next: Hook | null; // 指向下一个 hook
}

interface FiberNode {
  memoizedState: Hook | null; // 指向第一个 hook
  // ...其他属性
}
```

### 2. Hook 的创建和更新

```javascript
// Hook 的初始化
function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // 这是第一个 hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 将 hook 添加到链表末尾
    workInProgressHook = workInProgressHook.next = hook;
  }

  return workInProgressHook;
}

// Hook 的更新
function updateWorkInProgressHook(): Hook {
  let nextCurrentHook: null | Hook;

  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook: null | Hook;

  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // 复用已存在的 hook
    workInProgressHook = nextWorkInProgressHook;
    currentHook = nextCurrentHook;
  } else {
    // 创建新的 hook
    currentHook = nextCurrentHook;

    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null,
    };

    workInProgressHook = workInProgressHook.next = newHook;
  }

  return workInProgressHook;
}
```

## useState 实现

### 1. 基本实现

```javascript
function useState<S>(initialState: S | (() => S)): [S, Dispatch<S>] {
  const hook = mountWorkInProgressHook();

  if (typeof initialState === "function") {
    // @ts-ignore
    initialState = initialState();
  }

  hook.memoizedState = hook.baseState = initialState;

  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  });

  const dispatch = (queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));

  return [hook.memoizedState, dispatch];
}

// 更新函数
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A
) {
  const update: Update<S, A> = {
    lane: lane,
    action,
    eagerReducer: null,
    eagerState: null,
    next: null,
  };

  // 将更新添加到循环链表
  const pending = queue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  const alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // 渲染阶段更新
    didScheduleRenderPhaseUpdate = true;
  } else {
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // 队列为空,可以计算新状态
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        try {
          const currentState = queue.lastRenderedState;
          const eagerState = lastRenderedReducer(currentState, action);
          update.eagerReducer = lastRenderedReducer;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {
            return;
          }
        } catch (error) {
          // 忽略错误
        }
      }
    }
    scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
```

## useEffect 实现

### 1. 基本结构

```javascript
function useEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;

  hook.memoizedState = pushEffect(
    HookHasEffect | HookPassive,
    create,
    undefined,
    nextDeps
  );
}

function pushEffect(
  tag: HookFlags,
  create: () => (() => void) | void,
  destroy: (() => void) | void,
  deps: Array<mixed> | null
): Effect {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  };

  let componentUpdateQueue: null | FunctionComponentUpdateQueue =
    (currentlyRenderingFiber.updateQueue: any);

  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }

  return effect;
}
```

## 性能优化

### 1. 依赖比较

```javascript
function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null
): boolean {
  if (prevDeps === null) {
    return false;
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
```

### 2. 状态批量更新

```javascript
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
```

## 注意事项

1. **Hook 调用顺序**

   ```javascript
   // ❌ 条件语句中使用 Hooks
   function Counter() {
     if (condition) {
       const [count, setCount] = useState(0);
     }
     // ...
   }

   // ✅ 正确使用
   function Counter() {
     const [count, setCount] = useState(0);
     if (condition) {
       // 使用 count
     }
   }
   ```

2. **避免无限更新**

   ```javascript
   // ❌ 每次渲染都创建新的引用
   function Component() {
     const [count, setCount] = useState(0);

     useEffect(() => {
       const handler = () => setCount(count + 1);
       window.addEventListener("click", handler);
       return () => window.removeEventListener("click", handler);
     }, [count]); // 依赖项包含 count
   }

   // ✅ 使用函数式更新
   function Component() {
     const [count, setCount] = useState(0);

     useEffect(() => {
       const handler = () => setCount((c) => c + 1);
       window.addEventListener("click", handler);
       return () => window.removeEventListener("click", handler);
     }, []); // 不需要依赖项
   }
   ```

3. **合理使用 useMemo/useCallback**

   ```javascript
   // ❌ 过度优化
   function Component() {
     const value = useMemo(() => 1 + 2, []);

     // ✅ 合理使用
     const expensiveValue = useMemo(
       () => someExpensiveCalculation(props),
       [props]
     );
   }
   ```
