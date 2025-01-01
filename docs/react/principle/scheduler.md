# React 调度机制原理

## 调度器概述

React 的调度器(Scheduler)负责协调任务的执行顺序和时机,它能够:

1. 暂停当前任务
2. 保存任务状态
3. 根据优先级调度任务
4. 在合适的时机恢复任务

## 实现原理

### 1. 任务优先级

```typescript
// 优先级定义
export const ImmediatePriority = 1; // 立即执行
export const UserBlockingPriority = 2; // 用户交互
export const NormalPriority = 3; // 普通任务
export const LowPriority = 4; // 低优先级
export const IdlePriority = 5; // 空闲执行

// 优先级对应的过期时间
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

// 计算任务过期时间
function timeoutForPriority(priority: Priority) {
  switch (priority) {
    case ImmediatePriority:
      return IMMEDIATE_PRIORITY_TIMEOUT;
    case UserBlockingPriority:
      return USER_BLOCKING_PRIORITY_TIMEOUT;
    case IdlePriority:
      return IDLE_PRIORITY_TIMEOUT;
    case LowPriority:
      return LOW_PRIORITY_TIMEOUT;
    case NormalPriority:
    default:
      return NORMAL_PRIORITY_TIMEOUT;
  }
}
```

### 2. 任务队列管理

```javascript
// 任务队列实现
class TaskQueue {
  constructor() {
    this.taskQueue = [];
  }

  push(task) {
    const index = this.getInsertionIndex(task);
    this.taskQueue.splice(index, 0, task);
  }

  peek() {
    return this.taskQueue[0];
  }

  pop() {
    return this.taskQueue.shift();
  }

  // 根据过期时间排序
  getInsertionIndex(task) {
    let left = 0;
    let right = this.taskQueue.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.taskQueue[mid].expirationTime > task.expirationTime) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    return left;
  }
}
```

### 3. 时间分片

```javascript
// 使用 requestIdleCallback 或 MessageChannel 实现时间分片
let channel = new MessageChannel();
let port = channel.port2;

requestIdleCallback = function (callback) {
  const start = Date.now();

  // 发送消息到另一个端口
  port.postMessage(null);

  return new Promise((resolve) => {
    channel.port1.onmessage = () => {
      // 检查是否还有剩余时间
      if (frameDeadline - Date.now() > 0) {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, frameDeadline - Date.now()),
        });
      } else {
        // 没有剩余时间,推迟到下一帧
        requestIdleCallback(callback);
      }
    };
  });
};

// 工作循环
function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (nextUnitOfWork) {
    // 还有工作要做,请求下一次调度
    requestIdleCallback(workLoop);
  }
}
```

### 4. 优先级调度

```javascript
function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const startTime = currentTime;

  // 计算过期时间
  const timeout = timeoutForPriority(priorityLevel);
  const expirationTime = startTime + timeout;

  // 创建新任务
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  if (startTime > currentTime) {
    // 延迟任务
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);

    // 如果是队列中第一个任务,启动定时器
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // 立即执行的任务
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);

    // 请求调度
    requestHostCallback(flushWork);
  }

  return newTask;
}
```

## 性能优化

### 1. 批量更新

```javascript
// 批处理更新
function batchedUpdates(fn) {
  const prevIsBatchingUpdates = isBatchingUpdates;
  isBatchingUpdates = true;
  try {
    return fn();
  } finally {
    isBatchingUpdates = prevIsBatchingUpdates;
    if (!isBatchingUpdates) {
      // 执行所有更新
      flushSyncCallbacks();
    }
  }
}

// 使用示例
function handleClick() {
  batchedUpdates(() => {
    setCount((c) => c + 1);
    setFlag((f) => !f);
    setText("updated");
  });
}
```

### 2. 优先级管理

```javascript
function ensureRootIsScheduled(root) {
  const nextLanes = getNextLanes(root, NoLanes);

  // 获取最高优先级的任务
  const existingCallbackNode = root.callbackNode;
  const existingCallbackPriority = root.callbackPriority;

  // 计算新的优先级
  const newCallbackPriority = getHighestPriorityLane(nextLanes);

  if (newCallbackPriority === existingCallbackPriority) {
    // 相同优先级,复用现有回调
    return;
  }

  // 取消现有调度
  if (existingCallbackNode !== null) {
    cancelCallback(existingCallbackNode);
  }

  // 创建新的调度
  let newCallbackNode;
  if (newCallbackPriority === SyncLane) {
    // 同步任务
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else {
    // 异步任务
    const schedulerPriorityLevel =
      lanesToSchedulerPriority(newCallbackPriority);

    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}
```

## 调试与监控

### 1. 性能追踪

```javascript
// 添加性能标记
function trace(name, phase, timestamp) {
  if (__DEV__) {
    performance.mark(`⚛️ ${name} [${phase}] - ${timestamp}`);
  }
}

// 使用示例
trace("Render", "start", performance.now());
doWork();
trace("Render", "end", performance.now());
```

### 2. 调度可视化

```javascript
function visualizeScheduler() {
  console.log("Current Tasks:");
  taskQueue.forEach((task, index) => {
    console.log(
      `${index}: Priority=${task.priorityLevel}, ` +
        `Expires in ${task.expirationTime - getCurrentTime()}ms`
    );
  });
}
```

## 注意事项

1. **避免长时间任务**

   ```javascript
   // ❌ 不推荐
   function heavyComputation() {
     for (let i = 0; i < 1000000; i++) {
       // 耗时计算
     }
   }

   // ✅ 推荐
   function* chunkedComputation() {
     for (let i = 0; i < 1000000; i += 1000) {
       yield doChunk(i, Math.min(i + 1000, 1000000));
     }
   }
   ```

2. **合理设置优先级**

   ```javascript
   // 用户交互应该使用较高优先级
   function handleUserInput() {
     scheduleCallback(UserBlockingPriority, processUserInput);
   }

   // 数据预加载可以使用低优先级
   function prefetchData() {
     scheduleCallback(IdlePriority, loadData);
   }
   ```

3. **避免优先级饥饿**

   ```javascript
   // 确保低优先级任务最终能够执行
   function ensureFairness(task) {
     if (task.startTime - getCurrentTime() > MAX_STARVATION_TIME) {
       task.priorityLevel = UserBlockingPriority;
     }
   }
   ```
