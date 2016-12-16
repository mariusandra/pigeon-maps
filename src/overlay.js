import React, { Component } from 'react'

export default class Overlay extends Component {
  static propTypes = {
    position: React.PropTypes.array,
    offset: React.PropTypes.array,
    left: React.PropTypes.number,
    top: React.PropTypes.number,
    children: React.PropTypes.node
  }

  render () {
    const { left, top } = this.props

    return (
      <div style={{ position: 'absolute', left, top }}>
        {this.props.children}
      </div>
    )
  }
}
