import React from './React/react';
import ReactDOM from './React/react-dom';


class AntButton extends React.Component {
  state = { name:'qws' }

  render(){
    return (
      <button name={this.state.name}>{this.props.title}</button>
    )
  }
}

const wrapper = (OldComponent)=>{
  return class extends OldComponent{

    handler = ()=>{
      console.log('点击了');
    }
    render() {
      const renderElement = super.render();
      const newProps = {
        ...renderElement.props,
        onClick:this.handler
      }
      const newRenderElement = React.cloneElement(renderElement,newProps,'哈哈哈哈')
      return newRenderElement
    }
  }
}

const WrapperAntButton = wrapper(AntButton)

ReactDOM.render(<WrapperAntButton title='quwensong'/>,document.getElementById('root'))

