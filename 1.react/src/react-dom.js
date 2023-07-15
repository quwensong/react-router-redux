import {
  REACT_TEXT,
  REACT_FORWARD_REF_TYPE,
  REACT_PROVIDER,
  REACT_CONTEXT,
  REACT_MEMO,
} from "./constants";
import { addEvent } from "./event";
let mountingComponent = null;
/**
 * 把虚拟DOM转成真实DOM插入容器中
 * @param {}} vdom  虚拟DOM
 * @param {*} container 容器
 */
let hookState = []; //这里存放着所有的状态
let hookIndex = 0; //当前的执行的hook的索引
let scheduleUpdate; //调度更新方法

/**
 * 总的来说，这段代码的作用是在没有原生的 queueMicrotask 函数的情况下，
 * 定义一个类似的函数，并确保在调用回调函数时能够捕获异常。
 */
if (typeof window.queueMicrotask !== "function") {
  window.queueMicrotask = function (callback) {
    Promise.resolve()
      .then(callback)
      .catch((e) =>
        setTimeout(() => {
          throw e;
        })
      );
  };
}

function render(vdom, container) {
  mount(vdom, container);
  scheduleUpdate = () => {
    hookIndex = 0; //vdom并不指向当前的更新，而是指向根元素
    // 子组件发生变化，需要重新从根组件开始重新渲染，相当于重新调用mount方法。
    compareTwoVdom(container, vdom, vdom);
  };
}
function mount(vdom, container) {
  let newDOM = createDOM(vdom);
  container.appendChild(newDOM); //插入容器中
  if (newDOM.componentDidMount) newDOM.componentDidMount();
}
export function useRef() {
  if (hookState[hookIndex]) {
    return hookState[hookIndex++];
  } else {
    hookState[hookIndex] = { current: null };
    return hookState[hookIndex++];
  }
}
/**
 * @param {*} callback 当前渲染完成之后下一个宏任务
 * @param {*} deps 依赖数组，
 */
export function useEffect(callback, deps) {
  if (hookState[hookIndex]) {
    let [destroy, lastDeps] = hookState[hookIndex];
    let everySame = deps.every((item, index) => item === lastDeps[index]);
    if (everySame) {
      // 如果相等就跳过啥也不干
      // [1,2,3,4,useEffect]
      hookIndex++;
    } else {
      //销毁函数每次都是在下一次执行的时候才会触发执行吗
      destroy && destroy(); //先执行销毁函数
      setTimeout(() => {
        let destroy = callback();
        hookState[hookIndex++] = [destroy, deps];
      });
    }
  } else {
    //初次渲染的时候，开启一个宏任务，在宏任务里执行callback,保存销毁函数和依赖数组
    setTimeout(() => {
      let destroy = callback();
      hookState[hookIndex++] = [destroy, deps];
    });
  }
}

export function useLayoutEffect(callback, deps) {
  if (hookState[hookIndex]) {
    let [destroy, lastDeps] = hookState[hookIndex];
    let everySame = deps.every((item, index) => item === lastDeps[index]);
    if (everySame) {
      hookIndex++;
    } else {
      //销毁函数每次都是在下一次执行的时候才会触发执行吗
      destroy && destroy(); //先执行销毁函数
      queueMicrotask(() => {
        let destroy = callback();
        hookState[hookIndex++] = [destroy, deps];
      });
    }
  } else {
    //初次渲染的时候，开启一个宏任务，在宏任务里执行callback,保存销毁函数和依赖数组
    queueMicrotask(() => {
      let destroy = callback();
      hookState[hookIndex++] = [destroy, deps];
    });
  }
}
export function useReducer(reducer, initialState) {
  if (!hookState[hookIndex]) {
    hookState[hookIndex] = initialState;
    // 将对应的hooks 下标和值缓存到当前挂载的实例
    if (mountingComponent && !mountingComponent.hooks) {
      mountingComponent.hooks = {};
      mountingComponent.hooks[hookIndex] = hookState[hookIndex];
    }
  }

  let currentIndex = hookIndex;
  function dispatch(action) {
    // 如果用户传入 reducer 就使用 reducer 更新数据， 否则直接使用 action --> 用户传入的数据:  setState(action) 例如里面的就是action
    hookState[currentIndex] = reducer
      ? reducer(hookState[currentIndex], action)
      : action;
    scheduleUpdate();
  }

  // [state,setState]
  return [hookState[hookIndex++], dispatch];
}
export function useState(initialState) {
  return useReducer(null, initialState);
}
/* export function useState(initialState){
    if(!hookState[hookIndex])
       hookState[hookIndex]=initialState;
    let currentIndex = hookIndex;
    function setState(newState){
        hookState[currentIndex]=newState;
        scheduleUpdate();
    }
    return [hookState[hookIndex++],setState];
} */
export function useMemo(factory, deps) {
  if (hookState[hookIndex]) {
    //说明不是第一次是更新
    let [lastMemo, lastDeps] = hookState[hookIndex];
    // 检查两个数组 deps 和 lastDeps 中的每个元素是否相等，并将结果保存在变量 everySame 中。
    let everySame = deps.every((item, index) => item === lastDeps[index]);
    if (everySame) {
      hookIndex++;
      return lastMemo;
    } else {
      let newMemo = factory();
      hookState[hookIndex++] = [newMemo, deps];
      return newMemo;
    }
  } else {
    let newMemo = factory();
    hookState[hookIndex++] = [newMemo, deps];
    return newMemo;
  }
}
export function useCallback(callback, deps) {
  if (hookState[hookIndex]) {
    //说明不是第一次是更新
    let [lastCallback, lastDeps] = hookState[hookIndex];
    let everySame = deps.every((item, index) => item === lastDeps[index]);
    if (everySame) {
      hookIndex++;
      return lastCallback;
    } else {
      hookState[hookIndex++] = [callback, deps];
      return callback;
    }
  } else {
    hookState[hookIndex++] = [callback, deps];
    return callback;
  }
}
/**
 * 把虚拟DOM转成真实DOM
 * @param {*} vdom  虚拟DOM
 */
function createDOM(vdom) {
  let { type, props, ref } = vdom;
  let dom; //获取 真实DOM元素
  let prevComponent = mountingComponent;
  mountingComponent = vdom;

  //如果type.$$typeof属性是REACT_FORWARD_REF_TYPE值
  if (type && type.$$typeof === REACT_MEMO) {
    return mountMemoComponent(vdom);
  } else if (type && type.$$typeof === REACT_CONTEXT) {
    return mountContextComponent(vdom);
  } else if (type && type.$$typeof === REACT_PROVIDER) {
    return mountProviderComponent(vdom);
  } else if (type && type.$$typeof === REACT_FORWARD_REF_TYPE) {
    return mountForwardComponent(vdom);
  } else if (type === REACT_TEXT) {
    //如果是一个文本元素，就创建一个文本节点
    dom = document.createTextNode(props.content);
  } else if (typeof type === "function") {
    //说明这是一个React函数组件的React元素
    if (type.isReactComponent) {
      //说明它是一个类组件
      return mountClassComponent(vdom);
    } else {
      return mountFunctionComponent(vdom);
    }
  } else if (typeof type === "string") {
    dom = document.createElement(type); //原生DOM类型
  } else {
    throw new Error(`无法处理的元素类型`, type);
  }
  if (props) {
    updateProps(dom, {}, props); //根据虚拟DOM中的属性更新真实DOM属性
    if (typeof props.children == "object" && props.children.type) {
      //它是个对象 只有一个儿子
      render(props.children, dom);
    } else if (Array.isArray(props.children)) {
      //如果是一个数组
      reconcileChildren(props.children, dom);
    }
  }
  mountingComponent = prevComponent;
  //让虚拟DOM的dom属生指向它的真实DOM
  vdom.dom = dom;
  if (ref) ref.current = dom; //让ref.current属性指向真实DOM的实例
  return dom;
}
function mountMemoComponent(vdom) {
  let { type, props } = vdom;
  let renderVdom = type.type(props);
  vdom.prevProps = props; //记录一下老的属性对象，在更新的时候会用到
  vdom.oldRenderVdom = renderVdom;
  return createDOM(renderVdom);
}
function mountContextComponent(vdom) {
  let { type, props } = vdom;
  let renderVdom = props.children(type._context._currentValue);
  vdom.oldRenderVdom = renderVdom;
  return createDOM(renderVdom);
}
function mountProviderComponent(vdom) {
  //vdom={}
  //type={$$typeof: REACT_PROVIDER, _context: context},props={value,children}
  let { type, props } = vdom;
  //在渲染Provider组件的时候，拿到属性中的value，赋给context._currentValue
  type._context._currentValue = props.value;
  let renderVdom = props.children;
  vdom.oldRenderVdom = renderVdom;
  return createDOM(renderVdom);
}
function mountForwardComponent(vdom) {
  let { type, props, ref } = vdom;
  //  TODO:
  /**
     * let a = {
        b: {
            current: "00000",
        },
        };

        const { b } = a;

        b.current = "1111111";

        console.log(a.b.current); // 1111111
     */
  let renderVdom = type.render(props, ref);
  vdom.oldRenderVdom = renderVdom;
  return createDOM(renderVdom);
}
function mountClassComponent(vdom) {
  let { type, props, ref } = vdom;
  let defaultProps = type.defaultProps || {};
  let classInstance = new type({ ...defaultProps, ...props });
  //
  if (type.contextType) {
    classInstance.context = type.contextType._currentValue;
  }

  vdom.classInstance = classInstance;
  if (classInstance.componentWillMount) classInstance.componentWillMount();
  let renderVdom = classInstance.render();
  classInstance.oldRenderVdom = vdom.oldRenderVdom = renderVdom; //挂载的时候计算出虚拟DOM，然后挂到类的实例上
  if (ref) ref.current = classInstance; //ref.current指向类组件的实例
  let dom = createDOM(renderVdom);
  //TODO: 暂时把didMount方法暂存到dom上,很重要
  if (classInstance.componentDidMount) {
    dom.componentDidMount = classInstance.componentDidMount.bind(classInstance);
  }
  return dom;
}
function mountFunctionComponent(vdom) {
  let { type, props } = vdom;
  let renderVdom = type(props);
  vdom.oldRenderVdom = renderVdom;
  return createDOM(renderVdom);
}
function reconcileChildren(childrenVdom, parentDOM) {
  for (let i = 0; i < childrenVdom.length; i++) {
    let childVdom = childrenVdom[i];
    render(childVdom, parentDOM);
  }
}
function updateProps(dom, oldProps, newProps) {
  for (let key in newProps) {
    if (key === "children") {
      continue;
    } //后面会单独处理children属性，所以此处跳过去
    if (key === "style") {
      let styleObj = newProps[key];
      for (let attr in styleObj) {
        dom.style[attr] = styleObj[attr];
      }
    } else if (key.startsWith("on")) {
      //onClick
      //dom[key.toLocaleLowerCase()]=newProps[key];//dom.onclick=handleClick
      addEvent(dom, key.toLocaleLowerCase(), newProps[key]);
    } else {
      if (newProps[key]) dom[key] = newProps[key];
    }
  }
}
/**
 * 根据vdom返回真实DOM
 * @param {*} vdom
 */
export function findDOM(vdom) {
  let type = vdom.type;
  let dom;
  if (typeof type === "string" || type === REACT_TEXT) {
    //原生的组件
    dom = vdom.dom;
  } else {
    //可能函数组件 类组件 provider context forward
    dom = findDOM(vdom.oldRenderVdom);
  }
  return dom;
}
/**
 * 比较新旧的虚拟DOM，找出差异，更新到真实DOM上
 * 现在还没有实现dom-diff
 * @param {*} parentDOM
 * @param {*} oldVdom
 * @param {*} newVdom
 */
export function compareTwoVdom(parentDOM, oldVdom, newVdom, nextDOM) {
  /**
   * oldVdom         newVdom          说明
   * 空              空               什么都不用做
   * 非空            空               删除老的
   * 空              非空             创建新的
   * 非空            非空             类型不一样，直接替换
   * 非空            非空             类型一样，看属性，继续深度比较
   */

  if (!oldVdom && !newVdom) {
    //如果老的虚拟DOM是null,新的虚拟DOM也是null
  } else if (oldVdom && !newVdom) {
    //老的为不null,新的为null,销毁老组件
    let currentDOM = findDOM(oldVdom);
    currentDOM.parentNode.removeChild(currentDOM); //把老的真实DOM删除
    if (oldVdom.classInstance && oldVdom.classInstance.componentWillUnmount) {
      oldVdom.classInstance.componentWillUnmount(); //执行组件卸载方法
    }
  } else if (!oldVdom && newVdom) {
    //如果老的没有，新的有，就根据新的组件创建新的DOM并且添加到父DOM容器中
    let newDOM = createDOM(newVdom);

    if (nextDOM) {
      parentDOM.insertBefore(newDOM, nextDOM);
    } else {
      parentDOM.appendChild(newDOM);
    }
    if (newDOM.componentDidMount) newDOM.componentDidMount();
    //新老都有，但是不同div p    也不能复用，则需要删除老的，添加新的
  } else if (oldVdom && newVdom && oldVdom.type !== newVdom.type) {
    let oldDOM = findDOM(oldVdom); //先获取 老的真实DOM
    let newDOM = createDOM(newVdom); //创建新的真实DOM
    oldDOM.parentNode.replaceChild(newDOM, oldDOM);
    if (oldVdom.classInstance && oldVdom.classInstance.componentWillUnmount) {
      oldVdom.classInstance.componentWillUnmount(); //执行组件卸载方法
    }
    if (newDOM.componentDidMount) newDOM.componentDidMount();
  } else {
    //老的有，新的也有，类型也一样，需要复用老节点，进行深度的递归dom diff了
    updateElement(oldVdom, newVdom);
  }
}
function updateElement(oldVdom, newVdom) {
  if (oldVdom.type && oldVdom.type.$$typeof === REACT_MEMO) {
    updateMemoComponent(oldVdom, newVdom);
  } else if (oldVdom.type && oldVdom.type.$$typeof === REACT_PROVIDER) {
    updateProviderComponent(oldVdom, newVdom);
  } else if (oldVdom.type && oldVdom.type.$$typeof === REACT_CONTEXT) {
    updateContextComponent(oldVdom, newVdom);
  } else if (oldVdom.type === REACT_TEXT && newVdom.type === REACT_TEXT) {
    let currentDOM = (newVdom.dom = findDOM(oldVdom));
    if (oldVdom.props.content !== newVdom.props.content)
      currentDOM.textContent = newVdom.props.content;
  } else if (typeof oldVdom.type === "string") {
    //说明是原生组件 div
    //让新的虚拟DOM的真实DOM属性等于老的虚拟DOM对应的那个真实DOM
    let currentDOM = (newVdom.dom = findDOM(oldVdom));
    //用新的属性更新DOM的老属性
    updateProps(currentDOM, oldVdom.props, newVdom.props);
    updateChildren(currentDOM, oldVdom.props.children, newVdom.props.children);
  } else if (typeof oldVdom.type === "function") {
    if (oldVdom.type.isReactComponent) {
      updateClassComponent(oldVdom, newVdom);
    } else {
      updateFunctionComponent(oldVdom, newVdom);
    }
  }
}
function updateMemoComponent(oldVdom, newVdom) {
  let { type, prevProps } = oldVdom;
  //比较老的属性对象和新的属性对象是否相等

  // 就算未渲染该组件也必须执行render 保证hook的hookIndex能下移
  let renderVdom = newVdom.type.type(newVdom.props);
  let hookKeys = Object.keys(oldVdom.hooks);
  if (
    type.compare(prevProps, newVdom.props) &&
    hookKeys.every((key) => hookState[key] === oldVdom.hooks[key])
  ) {
    console.log(oldVdom.props.name, oldVdom.oldRenderVdom, oldVdom.hooks);
    newVdom.oldRenderVdom = oldVdom.oldRenderVdom;
    newVdom.prevProps = oldVdom.props;
    hookKeys.forEach((key) => {
      oldVdom.hooks[key] = hookState[key];
    });
  } else {
    let parentDOM = findDOM(oldVdom).parentNode;

    compareTwoVdom(parentDOM, oldVdom.oldRenderVdom, renderVdom);
    newVdom.prevProps = newVdom.props;
    newVdom.oldRenderVdom = renderVdom;
  }

  newVdom.hooks = oldVdom.hooks; // 将新hooks 缓存下来
}
function updateProviderComponent(oldVdom, newVdom) {
  let parentDOM = findDOM(oldVdom).parentNode;
  let { type, props } = newVdom;
  type._context._currentValue = props.value;
  let renderVdom = props.children;
  compareTwoVdom(parentDOM, oldVdom.oldRenderVdom, renderVdom);
  newVdom.oldRenderVdom = renderVdom;
}
function updateContextComponent(oldVdom, newVdom) {
  let parentDOM = findDOM(oldVdom).parentNode;
  let { type, props } = newVdom;
  let renderVdom = props.children(type._context._currentValue);
  compareTwoVdom(parentDOM, oldVdom.oldRenderVdom, renderVdom);
  newVdom.oldRenderVdom = renderVdom;
}
function updateFunctionComponent(oldVdom, newVdom) {
  let parentDOM = findDOM(oldVdom).parentNode;
  let { type, props } = newVdom;
  let renderVdom = type(props);
  compareTwoVdom(parentDOM, oldVdom.oldRenderVdom, renderVdom);
  newVdom.oldRenderVdom = renderVdom;
}
function updateClassComponent(oldVdom, newVdom) {
  let classInstance = (newVdom.classInstance = oldVdom.classInstance);
  newVdom.oldRenderVdom = oldVdom.oldRenderVdom;
  //因为此更新是由于父组件更新引起的，父组件在重新渲染的时候，给子组件传递新的属性
  if (classInstance.componentWillReceiveProps) {
    classInstance.componentWillReceiveProps();
  }
  // 更新当前组件的 props
  // newVdom.props :父组件传过来的值
  classInstance.updater.emitUpdate(newVdom.props);
}
function updateChildren(parentDOM, oldVChildren, newVChildren) {
  oldVChildren = Array.isArray(oldVChildren) ? oldVChildren : [oldVChildren];
  newVChildren = Array.isArray(newVChildren) ? newVChildren : [newVChildren];
  let maxLength = Math.max(oldVChildren.length, newVChildren.length);
  // 整个代码的作用是，通过循环遍历虚拟DOM节点，找到每个虚拟DOM节点对应的真实DOM节点，并比较它们之间的差异来实现页面的更新。
  for (let i = 0; i < maxLength; i++) {
    //找当前的虚拟DOM节点这后的最近的一个真实DOM节点
    // 即节点的索引大于i且节点存在且可以找到对应的真实DOM节点。
    let nextVNode = oldVChildren.find(
      (item, index) => index > i && item && findDOM(item)
    );
    compareTwoVdom(
      parentDOM,
      oldVChildren[i],
      newVChildren[i],
      nextVNode && findDOM(nextVNode)
    );
  }
}
const ReactDOM = {
  render,
};
export default ReactDOM;

/*
export function compareTwoVdom(parentDOM,oldVdom,newVdom){
    let oldDOM = findDOM(oldVdom);//TODO findDOM
    let newDOM = createDOM(newVdom);
    parentDOM.replaceChild(newDOM,oldDOM);
} */
