import { wrapToVdom } from './utils'
import { Component } from './component'

function createElement(type,config,children){
  let ref; //用来获取虚拟dom实例
  let key; //区分同一个父亲的不同儿子的
  if(config){
    ref = config.ref;
    // delete config.ref;
    key = config.key;
    delete config.key;
  }

  const props = {...config} //props里面是没有 ref和 key的,因为他们是同层级的
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
  return class extends Component{
    render(){
      return FunctionComponent(this.props,this.props.ref)
    }
  }
}

function createRef(){

  return {
    current:null
  }
}


const React = {
  createElement,
  createRef,
  forwardRef,
  Component
}

export default React;