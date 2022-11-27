import { wrapToVdom } from './utils'
import { Component } from './component'
import { REACT_FORWARD_REF } from './constants'

function createElement(type,config,children){
  let ref; //用来获取虚拟dom实例
  let key; //区分同一个父亲的不同儿子的
  if(config){
    ref = config.ref;
    delete config.ref;
    key = config.key;
    delete config.key;
  }

  const props = {...config} // props里面是没有 ref和 key的,因为他们是同层级的
  if(arguments.length > 3){
    children = Array.prototype.slice.call(arguments,2).map(wrapToVdom)
  }
  if(children || ['',0].includes(children)){
    props.children = wrapToVdom(children);
  }
  return {
    type,
    props,
    ref,
    key
  }
}

function forwardRef(FunctionComponent){
  return {
    $$typeof:REACT_FORWARD_REF,
    render:FunctionComponent
  }
}

function createRef(){

  return {
    current:null
  }
}

function createContext(){
  const context = { Provider,Consumer }

  // 组件的属性和子组件都会放在props里面
  function Provider({value,children}){
    context._value = value
    return children
  }
  function Consumer({children}){
    return children(context._value)
  }

  return context
}

/**
 * 根据老元素克隆出新的元素
 * @param {*} oldElement 老元素
 * @param {*} newProps 新属性
 * @param {*} children 新的儿子们
 * @returns 
 */
function cloneElement(oldElement,newProps,children){
  if(arguments.length > 3){
    children = Array.prototype.slice.call(arguments,2).map(wrapToVdom)
  }else{
    children = wrapToVdom(children)
  }
  const props = {...oldElement.props,...newProps,children}
  return {...oldElement,props}
}


const React = {
  createElement,
  cloneElement,
  createRef,
  forwardRef,
  createContext,
  Component
}

export default React;