import { findDom,compareTwoVdom } from './react-dom'
export const updateQueue = {
  isBatchUpdate: false,//通过这个变量来控制是否批量更新
  updaters:[],
  batchUpdate(){
    // console.log('批量更新')
    // 批量更新
    updateQueue.updaters.forEach(updater =>{
      updater.updateComponent()
    })
    updateQueue.isBatchUpdate = false
    updateQueue.updaters.length = 0
  }

}


class Updater {
  constructor(classInstance){
    this.classInstance = classInstance;
    this.pendingStates = [] //保存将要更新的队列
    this.callbacks = [] //保存将要执行的回调函数
  }

  addState(parsedState,cb){
    this.pendingStates.push(parsedState)
    if(typeof cb === 'function'){
      this.callbacks.push(cb)
    }
    // 触发更新逻辑
    this.emitUpdate()
  }
  emitUpdate(nextProps = {}){
    this.nextProps = nextProps  //可能会传过来的新的属性对象
    // 如果是批量更新模式，就把当前update实例添加到队列里面去
    if(updateQueue.isBatchUpdate){
      updateQueue.updaters.push(this)
    }else{
      this.updateComponent() //组件更新
    }
  }

  updateComponent(){
    const { classInstance,pendingStates,nextProps } = this
    if(nextProps || pendingStates.length > 0){
      shouldUpdate(classInstance,nextProps,this.getState())
    }
  }
  getState(){
    const { classInstance,pendingStates } = this
    let { state } = classInstance //获取老的组件状态
    pendingStates.forEach(nextState =>{
      if(typeof nextState === 'function'){
        nextState = nextState(state)
      }
      state = {...state, ...nextState}
    })
    pendingStates.length = 0
    return state
  }
}

function shouldUpdate(classInstance,nextProps,nextState){
  let willUpdate = true
  if(classInstance.shouldComponentUpdate && !classInstance.shouldComponentUpdate(nextProps,nextState)) {
    willUpdate = false
  }
  if(willUpdate && classInstance.componentWillUpdate){
    classInstance.componentWillUpdate()
  }

  if(nextProps) classInstance.props = nextProps
  // 修改实例的状态
  classInstance.state = nextState
  if(willUpdate){
    // 调用类组件实例的更新方法
    classInstance.forceUpdate()//调用类组件实例的updateComponent进行更新
  }
}


export class Component {
  static isReactComponent = true
  constructor(props){
    this.props = props
    this.state = {}
    this.updater = new Updater(this)
  }

  setState(parsedState,cb){
    this.updater.addState(parsedState,cb)
  }

  updateComponent(){
  }

  forceUpdate(){
    const oldRenderVdom = this.oldRenderVdom
    // 根据老的虚拟dom查找老的真实dom
    const oldDom = findDom(oldRenderVdom)
    const newRenderVdom = this.render()
    // 更新前的信息 getSnapshotBeforeUpdate
    const extraArgs = this.getSnapshotBeforeUpdate && this.getSnapshotBeforeUpdate.call(this)
    compareTwoVdom(oldDom.parentNode,oldRenderVdom,newRenderVdom) //比较差异，更新页面
    this.oldRenderVdom = newRenderVdom
    if(this.componentDidUpdate){
      this.componentDidUpdate(this.props,this.state,extraArgs)
    }
  }
}
// static isReactComponent = true
// 相当于
// Component.prototype.isReactComponent = true