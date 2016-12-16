import React, { Component } from 'react'
import { throttle } from 'throttle-debounce'

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

    onBoundsChanged: React.PropTypes.func,
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

  componentDidMount () {
    window.addEventListener('mousedown', this.handleMouseDown)
    window.addEventListener('mouseup', this.handleMouseUp)
    window.addEventListener('mousemove', this.handleMouseMove)
  }

  componentWillUnmount () {
    window.removeEventListener('mousedown', this.handleMouseDown)
    window.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('mousemove', this.handleMouseMove)
  }

  handleMouseDown = (event) => {
    const { width, height } = this.props
    const coords = getMouseCoords(this._containerRef, event)

    if (coords[0] >= 0 && coords[1] >= 0 && coords[0] < width && coords[1] < height) {
      this._mouseDown = true
      this._dragStart = coords
      event.preventDefault()
    }
  }

  handleMouseUp = (event) => {
    if (this._mouseDown) {
      const { center, zoom, onBoundsChanged } = this.props
      const { dragDelta } = this.state

      if (dragDelta && onBoundsChanged) {
        const lng = tile2lng(lng2tile(center[1], zoom) - (dragDelta ? dragDelta[0] / 256.0 : 0), zoom)
        const lat = tile2lat(lat2tile(center[0], zoom) - (dragDelta ? dragDelta[1] / 256.0 : 0), zoom)
        onBoundsChanged({ center: [lat, lng], zoom })
      }

      this._mouseDown = false
      this.setState({
        dragDelta: null
      })
    }
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

  handleWheel = throttle(100, true, event => {
    if (event.deltaY < 0) {
      this.zoomAroundMouse(1)
    } else if (event.deltaY > 0) {
      this.zoomAroundMouse(-1)
    }
  })

  pixelToLatLng = (x, y, zoom = this.props.zoom) => {
    const { center, width, height } = this.props

    const pointDiff = [
      (x - width / 2) / 256.0,
      (y - height / 2) / 256.0
    ]

    const tileX = lng2tile(center[1], zoom) + pointDiff[0]
    const tileY = lat2tile(center[0], zoom) + pointDiff[1]

    return [tile2lat(tileY, zoom), tile2lng(tileX, zoom)]
  }

  latLngToPixel = (lat, lng, zoom = this.props.zoom) => {
    const { center, width, height } = this.props

    const tileCenterX = lng2tile(center[1], zoom)
    const tileCenterY = lat2tile(center[0], zoom)

    const tileX = lng2tile(lng, zoom)
    const tileY = lat2tile(lat, zoom)

    return [
      (tileX - tileCenterX) * 256.0 + width / 2,
      (tileY - tileCenterY) * 256.0 + height / 2
    ]
  }

  zoomAroundMouse = (zoomDiff) => {
    const { center, zoom, onBoundsChanged } = this.props

    if (zoom + zoomDiff < 1 || zoom + zoomDiff > 18) {
      return
    }

    const latLngNow = this.pixelToLatLng(this._mousePosition[0], this._mousePosition[1], zoom)
    const latLngZoomed = this.pixelToLatLng(this._mousePosition[0], this._mousePosition[1], zoom + zoomDiff)

    const diffLat = latLngZoomed[0] - latLngNow[0]
    const diffLng = latLngZoomed[1] - latLngNow[1]

    onBoundsChanged({ center: [center[0] - diffLat, center[1] - diffLng], zoom: zoom + zoomDiff })
  }

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
           ref={this.setRef}
           onWheel={this.handleWheel}>
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
