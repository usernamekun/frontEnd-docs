# React Diff 算法原理

## Diff 算法概述

React 的 Diff 算法是一种将 O(n³) 复杂度优化到 O(n) 的算法,它基于以下三个假设:

1. 不同类型的元素会产生不同的树
2. 通过 key prop 来暗示哪些子元素在不同的渲染中保持稳定
3. 只对同级元素进行 Diff

## 实现原理

### 1. 单节点 Diff

```javascript
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement
): Fiber {
  const key = element.key;
  let child = currentFirstChild;

  // 首先尝试复用同类型节点
  while (child !== null) {
    // 比较 key
    if (child.key === key) {
      // 比较 type
      if (child.elementType === element.type) {
        // 找到可复用的节点,删除其他节点
        deleteRemainingChildren(returnFiber, child.sibling);
        // 复用现有 fiber
        const existing = useFiber(child, element.props);
        existing.return = returnFiber;
        return existing;
      }
      // key 相同但 type 不同,删除所有旧节点
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      // key 不同,删除该节点
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }

  // 创建新节点
  const created = createFiberFromElement(element);
  created.return = returnFiber;
  return created;
}
```

### 2. 多节点 Diff

```javascript
function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<any>
): Fiber | null {
  let oldFiber = currentFirstChild;
  let newIdx = 0;
  let previousNewFiber = null;
  let resultingFirstChild = null;

  // 第一轮遍历: 处理更新的节点
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx];

    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }

    const newFiber = updateSlot(returnFiber, oldFiber, newChild);

    if (newFiber === null) {
      break; // key 不同,跳出第一轮遍历
    }

    if (oldFiber && newFiber.alternate === null) {
      // 删除旧节点
      deleteChild(returnFiber, oldFiber);
    }

    // 链接新 Fiber
    placeChild(newFiber, previousNewFiber, newIdx);
    previousNewFiber = newFiber;
  }

  // 处理剩余情况
  if (newIdx === newChildren.length) {
    // 新节点遍历完,删除剩余旧节点
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  if (oldFiber === null) {
    // 旧节点遍历完,添加剩余新节点
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      placeChild(newFiber, previousNewFiber, newIdx);
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  // 处理移动的节点
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx]
    );

    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        if (newFiber.alternate !== null) {
          // 删除已复用的旧节点
          existingChildren.delete(
            newFiber.key === null ? newIdx : newFiber.key
          );
        }
      }
      // 放置新节点
      placeChild(newFiber, previousNewFiber, newIdx);
      previousNewFiber = newFiber;
    }
  }

  // 删除未复用的旧节点
  if (shouldTrackSideEffects) {
    existingChildren.forEach((child) => deleteChild(returnFiber, child));
  }

  return resultingFirstChild;
}
```

### 3. 优化策略

#### Key 的优化

```javascript
function updateSlot(
  returnFiber: Fiber,
  oldFiber: Fiber | null,
  newChild: any
): Fiber | null {
  const key = oldFiber !== null ? oldFiber.key : null;

  if (typeof newChild === "object" && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        if (newChild.key === key) {
          // key 相同,尝试复用
          return updateElement(returnFiber, oldFiber, newChild);
        } else {
          // key 不同,返回 null 表示无法复用
          return null;
        }
      }
      // ... 其他类型的处理
    }
  }

  return null;
}
```

#### 移动节点优化

```javascript
function placeChild(
  newFiber: Fiber,
  previousNewFiber: Fiber | null,
  newIdx: number
): void {
  newFiber.index = newIdx;

  if (!shouldTrackSideEffects) {
    // 初次渲染
    return;
  }

  const current = newFiber.alternate;
  if (current !== null) {
    const oldIndex = current.index;
    if (oldIndex < lastPlacedIndex) {
      // 需要移动
      newFiber.flags |= Placement;
      return;
    } else {
      // 不需要移动
      lastPlacedIndex = oldIndex;
    }
  } else {
    // 新插入的节点
    newFiber.flags |= Placement;
  }
}
```

## 性能优化

### 1. 列表渲染优化

```jsx
// ❌ 不推荐
{
  items.map((item, index) => <ListItem key={index} data={item} />);
}

// ✅ 推荐
{
  items.map((item) => <ListItem key={item.id} data={item} />);
}
```

### 2. 组件更新优化

```javascript
// 使用 shouldComponentUpdate
class ListItem extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.data !== nextProps.data;
  }

  render() {
    return <div>{this.props.data}</div>;
  }
}

// 使用 React.memo
const ListItem = React.memo(
  function ListItem({ data }) {
    return <div>{data}</div>;
  },
  (prevProps, nextProps) => {
    return prevProps.data === nextProps.data;
  }
);
```

### 3. 大列表优化

```javascript
function VirtualList({ items, itemHeight, windowHeight }) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(windowHeight / itemHeight),
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: windowHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item) => (
            <ListItem
              key={item.id}
              data={item}
              style={{ height: itemHeight }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 调试技巧

### 1. 使用 React DevTools

```javascript
// 在组件中添加 displayName
const MemoizedList = React.memo(function List(props) {
  return <div>{/* ... */}</div>;
});
MemoizedList.displayName = "MemoizedList";
```

### 2. 性能分析

```javascript
// 使用 Profiler 组件
<Profiler id="List" onRender={callback}>
  <List items={items} />
</Profiler>;

function callback(
  id, // "List"
  phase, // "mount" 或 "update"
  actualDuration, // 本次更新实际花费时间
  baseDuration, // 不优化的情况下花费的时间
  startTime, // 本次更新开始时间
  commitTime, // 本次更新提交时间
  interactions // 导致本次更新的交互事件
) {
  console.log(`${id} ${phase}: ${actualDuration}ms`);
}
```

## 注意事项

1. **避免不稳定的 key**

   ```jsx
   // ❌ 错误示例
   <div key={Math.random()}>{content}</div>

   // ✅ 正确示例
   <div key={item.id}>{content}</div>
   ```

2. **避免组件频繁卸载重建**

   ```jsx
   // ❌ 错误示例
   {
     condition ? <Menu /> : null;
   }

   // ✅ 正确示例
   <Menu style={{ display: condition ? "block" : "none" }} />;
   ```

3. **合理使用 React.memo**

   ```jsx
   // 只有在确实需要阻止重渲染时使用
   const ExpensiveComponent = React.memo(
     function ({ data }) {
       // 复杂的渲染逻辑
     },
     (prevProps, nextProps) => {
       return deepEqual(prevProps.data, nextProps.data);
     }
   );
   ```
