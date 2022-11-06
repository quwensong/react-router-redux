import  { REACT_TEXT }  from './constants.js'
import { addEvent } from './events'
/**
 * 虚拟dom变成真实dom插入容器
 * @param {*} vdom 
 * @param {*} container 
 */
function render(vdom,container) {
  const newDOM = createDOM(vdom)
  container.appendChild(newDOM)
}

function createDOM(vdom){
  const { type,props,ref } = vdom
  let dom;//真实dom元素
  if(type === REACT_TEXT){
    dom = document.createTextNode(props.content)
  }else if(typeof type === 'function'){
    if(type.isReactComponent === true){//类组件
      return mountClassComponent(vdom)
    }else{//函数组件
      return mountFunctionComponent(vdom)
    }
  }else{
    dom = document.createElement(type)
  }
  if(props){
    updateProps(dom,{},props) //根据虚拟dom中的属性更新真实dom中的属性
    // 对象 只有一个儿子
    if(typeof props.children == 'object' && props.children.type && props.children !== null){
      render(props.children,dom)
    // 数组，多个儿子,循环挂载
    }else if(Array.isArray(props.children)){
      reconcileChildren(props.children,dom)
    }
  }
  vdom.dom = dom
  if(ref) ref.current = dom //让ref.current指向真实dom实例
  return dom
}

function reconcileChildren(childrenVdom,parentDom){
  const childrenLen = childrenVdom.length
  for(let i=0; i < childrenLen; i++){
    const childVdom = childrenVdom[i]
    render(childVdom,parentDom)
  }
}

function updateProps(dom,oldProps,newProps){
  for(const key in newProps){
    if(key === 'children'){ continue }
    if(key === 'style'){ 
      const styleObj = newProps[key]
      for(const attr in styleObj){
        dom.style[attr] = styleObj[attr]
      }
    }else if(key.startsWith('on')){
      addEvent(dom,key.toLocaleLowerCase(),newProps[key])
      // dom[key.toLocaleLowerCase()] = newProps[key] //dom.onclick = handleClick
    }else{
    dom[key] = newProps[key]
    }
  }
}

function mountFunctionComponent(vdom){
  const { type,props } = vdom
  const renderVdom = type(props)
  vdom.oldRenderVdom = renderVdom
  return createDOM(renderVdom)
}

function mountClassComponent(vdom){
  const { type,props,ref } = vdom
  const classInstance = new type(props)
  const renderVdom = classInstance.render()
  classInstance.oldRenderVdom = vdom.oldRenderVdom = renderVdom
  if(ref) ref.current = classInstance
  return createDOM(renderVdom)
}
/**
 * 根据vdom返回真实dom
 * @param {*} oldRenderVdom 
 */
export function findDom(vdom){
  const { type } = vdom
  let dom;
  if(typeof type === 'function'){ //组件类型
    dom = findDom(vdom.oldRenderVdom)
  }else{
    dom = vdom.dom
  }
  return dom
} 
/**
 * 比较新旧vdom，找出差异，更新
 * @param {*} parentNode 父级真实节点
 * @param {*} oldRenderVdom old虚拟dom
 * @param {*} newRenderVdom 新的虚拟dom
 */
// 目前还没有实现diff
export function compareTwoVdom(parentNode,oldRenderVdom,newRenderVdom){
  const oldDom = findDom(oldRenderVdom)
  const newDom = createDOM(newRenderVdom)
  /** replaceChild
   *  newDom 您希望插入的节点对象。
   *  oldDom 您希望删除的节点对象。
   */
  parentNode.replaceChild(newDom,oldDom)
}

/**
classInstance.__proto__.__proto__.__proto__ = Object

class ClassComponent

[[Prototype]]

class Component

[[Prototype]]

ƒ Object()

 */




const ReactDOM = {
  render
}

export default ReactDOM