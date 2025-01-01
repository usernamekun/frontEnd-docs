# 虚拟 DOM 原理

## 什么是虚拟 DOM

虚拟 DOM(Virtual DOM)是对真实 DOM 的一种轻量级描述。它本质上是一个 JavaScript 对象,用来描述你希望在屏幕上看到的内容。

### 1. 基本结构

```javascript
// React 元素
const element = {
  type: "div",
  props: {
    className: "container",
    children: [
      {
        type: "h1",
        props: {
          children: "Hello World",
        },
      },
      {
        type: "p",
        props: {
          children: "This is a paragraph",
        },
      },
    ],
  },
};
```

### 2. JSX 转换

Babel 会将 JSX 转换为 `React.createElement()` 调用:

```jsx
// JSX
const element = (
  <div className="container">
    <h1>Hello World</h1>
    <p>This is a paragraph</p>
  </div>
);

// 转换后
const element = React.createElement(
  "div",
  { className: "container" },
  React.createElement("h1", null, "Hello World"),
  React.createElement("p", null, "This is a paragraph")
);
```

## 工作原理

### 1. 创建虚拟 DOM 树

```javascript
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
```

### 2. 渲染到真实 DOM

```javascript
function render(element, container) {
  // 创建 DOM 节点
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  // 设置属性
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  // 递归渲染子节点
  element.props.children.forEach((child) => render(child, dom));

  // 添加到容器
  container.appendChild(dom);
}
```

### 3. 更新机制

```javascript
function updateDom(dom, prevProps, nextProps) {
  // 移除旧属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter((key) => !(key in nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // 设置新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter((key) => prevProps[key] !== nextProps[key])
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
}
```

## 性能优化

### 1. 批量更新

```javascript
let updateQueue = [];
let isBatchingUpdates = false;

function batchedUpdates(fn) {
  const prevIsBatchingUpdates = isBatchingUpdates;
  isBatchingUpdates = true;
  try {
    return fn();
  } finally {
    isBatchingUpdates = prevIsBatchingUpdates;
    if (!isBatchingUpdates) {
      flushUpdateQueue();
    }
  }
}

function enqueueUpdate(component) {
  if (!isBatchingUpdates) {
    component.updateComponent();
    return;
  }
  updateQueue.push(component);
}
```

### 2. 异步渲染

```javascript
const ENOUGH_TIME = 1; // 1ms

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < ENOUGH_TIME;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
```

## 实现细节

### 1. Fiber 节点结构

```javascript
class Fiber {
  constructor(element) {
    this.type = element.type;
    this.props = element.props;
    this.dom = null;

    // Fiber 关系
    this.parent = null;
    this.child = null;
    this.sibling = null;

    // 副作用
    this.alternate = null;
    this.effectTag = null;
    this.effects = [];
  }
}
```

### 2. 协调过程

```javascript
function reconcileChildren(wipFiber, elements) {
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling = null;
  let index = 0;

  while (index < elements.length || oldFiber) {
    const element = elements[index];
    let newFiber = null;

    // 比较 oldFiber 和 element
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      // 更新节点
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    if (element && !sameType) {
      // 新建节点
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    if (oldFiber && !sameType) {
      // 删除节点
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}
```

## 优势与限制

### 优势

1. **性能优化**

   - 批量处理 DOM 更新
   - 最小化 DOM 操作
   - 异步渲染支持

2. **跨平台能力**

   - 可以输出到不同平台
   - 统一的开发模型

3. **开发体验**

   - 声明式编程
   - 组件化开发
   - 更好的可维护性

### 限制

1. **首次渲染开销**

   - 需要构建虚拟 DOM 树
   - JavaScript 执行成本

2. **内存占用**

   - 需要在内存中维护两棵树
   - 大型应用可能占用较多内存

3. **复杂度**

   - 调试更困难
   - 需要理解更多概念

## 最佳实践

1. **优化更新**

   ```javascript
   // 使用 key 帮助 diff
   <ul>
     {items.map((item) => (
       <li key={item.id}>{item.text}</li>
     ))}
   </ul>
   ```

2. **减少不必要的渲染**

   ```javascript
   // 使用 React.memo
   const MyComponent = React.memo(function MyComponent(props) {
     /* 渲染使用 props */
   });
   ```

3. **合理的组件粒度**

   ```javascript
   // 拆分大组件
   function BigComponent() {
     return (
       <>
         <Header />
         <Content />
         <Footer />
       </>
     );
   }
   ```
