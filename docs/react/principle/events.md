# React 事件系统原理

## 事件系统概述

React 实现了一套自己的事件系统(SyntheticEvent),它在 DOM 事件体系基础上做了很多优化:

1. 事件委托
2. 事件归一化
3. 事件池
4. 异步更新

## 实现原理

### 1. 事件注册

```javascript
// 事件插件注册
const SimpleEventPlugin = {
  eventTypes: {
    click: {
      phasedRegistrationNames: {
        bubbled: "onClick",
        captured: "onClickCapture",
      },
    },
    // ... 其他事件类型
  },

  extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    const dispatchConfig = eventTypes[topLevelType];

    // 创建合成事件
    const event = SyntheticMouseEvent.getPooled(
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget
    );

    // 收集事件路径上的处理函数
    accumulateTwoPhaseDispatches(event);
    return event;
  },
};
```

### 2. 事件委托

```javascript
class EventDelegate {
  constructor(rootElement) {
    this.rootElement = rootElement;
    // 存储所有事件监听
    this.listeners = new Map();

    // 代理事件处理
    this.handleEvent = this.handleEvent.bind(this);

    // 添加根节点事件监听
    rootElement.addEventListener("click", this.handleEvent);
    // ... 其他事件类型
  }

  handleEvent(nativeEvent) {
    const eventType = nativeEvent.type;

    // 获取事件目标
    let target = nativeEvent.target;
    let path = [];

    // 构建事件路径
    while (target !== null) {
      path.push(target);
      target = target.parentNode;
    }

    // 捕获阶段
    for (let i = path.length - 1; i >= 0; i--) {
      const phase = "capture";
      this.executeListeners(eventType, path[i], phase, nativeEvent);
    }

    // 冒泡阶段
    for (let i = 0; i < path.length; i++) {
      const phase = "bubble";
      this.executeListeners(eventType, path[i], phase, nativeEvent);
    }
  }

  executeListeners(eventType, target, phase, nativeEvent) {
    const listeners = this.listeners.get(target) || [];

    listeners
      .filter(
        (listener) => listener.type === eventType && listener.phase === phase
      )
      .forEach((listener) => {
        const syntheticEvent = this.createSyntheticEvent(nativeEvent);
        listener.handler(syntheticEvent);
      });
  }
}
```

### 3. 合成事件实现

```javascript
class SyntheticEvent {
  constructor(nativeEvent, type) {
    this.nativeEvent = nativeEvent;
    this.type = type;
    this.target = nativeEvent.target;
    this.currentTarget = null;

    // 复制原生事件属性
    this.timeStamp = nativeEvent.timeStamp;
    this.preventDefault = this.preventDefault.bind(this);
    this.stopPropagation = this.stopPropagation.bind(this);
  }

  preventDefault() {
    const event = this.nativeEvent;
    if (event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
    }
    this.isDefaultPrevented = true;
  }

  stopPropagation() {
    const event = this.nativeEvent;
    if (event.stopPropagation) {
      event.stopPropagation();
    } else {
      event.cancelBubble = true;
    }
    this.isPropagationStopped = true;
  }

  persist() {
    this.isPersistent = true;
  }

  // 事件池回收
  destructor() {
    const Interface = this.constructor.Interface;
    for (const propName in Interface) {
      this[propName] = null;
    }
    this.nativeEvent = null;
    this.target = null;
    this.currentTarget = null;
  }
}
```

### 4. 事件池优化

```javascript
const EVENT_POOL_SIZE = 10;

class EventPool {
  constructor(eventClass) {
    this.eventClass = eventClass;
    this.pool = [];
  }

  acquire(/* event args */) {
    if (this.pool.length > 0) {
      const event = this.pool.pop();
      this.eventClass.call(event /* event args */);
      return event;
    }
    return new this.eventClass(/* event args */);
  }

  release(event) {
    event.destructor();
    if (this.pool.length < EVENT_POOL_SIZE) {
      this.pool.push(event);
    }
  }
}
```

## 性能优化

### 1. 事件代理优化

```javascript
class OptimizedEventDelegate {
  constructor(root) {
    this.handlerMap = new Map();

    // 只在根节点注册一个处理函数
    root.addEventListener(
      "click",
      (e) => {
        this.dispatch("click", e);
      },
      false
    );
  }

  addHandler(element, type, handler) {
    if (!this.handlerMap.has(element)) {
      this.handlerMap.set(element, new Map());
    }

    const elementHandlers = this.handlerMap.get(element);
    if (!elementHandlers.has(type)) {
      elementHandlers.set(type, new Set());
    }

    elementHandlers.get(type).add(handler);
  }

  dispatch(type, e) {
    let target = e.target;
    const event = new SyntheticEvent(e);

    // 模拟事件冒泡
    while (target) {
      event.currentTarget = target;
      const elementHandlers = this.handlerMap.get(target);

      if (elementHandlers) {
        const handlers = elementHandlers.get(type);
        if (handlers) {
          handlers.forEach((handler) => handler(event));
        }
      }

      if (event.isPropagationStopped) {
        break;
      }

      target = target.parentNode;
    }
  }
}
```

### 2. 批量更新

```javascript
function batchedEventUpdates(fn) {
  const previousIsBatchingUpdates = isBatchingUpdates;
  isBatchingUpdates = true;
  try {
    return fn();
  } finally {
    isBatchingUpdates = previousIsBatchingUpdates;
    if (!isBatchingUpdates) {
      flushBatchedUpdates();
    }
  }
}
```

## 注意事项

1. **事件处理函数绑定**

   ```javascript
   // ❌ 每次渲染创建新函数
   <button onClick={() => this.handleClick()}>

   // ✅ 使用类字段或构造函数绑定
   handleClick = () => {
     // 处理点击
   }
   ```

2. **合成事件与原生事件混用**

   ```javascript
   // ❌ 混用可能导致问题
   componentDidMount() {
     document.addEventListener('click', this.handleClick);
   }

   // ✅ 统一使用 React 事件系统
   <div onClick={this.handleClick}>
   ```

3. **事件对象复用**

   ```javascript
   // ❌ 异步访问事件对象
   handleClick = (e) => {
     setTimeout(() => {
       console.log(e.target); // 可能已被回收
     }, 0);
   };

   // ✅ 持久化事件对象
   handleClick = (e) => {
     e.persist();
     setTimeout(() => {
       console.log(e.target);
     }, 0);
   };
   ```
