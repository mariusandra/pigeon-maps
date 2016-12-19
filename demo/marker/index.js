import React from 'react'

import { Overlay } from 'pigeon-maps'

import pin from './img/pin.png'
import pinHover from './img/pin-hover.png'
import pinRetina from './img/pin@2x.png'
import pinRetinaHover from './img/pin-hover@2x.png'

const offset = {
  left: 15,
  top: 31
}

export default class Marker extends Overlay {
  constructor (props) {
    super(props)

    this.state = {
      hover: false
    }
  }

  handleMouseOver = () => {
    this.setState({ hover: true })
  }

  handleMouseOut = () => {
    this.setState({ hover: false })
  }

  render () {
    const { left, top } = this.props
    const { hover } = this.state

    const image = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? (hover ? pinRetinaHover : pinRetina) : (hover ? pinHover : pin)

    return (
      <div style={{ position: 'absolute', left: left - offset.left, top: top - offset.top, cursor: 'pointer' }}
           onClick={this.props.onClick}
           onMouseOver={this.handleMouseOver}
           onMouseOut={this.handleMouseOut}>
        <img src={image} width={29} height={34} alt='' />
      </div>
    )
  }
}
