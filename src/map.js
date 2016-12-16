import React, { Component } from 'react'

import parentPosition from './utils/parent-position'

function wikimedia (x, y, z) {
  const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2
  return `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}${retina ? '@2x' : ''}.png`
}

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
const lng2tile = (lon, zoom) => (lon + 180) / 360 * Math.pow(2, zoom)
const lat2tile = (lat, zoom) => (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)

function tile2lng (x, z) {
  return (x / Math.pow(2, z) * 360 - 180)
}

function tile2lat (y, z) {
  var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z)
  return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))))
}

function getMouseCoords (dom, event) {
  const parent = parentPosition(dom)
  return [event.clientX - parent.x, event.clientY - parent.y]
}

export default class Map extends Component {
  static propTypes = {
    center: React.PropTypes.array,
    zoom: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    provider: React.PropTypes.func,
    children: React.PropTypes.node,

    onCenterChanged: React.PropTypes.func,
    onZoomChanged: React.PropTypes.func
  }

  constructor (props) {
    super(props)

    this._mousePosition = null
    this._dragStart = null
    this._mouseDown = false
    this.state = {
      dragDelta: null
    }
  }

  handleMouseDown = (event) => {
    this._mouseDown = true
    this._dragStart = getMouseCoords(this._containerRef, event)
  }

  handleMouseUp = (event) => {
    const { center, zoom, onCenterChanged } = this.props
    const { dragDelta } = this.state

    if (dragDelta && onCenterChanged) {
      const lng = tile2lng(lng2tile(center[1], zoom) - (dragDelta ? dragDelta[0] / 256.0 : 0), zoom)
      const lat = tile2lat(lat2tile(center[0], zoom) - (dragDelta ? dragDelta[1] / 256.0 : 0), zoom)
      onCenterChanged(lat, lng)
    }

    this._mouseDown = false
    this.setState({
      dragDelta: null
    })
  }

  handleMouseMove = (event) => {
    this._mousePosition = getMouseCoords(this._containerRef, event)

    if (this._mouseDown && this._dragStart) {
      this.setState({
        dragDelta: [
          this._mousePosition[0] - this._dragStart[0],
          this._mousePosition[1] - this._dragStart[1]
        ]
      })
    }
  }

  // handleMouseLeave = (event) => {
  //   this._mousePosition = null
  // }

  setRef = (dom) => {
    this._containerRef = dom
  }

  render () {
    const { center, zoom, width, height, provider } = this.props
    const { dragDelta } = this.state

    const mapUrl = provider || wikimedia

    const tileCenterX = lng2tile(center[1], zoom) - (dragDelta ? dragDelta[0] / 256.0 : 0)
    const tileCenterY = lat2tile(center[0], zoom) - (dragDelta ? dragDelta[1] / 256.0 : 0)

    const halfWidth = width / 2 / 256.0
    const halfHeight = height / 2 / 256.0

    const tileMinX = Math.floor(tileCenterX - halfWidth)
    const tileMaxX = Math.floor(tileCenterX + halfWidth)

    const tileMinY = Math.floor(tileCenterY - halfHeight)
    const tileMaxY = Math.floor(tileCenterY + halfHeight)

    let tiles = []
    for (let x = tileMinX; x <= tileMaxX; x++) {
      for (let y = tileMinY; y <= tileMaxY; y++) {
        tiles.push({
          key: `${x}-${y}-${zoom}`,
          url: mapUrl(x, y, zoom),
          left: (x - tileMinX) * 256,
          top: (y - tileMinY) * 256
        })
      }
    }

    const left = -((tileCenterX - tileMinX) * 256 - width / 2)
    const top = -((tileCenterY - tileMinY) * 256 - height / 2)

    const childrenWithProps = React.Children.map(this.props.children,
      (child) => {
        const { position, offset } = child.props
        if (position) {
          const childLeft = (lng2tile(position[1], zoom) - tileMinX) * 256
          const childTop = (lat2tile(position[0], zoom) - tileMinY) * 256
          return React.cloneElement(child, {
            left: childLeft - (offset ? offset[0] : 0),
            top: childTop - (offset ? offset[1] : 0)
          })
        }
      }
    )

    const containerStyle = {
      width,
      height,
      position: 'relative',
      display: 'inline-block',
      overflow: 'hidden'
    }

    const tilesStyle = {
      position: 'absolute',
      width: (tileMaxX - tileMinX + 1) * 256,
      height: (tileMaxY - tileMinY + 1) * 256,
      left: left,
      top: top
    }

    return (
      <div style={containerStyle}
           onMouseDown={this.handleMouseDown}
           onMouseUp={this.handleMouseUp}
           onMouseMove={this.handleMouseMove}
           onMouseLeave={this.handleMouseLeave}
           ref={this.setRef}>
        <div style={tilesStyle}>
          {tiles.map(tile => (
            <img key={tile.key} src={tile.url} width={256} height={256} style={{ position: 'absolute', left: tile.left, top: tile.top }} />
          ))}
        </div>
        <div style={tilesStyle}>
          {childrenWithProps}
        </div>
      </div>
    )
  }
}
