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
  // 挂载后执行 子组件的 componentDidMount 生命周期方法
  if(newDOM.componentDidMount) newDOM.componentDidMount()
}

function createDOM(vdom){
  if(vdom === null) return


  const { type,props,ref } = vdom
  let dom;//真实dom元素
  if(type === REACT_TEXT){
    dom = document.createTextNode(props.content)
  }else if (type.$$typeof && typeof type === 'object'){
    return mountForwardRefComponent(vdom)
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

function mountForwardRefComponent(vdom){
  const { type,props,ref } = vdom
  const renderVdom = type.render(props,ref)
  vdom.oldRenderVdom = renderVdom
  return createDOM(renderVdom)
}

function mountFunctionComponent(vdom){
  const { type,props } = vdom
  const renderVdom = type(props)
  vdom.oldRenderVdom = renderVdom
  return createDOM(renderVdom)
}

function mountClassComponent(vdom){
  const { type,props,ref } = vdom
  const defaultProps = type.defaultProps || {}
  const classInstance = new type({...defaultProps,...props})
  // type.contextType 就是 context,context上面有个_value属性
  if(type.contextType){
    classInstance.context = type.contextType._value
  }

  if(classInstance.componentWillMount) classInstance.componentWillMount()
  const renderVdom = classInstance.render()

  classInstance.oldRenderVdom = vdom.oldRenderVdom = renderVdom
  if(ref) ref.current = classInstance
  const dom = createDOM(renderVdom)
  if(classInstance.componentDidMount){
    dom.componentDidMount = classInstance.componentDidMount.bind(this)
  }
  return dom
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

function updateChildren(parentNode,oldVChildren,newVChildren){
  oldVChildren = Array.isArray(oldVChildren) ? oldVChildren : [oldVChildren]
  newVChildren = Array.isArray(newVChildren) ? newVChildren : [newVChildren]
  const maxLength = Math.max(oldVChildren.length,newVChildren.length)
  for(let i = 0 ; i < maxLength; i++){
    compareTwoVdom(parentNode,oldVChildren[i],newVChildren[i])
  }
}

function updateElement(oldRenderVdom,newRenderVdom){
  console.log(oldRenderVdom.type)
  if(typeof oldRenderVdom.type === 'string'){ //原生组件
    const currentDOM = newRenderVdom.dom = findDom(oldRenderVdom)
    updateProps(currentDOM,oldRenderVdom.props,newRenderVdom.props)
    updateChildren(currentDOM,oldRenderVdom.props.children,newRenderVdom.props.children)
  }
}

/**
 * 比较新旧vdom，找出差异，更新
 * @param {*} parentNode 父级真实节点
 * @param {*} oldRenderVdom old虚拟dom
 * @param {*} newRenderVdom 新的虚拟dom
 */
// 目前还没有实现diff
export function compareTwoVdom(parentNode,oldRenderVdom,newRenderVdom){
  
  if(!oldRenderVdom && !newRenderVdom) return null
  if(oldRenderVdom && !newRenderVdom){//销毁老组件
    const currentDOM = findDom(oldRenderVdom);
    currentDOM.parentNode.removeChild(currentDOM) //把老的真实dom删掉
    if(oldRenderVdom.classInstance && oldRenderVdom.classInstance.componentWillUnmount){
      oldRenderVdom.classInstance.componentWillUnmount()
    }
    return null
  }else if(!oldRenderVdom && newRenderVdom){
    const newDOM = createDOM(newRenderVdom)
    parentNode.appendChild(newDOM)
      // 挂载后执行 componentDidMount 生命周期方法
    if(newDOM.componentDidMount) newDOM.componentDidMount()
    return newRenderVdom
    
  }else if(oldRenderVdom && newRenderVdom && oldRenderVdom.type !== newRenderVdom.type){
    /** replaceChild
     *  newDom 您希望插入的节点对象。
     *  oldDom 您希望删除的节点对象。
     */
    const oldDOM = findDom(oldRenderVdom)
    const newDOM = createDOM(newRenderVdom)
    oldDOM.parentNode.replaceChild(newDOM,oldDOM)
    if(oldRenderVdom.classInstance && oldRenderVdom.classInstance.componentWillUnmount){
      oldRenderVdom.classInstance.componentWillUnmount()
    }
    return newRenderVdom
  }else{//老的有，新的也有类型也一样就需要复用节点，深度递归
    // updateElement(oldRenderVdom,newRenderVdom)
    
    const oldDOM = findDom(oldRenderVdom)
    const newDOM = createDOM(newRenderVdom)
    oldDOM.parentNode.replaceChild(newDOM,oldDOM)

    return newRenderVdom
  }
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