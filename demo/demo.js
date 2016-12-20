import React, { Component } from 'react'

import Map from 'pigeon-maps'
import Marker from 'pigeon-marker'

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

  handleBoundsChange = ({ center, zoom, bounds }) => {
    this.setState({ center, zoom })
  }

  handleClick = ({ event, latLng, pixel }) => {
    console.log('Map clicked!', latLng, pixel)
  }

  handleMarkerClick = ({ event, payload, anchor }) => {
    console.log(`Marker #${payload} clicked at: `, anchor)
  }

  render () {
    const { center, zoom } = this.state

    return (
      <div>
        <Map center={center}
             zoom={zoom}
             onBoundsChanged={this.handleBoundsChange}
             onClick={this.handleClick}
             width={600}
             height={400}>
          <Marker anchor={[50.879, 4.6997]} payload={1} onClick={this.handleMarkerClick} />
          <Marker anchor={[50.874, 4.6947]} payload={2} onClick={this.handleMarkerClick} />
        </Map>
        <div>
          <button onClick={this.zoomOut}>Zoom Out</button>
          <button onClick={this.zoomIn}>Zoom In</button>
          {' '}
          {zoom}
        </div>
      </div>
    )
  }
}
