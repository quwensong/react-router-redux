
import { updateQueue } from "./component";

/**
 * 事件委托，把所有的组件都绑定到 document
 * @param {*} dom 
 * @param {*} eventType 
 * @param {*} handler 
 */
export function addEvent(dom,eventType,handler){
  let store; //这是一个对象，里面存放这个dom上对应的事件处理函数
  if(dom.store){
    store = dom.store;
  }else{
    dom.store = {}
    store = dom.store
  }
  // store.onclick = handler;
  store[eventType] = handler;
  if(!document[eventType]){
    document[eventType] = dispatchEvent
  }
}

function dispatchEvent(event){
  let { target,type } = event
  const eventType = `on${type}`
  updateQueue.isBatchUpdate = true //切换为批量更新模式
  const syntheticEvent = createSyntheticEvent(event)
  while(target){
    const { store } = target
    const handler = store && store[eventType]
    handler && handler.call(target,syntheticEvent)
    target = target.parentNode
  }
  updateQueue.isBatchUpdate = false //切换为批量更新模式
  updateQueue.batchUpdate()
}

function createSyntheticEvent(event){
    const syntheticEvent = {}
    for(let key in event){
      syntheticEvent[key] = event
    }
    return syntheticEvent
}