import React from './React/react';
import ReactDOM from './React/react-dom';
// import React from 'react';
// import ReactDOM from 'react-dom';

/**
 * 组件的属性和状态改变以后组件都会更，视图都会渲染
 */
class Text extends React.Component {
  constructor(props){
    super(props)
    this.Tdom = React.createRef()
  }

  render(){
    return (
      <h1 ref={this.Tdom}>我是文本组件</h1>
    )
  }
}

function Fun(props,ref){
  return (
    <h3 ref={ref}>函数组件</h3>
  )
}

const ForwardFun = React.forwardRef(Fun)

class Clock extends React.Component {
  constructor(props){
    super(props)
    this.numberA = React.createRef()
  }
  handlerClick = (e)=>{
    console.log(this.numberA.current)
  }
  
  render(){
    console.log(this)
    const vdom = (
      <h2 className='active'>
        <ForwardFun ref={this.numberA}/>
        <input />
        <button onClick={this.handlerClick}>显示</button>
      </h2>
    )
    console.log("🚀 ~ file: index.js ~ line 32 ~ Clock ~ render ~ vdom", vdom)
    return vdom
  }
}

console.log(<Clock name='quwensong'/>)

ReactDOM.render(<Clock name='quwensong'/>,document.getElementById('root'))


// ({...this.addressForm,this.storeId})