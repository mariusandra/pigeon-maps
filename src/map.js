import React, { Component } from 'react'

import parentPosition from './utils/parent-position'

const ANIMATION_TIME = 300
const SCROLL_PIXELS_FOR_ZOOM_LEVEL = 150

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

function easeOutQuad (t) {
  return t * (2 - t)
}

export default class Map extends Component {
  static propTypes = {
    center: React.PropTypes.array,
    zoom: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    provider: React.PropTypes.func,
    children: React.PropTypes.node,
    animate: React.PropTypes.bool,

    onBoundsChanged: React.PropTypes.func
  }

  static defaultProps = {
    animate: true
  }

  constructor (props) {
    super(props)

    this._mousePosition = null
    this._dragStart = null
    this._mouseDown = false
    this._touchStartCoords = null

    this._isAnimating = false
    this._animationStart = null
    this._animationEnd = null
    this._centerTarget = null
    this._zoomTarget = null

    this.state = {
      zoom: props.zoom,
      center: props.center,
      zoomDelta: 0,
      centerDelta: null,
      oldTiles: []
    }
  }

  componentDidMount () {
    const wa = window.addEventListener
    wa('mousedown', this.handleMouseDown)
    wa('mouseup', this.handleMouseUp)
    wa('mousemove', this.handleMouseMove)

    wa('touchstart', this.handleTouchStart)
    wa('touchmove', this.handleTouchMove)
    wa('touchend', this.handleTouchEnd)
  }

  componentWillUnmount () {
    const wr = window.removeEventListener
    wr('mousedown', this.handleMouseDown)
    wr('mouseup', this.handleMouseUp)
    wr('mousemove', this.handleMouseMove)

    wr('touchstart', this.handleTouchStart)
    wr('touchmove', this.handleTouchMove)
    wr('touchend', this.handleTouchEnd)
  }

  componentWillReceiveProps (nextProps) {
    if (Math.abs(nextProps.zoom - this.state.zoom) > 0.001 ||
        Math.abs(nextProps.center[0] - this.state.center[0]) > 0.0001 ||
        Math.abs(nextProps.center[1] - this.state.center[1]) > 0.0001) {
      this.setCenterZoomTarget(nextProps.center, nextProps.zoom, true)
    }
  }

  setCenterZoomTarget = (center, zoom, fromProps, zoomAround = null) => {
    // TODO: if center diff is more than 2 screens, no animation

    if (this.props.animate) {
      if (this._isAnimating) {
        window.cancelAnimationFrame(this._animFrame)
        const { centerStep, zoomStep } = this.animationStep(window.performance.now())
        this._centerStart = centerStep
        this._zoomStart = zoomStep
      } else {
        this._isAnimating = true
        this._centerStart = [this.state.center[0], this.state.center[1]]
        this._zoomStart = this.state.zoom
      }

      this._animationStart = window.performance.now()
      this._animationEnd = this._animationStart + ANIMATION_TIME

      if (zoomAround) {
        this._zoomAround = zoomAround
        this._centerTarget = this.calculateZoomCenter(this.state.center, zoomAround, this.state.zoom, zoom)
      } else {
        this._zoomAround = null
        this._centerTarget = center
      }
      this._zoomTarget = zoom

      this._animFrame = window.requestAnimationFrame(this.animate)
    } else {
      if (zoomAround) {
        const center = this.calculateZoomCenter(this.state.center, zoomAround, this.state.zoom, zoom)
        this.setCenterZoom(center, zoom, fromProps)
      } else {
        this.setCenterZoom(center, zoom, fromProps)
      }
    }
  }

  animationStep = (timestamp) => {
    const length = this._animationEnd - this._animationStart
    const progress = Math.max(timestamp - this._animationStart, 0)
    const percentage = easeOutQuad(progress / length)

    const zoomDiff = (this._zoomTarget - this._zoomStart) * percentage
    const zoomStep = this._zoomStart + zoomDiff

    if (this._zoomAround) {
      const centerStep = this.calculateZoomCenter(this._centerStart, this._zoomAround, this._zoomStart, zoomStep)

      return { centerStep, zoomStep }
    } else {
      const centerStep = [
        this._centerStart[0] + (this._centerTarget[0] - this._centerStart[0]) * percentage,
        this._centerStart[1] + (this._centerTarget[1] - this._centerStart[1]) * percentage
      ]

      return { centerStep, zoomStep }
    }
  }

  animate = (timestamp) => {
    if (timestamp >= this._animationEnd) {
      this._isAnimating = false
      this.setCenterZoom(this._centerTarget, this._zoomTarget)
    } else {
      const { centerStep, zoomStep } = this.animationStep(timestamp)
      this.setCenterZoom(centerStep, zoomStep)
      this._animFrame = window.requestAnimationFrame(this.animate)
    }
  }

  setCenterZoom = (center, zoom) => {
    if (Math.round(this.state.zoom) !== Math.round(zoom)) {
      const tileValues = this.tileValues(this.props, this.state)
      const nextValues = this.tileValues(this.props, { center, zoom })
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

    this.setState({ center, zoom })

    if (Math.abs(this.props.zoom - zoom) > 0.001 ||
        Math.abs(this.props.center[0] - center[0]) > 0.0001 ||
        Math.abs(this.props.center[1] - center[1]) > 0.0001) {
      this.syncToProps(center, zoom)
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

      if (this.state.centerDelta || this.state.zoomDelta) {
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
        centerDelta: [
          touch.clientX - this._touchStartCoords[0][0],
          touch.clientY - this._touchStartCoords[0][1]
        ]
      })
    } else if (event.touches.length === 2 && this._touchStartCoords) {
      const { width, height } = this.props
      const { zoom } = this.state

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
        centerDelta: [
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
        centerDelta: [
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
    const { center, zoom, centerDelta, zoomDelta } = this.state

    if (centerDelta || zoomDelta !== 0) {
      const lng = tile2lng(lng2tile(center[1], zoom + zoomDelta) - (centerDelta ? centerDelta[0] / 256.0 : 0), zoom + zoomDelta)
      const lat = tile2lat(lat2tile(center[0], zoom + zoomDelta) - (centerDelta ? centerDelta[1] / 256.0 : 0), zoom + zoomDelta)
      this.setCenterZoom([lat, lng], zoom + zoomDelta)
    }

    this.setState({
      centerDelta: null,
      zoomDelta: 0
    })
  }

  syncToProps = (center = this.state.center, zoom = this.state.zoom) => {
    const { onBoundsChanged } = this.props
    if (onBoundsChanged) {
      onBoundsChanged({ center, zoom })
    }
  }

  handleWheel = (event) => {
    event.preventDefault()

    const addToZoom = -event.deltaY / SCROLL_PIXELS_FOR_ZOOM_LEVEL

    if (this._zoomTarget) {
      const stillToAdd = this._zoomTarget - this.state.zoom
      this.zoomAroundMouse(addToZoom + stillToAdd)
    } else {
      this.zoomAroundMouse(addToZoom)
    }
  }

  zoomAroundMouse = (zoomDiff) => {
    const { zoom } = this.state

    if (!this._mousePosition || (zoom === 1 && zoomDiff < 0) || (zoom === 18 && zoomDiff > 0)) {
      return
    }

    const latLngNow = this.pixelToLatLng(this._mousePosition[0], this._mousePosition[1], zoom)

    this.setCenterZoomTarget(null, Math.max(1, Math.min(zoom + zoomDiff, 18)), false, latLngNow)
  }

  handleContextMenu = (event) => {
    event.preventDefault()
  }

  // tools

  pixelToLatLng = (x, y, zoom, center = this.state.center) => {
    const { width, height } = this.props

    const pointDiff = [
      (x - width / 2) / 256.0,
      (y - height / 2) / 256.0
    ]

    const tileX = lng2tile(center[1], zoom) + pointDiff[0]
    const tileY = lat2tile(center[0], zoom) + pointDiff[1]

    return [tile2lat(tileY, zoom), tile2lng(tileX, zoom)]
  }

  latLngToPixel = (lat, lng, zoom, center = this.state.center) => {
    const { width, height } = this.props

    const tileCenterX = lng2tile(center[1], zoom)
    const tileCenterY = lat2tile(center[0], zoom)

    const tileX = lng2tile(lng, zoom)
    const tileY = lat2tile(lat, zoom)

    return [
      (tileX - tileCenterX) * 256.0 + width / 2,
      (tileY - tileCenterY) * 256.0 + height / 2
    ]
  }

  calculateZoomCenter = (center, coords, oldZoom, newZoom) => {
    const pixel = this.latLngToPixel(coords[0], coords[1], oldZoom, center)
    const latLngZoomed = this.pixelToLatLng(pixel[0], pixel[1], newZoom, center)
    const diffLat = latLngZoomed[0] - coords[0]
    const diffLng = latLngZoomed[1] - coords[1]

    return [center[0] - diffLat, center[1] - diffLng]
  }

  // ref

  setRef = (dom) => {
    this._containerRef = dom
  }

  // data to display the tiles

  tileValues (props, state) {
    const { width, height } = props
    const { center, zoom, centerDelta, zoomDelta } = state

    const roundedZoom = Math.round(zoom + zoomDelta)
    const zoomDiff = zoom + zoomDelta - roundedZoom

    const scale = Math.pow(2, zoomDiff)
    const scaleWidth = width / scale
    const scaleHeight = height / scale

    const tileCenterX = lng2tile(center[1], roundedZoom) - (centerDelta ? centerDelta[0] / 256.0 / scale : 0)
    const tileCenterY = lat2tile(center[0], roundedZoom) - (centerDelta ? centerDelta[1] / 256.0 / scale : 0)

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

  // display the tiles

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

      let xMin = Math.max(old.tileMinX, 0)
      let yMin = Math.max(old.tileMinY, 0)
      let xMax = Math.min(old.tileMaxX, Math.pow(2, old.roundedZoom) - 1)
      let yMax = Math.min(old.tileMaxY, Math.pow(2, old.roundedZoom) - 1)

      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
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

    let xMin = Math.max(tileMinX, 0)
    let yMin = Math.max(tileMinY, 0)
    let xMax = Math.min(tileMaxX, Math.pow(2, roundedZoom) - 1)
    let yMax = Math.min(tileMaxY, Math.pow(2, roundedZoom) - 1)

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
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
    const { width, height } = this.props
    const { zoom, centerDelta, zoomDelta } = this.state

    const childrenWithProps = React.Children.map(this.props.children,
      (child) => {
        const { position, offset } = child.props
        if (position) {
          const c = this.latLngToPixel(position[0], position[1], zoom + zoomDelta)
          return React.cloneElement(child, {
            left: c[0] - (offset ? offset[0] : 0) + (centerDelta ? centerDelta[0] : 0),
            top: c[1] - (offset ? offset[1] : 0) + (centerDelta ? centerDelta[1] : 0)
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
