import React from '../React/react';
import ReactDOM from '../React/react-dom';

const spanColor = {
  backgroundColor: 'red'
}


function FunComp(props){
  return <h4>函数组件{props.name}</h4>
}
const element = React.createElement('div',{
  className:'active',
  style:spanColor
},
React.createElement('span',null,'hello-span'),
React.createElement(FunComp,{name:'zf'}))

console.log(element);

ReactDOM.render(element,document.getElementById('root'))

