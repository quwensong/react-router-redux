import React from "react";
import ReactDOM from "react-dom";
/**
 * 自定义Hooks可以实现逻辑复用
 * 自定义Hooks复用的是逻辑而非状态本身，Counter1和Counter值 没有任何关系
 * 1.是一个函数
 * 2.方法名必须是use开头
 * 3.在函数内部需要调用其它的Hooks
 */


function useCounter(initialState) {
  let [number, setNumber] = React.useState(initialState);
  let handleClick = () => {
    setNumber(number + 1);
  };
  return [number, handleClick];
}
function useUser(initialState) {
  let [user, setUser] = React.useState([]);
  let addUser = () => {
    setUser([...user, { id: Date.now() }]);
  };
  return [user, addUser];
}
/* withCounter;
withUser; */
function Counter1() {
  let [number, handleClick] = useCounter(100);
  let [user, addUser] = useUser([]);
  return (
    <div>
      <p>{number}</p>
      <button onClick={handleClick}>+</button>
    </div>
  );
}
function Counter2() {
  let [number, handleClick] = useCounter(200);
  return (
    <div>
      <p>{number}</p>
      <button onClick={handleClick}>+</button>
    </div>
  );
}


class Demo extends React.Component {

  componentDidMount(){
    console.log('componentDidMount');
  }


  render() {
    return (
      <div>index</div>
    )
  }
}



// console.log(<Demo />,<div>111<span>444</span></div>);

function App() {
  return (
    <div>
      <Demo/>
      <Counter1 />
      <Counter2 />
    </div>
  );
}

console.log(<App />);
ReactDOM.render(<App />, document.getElementById("root"));
