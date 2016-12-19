import React, { Component, PropTypes } from 'react'

export default class Overlay extends Component {
  static propTypes = {
    position: PropTypes.array,
    offset: PropTypes.array,
    left: PropTypes.number,
    top: PropTypes.number,
    children: PropTypes.node,
    latLngToPixel: PropTypes.func,
    pixelToLatLng: PropTypes.func
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
