import React from './React/react';
import ReactDOM from './React/react-dom';
// import React from 'react';
// import ReactDOM from 'react-dom';

/**
 * 组件的属性和状态改变以后组件都会更，视图都会渲染
 */
const ThemeContext = React.createContext()
const { Provider,Consumer } = ThemeContext

function Son(){
  return (
    <Consumer>
      {
        (value)=>(
          <div>{value.name}</div>
        ) 
      }
    </Consumer>
  )
}


// class Son extends React.Component {
//   static contextType = ThemeContext
//   constructor(props){
//     super(props)
//     this.state = { 
//       son:'儿子组件'
//     }
//   }
//   render(){
//     const vdom = (
//       <h2>
//         <p>
//           {this.state.son}:
//           {this.context.name}
//         </p>
//         <p>{this.props.count}</p>
//       </h2>
//     )
//     return vdom
//   }

// }
class Father extends React.Component {
  constructor(props){
    super(props)
    this.state = { 
      number:0
    }
  }
  render(){
    const info = { name:'瞿文松',age:18 }
    return (
    <Provider value={info}>
      <h2 >
        <div className='active'>父组件</div>
        <Son count={this.state.number}/>
      </h2>
    </Provider>
    )
  }
}


ReactDOM.render(<Father name='quwensong'/>,document.getElementById('root'))

