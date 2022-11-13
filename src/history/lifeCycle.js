import React from './React/react';
import ReactDOM from './React/react-dom';
// import React from 'react';
// import ReactDOM from 'react-dom';

/**
 * 组件的属性和状态改变以后组件都会更，视图都会渲染
 */

class Clock extends React.Component {
  static defaultProps = {
    name:'999'
  }

  constructor(props){
    super(props)
    this.state = { 
      number:0
    }
  }

  addNumber = ()=>{
    this.setState({number: this.state.number + 1})
  }

  componentWillMount = () => {
    console.log('componentWillMount')
  }

  shouldComponentUpdate(nextProps,nextState){

    return nextState.number % 2 === 0
  }
  componentWillUpdate(){

  }
  componentDidUpdate(){
    
  }
  
  render(){
    const vdom = (
      <h2 className='active'>
        <p>
          {this.state.number}
        </p>
        <button onClick={this.addNumber}>增加1</button>
      </h2>
    )
    return vdom
  }
}

ReactDOM.render(<Clock name='quwensong'/>,document.getElementById('root'))

