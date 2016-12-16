import React, { Component } from 'react'

import Map, { Overlay } from 'fully-react-map'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      center: [50.879, 4.6997],
      zoom: 12
    }
  }

  zoomIn = () => {
    this.setState({
      zoom: Math.min(this.state.zoom + 1, 18)
    })
  }

  zoomOut = () => {
    this.setState({
      zoom: Math.max(this.state.zoom - 1, 1)
    })
  }

  render () {
    const { center, zoom } = this.state

    return (
      <div>
        <Map center={center} zoom={zoom} width={600} height={400}>
          <Overlay position={[50.879, 4.6997]} offset={[15, 31]}>
            <img src='https://www.apprentus.com/images/map/pin-green-large@2x.png' width={29} height={34} alt='' />
          </Overlay>
          <Overlay position={[50.874, 4.6947]} offset={[15, 31]}>
            <img src='https://www.apprentus.com/images/map/pin-green-large@2x.png' width={29} height={34} alt='' />
          </Overlay>
        </Map>
        <div>
          <button onClick={this.zoomIn}>Zoom In</button>
          <button onClick={this.zoomOut}>Zoom Out</button>
          {' '}
          {zoom}
        </div>
      </div>
    )
  }
}
