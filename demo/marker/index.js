import React, { Component, PropTypes } from 'react'

import pin from './img/pin.png'
import pinHover from './img/pin-hover.png'
import pinRetina from './img/pin@2x.png'
import pinRetinaHover from './img/pin-hover@2x.png'

const offset = {
  left: 15,
  top: 31
}

export default class Marker extends Component {
  static propTypes = {
    position: PropTypes.array,
    offset: PropTypes.array,
    left: PropTypes.number,
    top: PropTypes.number,
    latLngToPixel: PropTypes.func,
    pixelToLatLng: PropTypes.func
  }

  constructor (props) {
    super(props)

    this.state = {
      hover: false
    }
  }

  handleClick = (event) => {
    console.log('marker clicked!')
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
           className='pigeon-click-block'
           onClick={this.handleClick}
           onMouseOver={this.handleMouseOver}
           onMouseOut={this.handleMouseOut}>
        <img src={image} width={29} height={34} alt='' />
      </div>
    )
  }
}
