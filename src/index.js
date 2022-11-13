import React from './React/react';
import ReactDOM from './React/react-dom';
// import React from 'react';
// import ReactDOM from 'react-dom';

/**
 * 组件的属性和状态改变以后组件都会更，视图都会渲染
 */
class Son extends React.Component {
  constructor(props){
    super(props)
    this.state = { 
      son:'儿子组件'
    }
  }
  componentWillMount = () => {
    console.log('Son - componentWillMount')
  }
  render(){
    console.log('Son - render')
    const vdom = (
      <h2>
        <p>
          {this.state.son}
        </p>
        <p>{this.props.count}</p>
      </h2>
    )
    return vdom
  }
  componentDidMount = () => {
    console.log('Son - componentDidMount')
  }
  componentWillReceiveProps(){

  }
  componentWillUnmount(){

  }

}


class Father extends React.Component {
  constructor(props){
    super(props)
    this.state = { 
      number:0
    }
  }
  addNumber = ()=>{
    this.setState({number: this.state.number + 1})
  }
  render(){
    const vdom = (
      <h2 className='active'>
        <p>
          {this.state.number}
        </p>
        {this.state.number === 4 ? null : <Son count={this.state.number}/>}
        <button onClick={this.addNumber}>增加1</button>
      </h2>
    )
    return vdom
  }
}


ReactDOM.render(<Father name='quwensong'/>,document.getElementById('root'))

