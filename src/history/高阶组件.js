import React from './React/react';
import ReactDOM from './React/react-dom';

const withPanel = (OldComponent)=>{
  return class extends React.Component {
    show = ()=>{
      const loading = document.createElement('div')
      loading.innerHTML = `<p id='loading' style="position:absolute;top:100px">
      loading
    </p>`
    document.body.appendChild(loading)
    }
    hidden = ()=>{
      document.getElementById('loading').remove()
    }
    render(){
      return (
        <OldComponent {...this.props} show={this.show} hidden={this.hidden}/>
      )
    }
  }
}

class Panel extends React.Component {
  render(){
    return (
      <div>
        <button onClick={this.props.show}>显示</button>
        <button onClick={this.props.hidden}>隐藏</button>
      </div>
    )
  }
}

const LoadingPanel =  withPanel(Panel)

ReactDOM.render(<LoadingPanel name='quwensong'/>,document.getElementById('root'))

