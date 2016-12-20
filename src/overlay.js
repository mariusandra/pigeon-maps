import React, { Component, PropTypes } from 'react'

export default class Overlay extends Component {
  static propTypes = {
    anchor: PropTypes.array,
    offset: PropTypes.array,
    left: PropTypes.number,
    top: PropTypes.number,
    children: PropTypes.node,
    className: PropTypes.string,
    latLngToPixel: PropTypes.func,
    pixelToLatLng: PropTypes.func
  }

  render () {
    const { left, top, className } = this.props

    return (
      <div style={{ position: 'absolute', left, top }} className={className || ''}>
        {this.props.children}
      </div>
    )
  }
}
