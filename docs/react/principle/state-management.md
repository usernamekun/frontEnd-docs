# React 状态管理实现原理

## 状态管理概述

状态管理是前端应用中的重要部分,一个好的状态管理方案需要:

1. 可预测的状态更新
2. 良好的性能
3. 开发者工具支持
4. 中间件扩展能力

## 实现原理

### 1. Store 实现

```typescript
interface Store<S = any, A extends Action = AnyAction> {
  dispatch: Dispatch<A>;
  getState(): S;
  subscribe(listener: () => void): Unsubscribe;
  replaceReducer(nextReducer: Reducer<S, A>): void;
}

function createStore<S, A extends Action>(
  reducer: Reducer<S, A>,
  preloadedState?: S
): Store<S, A> {
  let currentState = preloadedState as S;
  let currentReducer = reducer;
  let currentListeners: (() => void)[] = [];
  let nextListeners = currentListeners;
  let isDispatching = false;

  // 确保监听器数组的独立性
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function getState(): S {
    return currentState;
  }

  function subscribe(listener: () => void) {
    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  function dispatch(action: A) {
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    const listeners = (currentListeners = nextListeners);
    listeners.forEach((listener) => listener());

    return action;
  }

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
  };
}
```

### 2. 中间件系统

```javascript
type Middleware = (store: Store) =>
  (next: Dispatch) =>
    (action: Action) => any;

function applyMiddleware(...middlewares: Middleware[]) {
  return (createStore: StoreCreator) =>
    <S, A extends Action>(
      reducer: Reducer<S, A>,
      preloadedState?: S
    ): Store<S, A> => {
      const store = createStore(reducer, preloadedState);
      let dispatch = store.dispatch;

      const middlewareAPI = {
        getState: store.getState,
        dispatch: (action: any) => dispatch(action),
      };

      const chain = middlewares.map(middleware =>
        middleware(middlewareAPI)
      );

      dispatch = compose(...chain)(store.dispatch);

      return {
        ...store,
        dispatch,
      };
    };
}

// 中间件示例: Logger
const logger: Middleware = store => next => action => {
  console.log('dispatching', action);
  const result = next(action);
  console.log('next state', store.getState());
  return result;
};
```

### 3. 选择器系统

```typescript
interface Selector<S, R> {
  (state: S): R;
  recomputations(): number;
  resetRecomputations(): number;
}

function createSelector<S, R1, Result>(
  selector: (state: S) => R1,
  combiner: (res: R1) => Result
): Selector<S, Result> {
  let lastInput: R1;
  let lastResult: Result;
  let recomputations = 0;

  const memoizedSelector = (state: S): Result => {
    const input = selector(state);

    if (input !== lastInput) {
      lastResult = combiner(input);
      lastInput = input;
      recomputations++;
    }

    return lastResult;
  };

  memoizedSelector.recomputations = () => recomputations;
  memoizedSelector.resetRecomputations = () => {
    recomputations = 0;
    return recomputations;
  };

  return memoizedSelector;
}
```

### 4. 状态持久化

```javascript
// 持久化中间件
const persistMiddleware = (config) => (store) => (next) => (action) => {
  const result = next(action);

  if (config.whitelist.includes(action.type)) {
    const state = store.getState();
    const persistedState = config.serialize(state);

    localStorage.setItem(config.key, persistedState);
  }

  return result;
};

// 状态恢复
function rehydrateStore(store, config) {
  const persistedState = localStorage.getItem(config.key);

  if (persistedState) {
    const state = config.deserialize(persistedState);
    store.dispatch({
      type: "REHYDRATE",
      payload: state,
    });
  }
}
```

## 性能优化

### 1. 状态分片

```javascript
// 状态分片示例
const rootReducer = combineReducers({
  ui: uiReducer,
  data: dataReducer,
  auth: authReducer,
});

// 选择器优化
const selectUserData = createSelector(
  (state) => state.data.users,
  (state) => state.ui.filters,
  (users, filters) => {
    return users.filter((user) => filters.some((f) => f(user)));
  }
);
```

### 2. 批量更新

```javascript
// 批量更新中间件
const batchActionsMiddleware = (store) => (next) => (action) => {
  if (!Array.isArray(action)) {
    return next(action);
  }

  // 开始批量更新
  batchUpdates(() => {
    action.forEach((a) => store.dispatch(a));
  });
};

// 使用示例
dispatch([
  { type: "INCREMENT" },
  { type: "ADD_TODO", payload: newTodo },
  { type: "UPDATE_FILTER" },
]);
```

## 注意事项

1. **避免状态冗余**

   ```javascript
   // ❌ 状态冗余
   const state = {
     users: {
       list: [],
       byId: {}, // 可以通过 list 派生
       count: 0, // 可以通过 list.length 获取
     },
   };

   // ✅ 最小化状态
   const state = {
     users: [],
   };

   // 使用选择器派生数据
   const selectUserById = (id) => (state) =>
     state.users.find((user) => user.id === id);
   ```

2. **合理的更新粒度**

   ```javascript
   // ❌ 过于频繁的更新
   function handleScroll() {
     dispatch({
       type: "UPDATE_SCROLL_POSITION",
       payload: window.scrollY,
     });
   }

   // ✅ 使用节流
   function handleScroll() {
     throttle(() => {
       dispatch({
         type: "UPDATE_SCROLL_POSITION",
         payload: window.scrollY,
       });
     }, 16);
   }
   ```

3. **异步操作处理**

   ```javascript
   // ❌ 直接在组件中处理异步
   async function handleClick() {
     const data = await fetchData();
     dispatch({
       type: "SET_DATA",
       payload: data,
     });
   }

   // ✅ 使用异步中间件
   const fetchDataAction = () => async (dispatch) => {
     dispatch({ type: "FETCH_START" });
     try {
       const data = await fetchData();
       dispatch({
         type: "FETCH_SUCCESS",
         payload: data,
       });
     } catch (error) {
       dispatch({
         type: "FETCH_ERROR",
         error,
       });
     }
   };
   ```
