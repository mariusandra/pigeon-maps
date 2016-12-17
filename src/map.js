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

    onBoundsChanged: React.PropTypes.func
  }

  constructor (props) {
    super(props)

    this._mousePosition = null
    this._dragStart = null
    this._mouseDown = false
    this._touchStartCoords = null
    this.state = {
      dragDelta: null,
      zoomDelta: 0,
      oldTiles: []
    }
  }

  componentDidMount () {
    window.addEventListener('mousedown', this.handleMouseDown)
    window.addEventListener('mouseup', this.handleMouseUp)
    window.addEventListener('mousemove', this.handleMouseMove)

    window.addEventListener('touchstart', this.handleTouchStart)
    window.addEventListener('touchmove', this.handleTouchMove)
    window.addEventListener('touchend', this.handleTouchEnd)
  }

  componentWillUnmount () {
    window.removeEventListener('mousedown', this.handleMouseDown)
    window.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('mousemove', this.handleMouseMove)

    window.removeEventListener('touchstart', this.handleTouchStart)
    window.removeEventListener('touchmove', this.handleTouchMove)
    window.removeEventListener('touchend', this.handleTouchEnd)
  }

  componentWillReceiveProps (nextProps, nextState) {
    if (Math.round(this.props.zoom) !== Math.round(nextProps.zoom)) {
      const tileValues = this.tileValues(this.props, this.state)
      const nextValues = this.tileValues(nextProps, nextState)
      const oldTiles = this.state.oldTiles

      this.setState({
        oldTiles: oldTiles.filter(o => o.roundedZoom !== tileValues.roundedZoom).concat(tileValues)
      })

      let loadTracker = {}

      for (let x = nextValues.tileMinX; x <= nextValues.tileMaxX; x++) {
        for (let y = nextValues.tileMinY; y <= nextValues.tileMaxY; y++) {
          let key = `${x}-${y}-${nextValues.roundedZoom}`
          loadTracker[key] = false
        }
      }

      this._loadTracker = loadTracker
    }
  }

  imageLoaded = (key) => {
    if (this._loadTracker && key in this._loadTracker) {
      this._loadTracker[key] = true

      // all loaded
      if (Object.keys(this._loadTracker).filter(k => !this._loadTracker[k]).length === 0) {
        this.setState({ oldTiles: [] })
      }
    }
  }

  handleTouchStart = (event) => {
    const { width, height } = this.props

    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const coords = getMouseCoords(this._containerRef, touch)

      if (coords[0] >= 0 && coords[1] >= 0 && coords[0] < width && coords[1] < height) {
        this._touchStartCoords = [[touch.clientX, touch.clientY]]
        event.preventDefault()
      }
    // added second finger and first one was in the area
    } else if (event.touches.length === 2 && this._touchStartCoords) {
      event.preventDefault()

      if (this.state.dragDelta || this.state.zoomDelta) {
        this.sendDeltaChange()
      }

      const t1 = event.touches[0]
      const t2 = event.touches[1]

      this._touchStartCoords = [[t1.clientX, t1.clientY], [t2.clientX, t2.clientY]]
      this._touchStartMidPoint = [(t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2]
      this._touchStartDistance = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2))
    }
  }

  handleTouchMove = (event) => {
    if (event.touches.length === 1 && this._touchStartCoords) {
      event.preventDefault()
      const touch = event.touches[0]

      this.setState({
        dragDelta: [
          touch.clientX - this._touchStartCoords[0][0],
          touch.clientY - this._touchStartCoords[0][1]
        ]
      })
    } else if (event.touches.length === 2 && this._touchStartCoords) {
      const { width, height, zoom } = this.props

      event.preventDefault()

      const t1 = event.touches[0]
      const t2 = event.touches[1]

      const parent = parentPosition(this._containerRef)

      const midPoint = [(t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2]
      const midPointDiff = [midPoint[0] - this._touchStartMidPoint[0], midPoint[1] - this._touchStartMidPoint[1]]

      const distance = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2))

      const zoomDelta = Math.min(18, zoom + Math.log2(distance / this._touchStartDistance)) - zoom
      const scale = Math.pow(2, zoomDelta)

      const centerDiffDiff = [
        (parent.x + width / 2 - midPoint[0]) * (scale - 1),
        (parent.y + height / 2 - midPoint[1]) * (scale - 1)
      ]

      this.setState({
        zoomDelta: zoomDelta,
        dragDelta: [
          centerDiffDiff[0] + midPointDiff[0] * scale,
          centerDiffDiff[1] + midPointDiff[1] * scale
        ]
      })
    }
  }

  handleTouchEnd = (event) => {
    if (this._touchStartCoords) {
      event.preventDefault()
      this.sendDeltaChange()
      if (event.touches.length === 0) {
        this._touchStartCoords = null
      } else if (event.touches.length === 1) {
        const touch = event.touches[0]
        this._touchStartCoords = [[touch.clientX, touch.clientY]]
      }
    }
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

  handleMouseUp = (event) => {
    if (this._mouseDown) {
      this.sendDeltaChange()
      this._mouseDown = false
    }
  }

  sendDeltaChange = () => {
    const { center, zoom, onBoundsChanged } = this.props
    const { dragDelta, zoomDelta } = this.state

    if (onBoundsChanged && (dragDelta || zoomDelta !== 0)) {
      const lng = tile2lng(lng2tile(center[1], zoom + zoomDelta) - (dragDelta ? dragDelta[0] / 256.0 : 0), zoom + zoomDelta)
      const lat = tile2lat(lat2tile(center[0], zoom + zoomDelta) - (dragDelta ? dragDelta[1] / 256.0 : 0), zoom + zoomDelta)
      onBoundsChanged({ center: [lat, lng], zoom: zoom + zoomDelta })
    }

    this.setState({
      dragDelta: null,
      zoomDelta: 0
    })
  }

  handleWheel = (event) => {
    event.preventDefault()
    this.handleWheelThrottled(event)
  }

  handleWheelThrottled = throttle(20, true, event => {
    if (event.deltaY < 0) {
      this.zoomAroundMouse(0.2)
    } else if (event.deltaY > 0) {
      this.zoomAroundMouse(-0.2)
    }
  })

  handleContextMenu = (event) => {
    event.preventDefault()
  }

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

    if (!this._mousePosition || zoom + zoomDiff < 1 || zoom + zoomDiff > 18) {
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

  tileValues (props, state) {
    const { center, zoom, width, height } = props
    const { dragDelta, zoomDelta } = state

    const roundedZoom = Math.round(zoom + zoomDelta)
    const zoomDiff = zoom + zoomDelta - roundedZoom

    const scale = Math.pow(2, zoomDiff)
    const scaleWidth = width / scale
    const scaleHeight = height / scale

    const tileCenterX = lng2tile(center[1], roundedZoom) - (dragDelta ? dragDelta[0] / 256.0 / scale : 0)
    const tileCenterY = lat2tile(center[0], roundedZoom) - (dragDelta ? dragDelta[1] / 256.0 / scale : 0)

    const halfWidth = scaleWidth / 2 / 256.0
    const halfHeight = scaleHeight / 2 / 256.0

    const tileMinX = Math.floor(tileCenterX - halfWidth)
    const tileMaxX = Math.floor(tileCenterX + halfWidth)

    const tileMinY = Math.floor(tileCenterY - halfHeight)
    const tileMaxY = Math.floor(tileCenterY + halfHeight)

    return {
      tileMinX,
      tileMaxX,
      tileMinY,
      tileMaxY,
      tileCenterX,
      tileCenterY,
      roundedZoom,
      zoomDelta,
      scaleWidth,
      scaleHeight,
      scale
    }
  }

  renderTiles () {
    const { oldTiles } = this.state
    const mapUrl = this.props.provider || wikimedia

    const {
      tileMinX,
      tileMaxX,
      tileMinY,
      tileMaxY,
      tileCenterX,
      tileCenterY,
      roundedZoom,
      scaleWidth,
      scaleHeight,
      scale
    } = this.tileValues(this.props, this.state)

    let tiles = []

    for (let i = 0; i < oldTiles.length; i++) {
      let old = oldTiles[i]
      let zoomDiff = old.roundedZoom - roundedZoom

      if (Math.abs(zoomDiff) > 4 || zoomDiff === 0) {
        continue
      }

      let pow = 1 / Math.pow(2, zoomDiff)
      let xDiff = -(tileMinX - old.tileMinX * pow) * 256
      let yDiff = -(tileMinY - old.tileMinY * pow) * 256

      for (let x = old.tileMinX; x <= old.tileMaxX; x++) {
        for (let y = old.tileMinY; y <= old.tileMaxY; y++) {
          tiles.push({
            key: `${x}-${y}-${old.roundedZoom}`,
            url: mapUrl(x, y, old.roundedZoom),
            left: xDiff + (x - old.tileMinX) * 256 * pow,
            top: yDiff + (y - old.tileMinY) * 256 * pow,
            width: 256 * pow,
            height: 256 * pow,
            active: false
          })
        }
      }
    }

    for (let x = tileMinX; x <= tileMaxX; x++) {
      for (let y = tileMinY; y <= tileMaxY; y++) {
        tiles.push({
          key: `${x}-${y}-${roundedZoom}`,
          url: mapUrl(x, y, roundedZoom),
          left: (x - tileMinX) * 256,
          top: (y - tileMinY) * 256,
          width: 256,
          height: 256,
          active: true
        })
      }
    }

    const boxStyle = {
      width: scaleWidth,
      height: scaleHeight,
      position: 'absolute',
      top: 0,
      left: 0,
      overflow: 'hidden',
      transform: `scale(${scale}, ${scale})`,
      transformOrigin: 'top left'
    }

    const left = -((tileCenterX - tileMinX) * 256 - scaleWidth / 2)
    const top = -((tileCenterY - tileMinY) * 256 - scaleHeight / 2)

    const tilesStyle = {
      position: 'absolute',
      width: (tileMaxX - tileMinX + 1) * 256,
      height: (tileMaxY - tileMinY + 1) * 256,
      left: left,
      top: top
    }

    return (
      <div style={boxStyle}>
        <div style={tilesStyle}>
          {tiles.map(tile => (
            <img key={tile.key}
                 src={tile.url}
                 width={tile.width}
                 height={tile.height}
                 onLoad={() => this.imageLoaded(tile.key)}
                 style={{ position: 'absolute', left: tile.left, top: tile.top, transform: tile.transform, transformOrigin: 'top left', opacity: 1 }} />
          ))}
        </div>
      </div>
    )
  }

  renderOverlays () {
    const { zoom, width, height } = this.props
    const { dragDelta, zoomDelta } = this.state

    const childrenWithProps = React.Children.map(this.props.children,
      (child) => {
        const { position, offset } = child.props
        if (position) {
          const c = this.latLngToPixel(position[0], position[1], zoom + zoomDelta)
          return React.cloneElement(child, {
            left: c[0] - (offset ? offset[0] : 0) + (dragDelta ? dragDelta[0] : 0),
            top: c[1] - (offset ? offset[1] : 0) + (dragDelta ? dragDelta[1] : 0)
          })
        }
      }
    )

    const childrenStyle = {
      position: 'absolute',
      width: width,
      height: height,
      top: 0,
      left: 0
    }

    return (
      <div style={childrenStyle}>
        {childrenWithProps}
      </div>
    )
  }

  render () {
    const { width, height } = this.props

    const containerStyle = {
      width: width,
      height: height,
      position: 'relative',
      display: 'inline-block',
      overflow: 'hidden',
      background: '#dddddd'
    }

    return (
      <div style={containerStyle}
           ref={this.setRef}
           onContextMenu={this.handleContextMenu}
           onWheel={this.handleWheel}>
        {this.renderTiles()}
        {this.renderOverlays()}
      </div>
    )
  }
}
