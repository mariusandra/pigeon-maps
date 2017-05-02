import { React, Inferno, Component, PropTypes } from './infact'

import parentPosition from './utils/parent-position'
import parentHasClass from './utils/parent-has-class'
import debounce from './utils/debounce'

const ANIMATION_TIME = 300
const DIAGONAL_THROW_TIME = 1500
const SCROLL_PIXELS_FOR_ZOOM_LEVEL = 150
const MIN_DRAG_FOR_THROW = 40
const CLICK_TOLERANCE = 2
const DOUBLE_CLICK_DELAY = 300
const DEBOUNCE_DELAY = 60

const NOOP = () => {}

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

function getMousePixel (dom, event) {
  const parent = parentPosition(dom)
  return [event.clientX - parent.x, event.clientY - parent.y]
}

function easeOutQuad (t) {
  return t * (2 - t)
}

const minLng = tile2lng(0, 10)
const minLat = tile2lat(Math.pow(2, 10), 10)

const maxLng = tile2lng(Math.pow(2, 10), 10)
const maxLat = tile2lat(0, 10)

export default class Map extends Component {
  static propTypes = process.env.BABEL_ENV === 'inferno' ? {} : {
    center: PropTypes.array,
    defaultCenter: PropTypes.array,
    zoom: PropTypes.number,
    defaultZoom: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    provider: PropTypes.func,
    children: PropTypes.node,
    animate: PropTypes.bool,
    zoomOnMouseWheel: PropTypes.bool,
    attribution: PropTypes.any,
    attributionPrefix: PropTypes.any,

    onClick: PropTypes.func,
    onBoundsChanged: PropTypes.func
  }

  static defaultProps = {
    animate: true,
    zoomOnMoouseWheel: true
  }

  constructor (props) {
    super(props)

    this.syncToProps = debounce(this.syncToProps, DEBOUNCE_DELAY)

    this._mousePosition = null
    this._dragStart = null
    this._mouseDown = false
    this._moveEvents = []
    this._lastClick = null
    this._lastTap = null
    this._touchStartCoords = null

    this._isAnimating = false
    this._animationStart = null
    this._animationEnd = null
    this._centerTarget = null
    this._zoomTarget = null

    // When users are using uncontrolled components we have to keep this
    // so we can know if we should call onBoundsChanged
    this._lastZoom = props.defaultZoom ? props.defaultZoom : props.zoom
    this._lastCenter = props.defaultCenter ? props.defaultCenter : props.center
    this._boundsSynced = false

    this.state = {
      zoom: this._lastZoom,
      center: this._lastCenter,
      zoomDelta: 0,
      pixelDelta: null,
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

    this.syncToProps()
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
    if (!nextProps.center && !nextProps.zoom) {
      // if the user isn't controlling neither zoom nor center we don't have to update.
      return
    }
    if (
      (
        !nextProps.center ||
        (
          nextProps.center[0] === this.props.center[0] &&
          nextProps.center[1] === this.props.center[1]
        )
      ) &&
      nextProps.zoom === this.props.zoom
    ) {
      // if the user is controlling either zoom or center but nothing changed
      // we don't have to update aswell
      return
    }
    const maybeCenter = nextProps.center ? nextProps.center : this.state.center
    const maybeZoom = nextProps.zoom ? nextProps.zoom : this.state.zoom
    if (Math.abs(maybeZoom - this.state.zoom) > 0.001 ||
        Math.abs(maybeCenter[0] - this.state.center[0]) > 0.0001 ||
        Math.abs(maybeCenter[1] - this.state.center[1]) > 0.0001) {
      this.setCenterZoomTarget(maybeCenter, maybeZoom, true)
    }
  }

  setCenterZoomTarget = (center, zoom, fromProps, zoomAround = null, animationDuration = ANIMATION_TIME) => {
    // TODO: if center diff is more than 2 screens, no animation
    if (this.props.animate) {
      if (this._isAnimating) {
        window.cancelAnimationFrame(this._animFrame)
        const { centerStep, zoomStep } = this.animationStep(window.performance.now())
        this._centerStart = centerStep
        this._zoomStart = zoomStep
      } else {
        this._isAnimating = true
        this._centerStart = this.limitCenterAtZoom([this._lastCenter[0], this._lastCenter[1]], this._lastZoom)
        this._zoomStart = this._lastZoom
      }

      this._animationStart = window.performance.now()
      this._animationEnd = this._animationStart + animationDuration

      if (zoomAround) {
        this._zoomAround = zoomAround
        this._centerTarget = this.calculateZoomCenter(this._lastCenter, zoomAround, this._lastZoom, zoom)
      } else {
        this._zoomAround = null
        this._centerTarget = center
      }
      this._zoomTarget = zoom

      this._animFrame = window.requestAnimationFrame(this.animate)
    } else {
      if (zoomAround) {
        const center = this.calculateZoomCenter(this._lastCenter, zoomAround, this._lastZoom, zoom)
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

  stopAnimating = () => {
    if (this._isAnimating) {
      this._isAnimating = false
      window.cancelAnimationFrame(this._animFrame)
    }
  }

  limitCenterAtZoom = (center, zoom) => {
    // TODO: use zoom to hide the gray area of the map - adjust the center
    return [
      Math.max(Math.min(isNaN(center[0]) ? this.state.center[0] : center[0], maxLat), minLat),
      Math.max(Math.min(isNaN(center[1]) ? this.state.center[1] : center[1], maxLng), minLng)
    ]
  }

  // main logic when changing coordinates
  setCenterZoom = (center, zoom) => {
    const limitedCenter = this.limitCenterAtZoom(center, zoom)

    if (Math.round(this.state.zoom) !== Math.round(zoom)) {
      const tileValues = this.tileValues(this.props, this.state)
      const nextValues = this.tileValues(this.props, { center: limitedCenter, zoom })
      const oldTiles = this.state.oldTiles

      this.setState({
        oldTiles: oldTiles.filter(o => o.roundedZoom !== tileValues.roundedZoom).concat(tileValues)
      }, NOOP)

      let loadTracker = {}

      for (let x = nextValues.tileMinX; x <= nextValues.tileMaxX; x++) {
        for (let y = nextValues.tileMinY; y <= nextValues.tileMaxY; y++) {
          let key = `${x}-${y}-${nextValues.roundedZoom}`
          loadTracker[key] = false
        }
      }

      this._loadTracker = loadTracker
    }

    this.setState({ center: limitedCenter, zoom }, NOOP)

    const maybeZoom = this.props.zoom ? this.props.zoom : this._lastZoom
    const maybeCenter = this.props.center ? this.props.center : this._lastCenter
    if (Math.abs(maybeZoom - zoom) > 0.001 ||
        Math.abs(maybeCenter[0] - limitedCenter[0]) > 0.00001 ||
        Math.abs(maybeCenter[1] - limitedCenter[1]) > 0.00001) {
      this._lastZoom = zoom
      this._lastCenter = [...limitedCenter]
      this.syncToProps(limitedCenter, zoom)
    }
  }

  imageLoaded = (key) => {
    if (this._loadTracker && key in this._loadTracker) {
      this._loadTracker[key] = true

      const unloadedCount = Object.keys(this._loadTracker).filter(k => !this._loadTracker[k]).length

      if (unloadedCount === 0) {
        this.setState({ oldTiles: [] }, NOOP)
      }
    }
  }

  coordsInside (pixel) {
    const { width, height } = this.props
    if (pixel[0] < 0 || pixel[1] < 0 || pixel[0] >= width || pixel[1] >= height) {
      return false
    }

    const parent = this._containerRef
    const pos = parentPosition(parent)
    const element = document.elementFromPoint(pixel[0] + pos.x, pixel[1] + pos.y)

    return parent === element || parent.contains(element)
  }

  handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const pixel = getMousePixel(this._containerRef, touch)

      if (this.coordsInside(pixel)) {
        this._touchStartCoords = [[touch.clientX, touch.clientY]]

        this.stopAnimating()
        event.preventDefault()

        if (this._lastTap && window.performance.now() - this._lastTap < DOUBLE_CLICK_DELAY) {
          const latLngNow = this.pixelToLatLng(this._touchStartCoords[0])
          this.setCenterZoomTarget(null, Math.max(1, Math.min(this.state.zoom + 1, 18)), false, latLngNow)
        } else {
          this._lastTap = window.performance.now()
          this.startTrackingMoveEvents(pixel)
        }
      }
    // added second finger and first one was in the area
    } else if (event.touches.length === 2 && this._touchStartCoords) {
      event.preventDefault()

      this.stopTrackingMoveEvents()

      if (this.state.pixelDelta || this.state.zoomDelta) {
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
      const pixel = getMousePixel(this._containerRef, touch)
      this.trackMoveEvents(pixel)

      this.setState({
        pixelDelta: [
          touch.clientX - this._touchStartCoords[0][0],
          touch.clientY - this._touchStartCoords[0][1]
        ]
      }, NOOP)
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
        pixelDelta: [
          centerDiffDiff[0] + midPointDiff[0] * scale,
          centerDiffDiff[1] + midPointDiff[1] * scale
        ]
      }, NOOP)
    }
  }

  handleTouchEnd = (event) => {
    if (this._touchStartCoords) {
      event.preventDefault()
      const { center, zoom } = this.sendDeltaChange()

      if (event.touches.length === 0) {
        this._touchStartCoords = null
        const pixel = getMousePixel(this._containerRef, event.changedTouches[0])
        this.throwAfterMoving(pixel, center, zoom)
      } else if (event.touches.length === 1) {
        const touch = event.touches[0]
        const pixel = getMousePixel(this._containerRef, touch)

        this._touchStartCoords = [[touch.clientX, touch.clientY]]
        this.startTrackingMoveEvents(pixel)
      }
    }
  }

  handleMouseDown = (event) => {
    const pixel = getMousePixel(this._containerRef, event)

    if (event.button === 0 &&
        !parentHasClass(event.target, 'pigeon-drag-block') &&
        this.coordsInside(pixel)) {
      this.stopAnimating()
      event.preventDefault()

      if (this._lastClick && window.performance.now() - this._lastClick < DOUBLE_CLICK_DELAY) {
        const latLngNow = this.pixelToLatLng(this._mousePosition)
        this.setCenterZoomTarget(null, Math.max(1, Math.min(this.state.zoom + 1, 18)), false, latLngNow)
      } else {
        this._lastClick = window.performance.now()

        this._mouseDown = true
        this._dragStart = pixel
        this.startTrackingMoveEvents(pixel)
      }
    }
  }

  handleMouseMove = (event) => {
    this._mousePosition = getMousePixel(this._containerRef, event)

    if (this._mouseDown && this._dragStart) {
      this.trackMoveEvents(this._mousePosition)
      this.setState({
        pixelDelta: [
          this._mousePosition[0] - this._dragStart[0],
          this._mousePosition[1] - this._dragStart[1]
        ]
      }, NOOP)
    }
  }

  handleMouseUp = (event) => {
    const { pixelDelta } = this.state

    if (this._mouseDown) {
      this._mouseDown = false

      const pixel = getMousePixel(this._containerRef, event)

      if (this.props.onClick &&
          !parentHasClass(event.target, 'pigeon-click-block') &&
          (!pixelDelta || Math.abs(pixelDelta[0]) + Math.abs(pixelDelta[1]) <= CLICK_TOLERANCE)) {
        const latLng = this.pixelToLatLng(pixel)
        this.props.onClick({ event, latLng, pixel: pixel })
        this.setState({ pixelDelta: null }, NOOP)
      } else {
        const { center, zoom } = this.sendDeltaChange()

        this.throwAfterMoving(pixel, center, zoom)
      }
    }
  }

  // https://www.bennadel.com/blog/1856-using-jquery-s-animate-step-callback-function-to-create-custom-animations.htm
  startTrackingMoveEvents = (coords) => {
    this._moveEvents = [{ timestamp: window.performance.now(), coords }]
  }

  stopTrackingMoveEvents = () => {
    this._moveEvents = []
  }

  trackMoveEvents = (coords) => {
    const timestamp = window.performance.now()

    if (timestamp - this._moveEvents[this._moveEvents.length - 1].timestamp > 40) {
      this._moveEvents.push({ timestamp, coords })
      if (this._moveEvents.length > 2) {
        this._moveEvents.shift()
      }
    }
  }

  throwAfterMoving = (coords, center, zoom) => {
    const { width, height, animate } = this.props

    const timestamp = window.performance.now()
    const lastEvent = this._moveEvents.shift()

    if (lastEvent && animate) {
      const deltaMs = Math.max(timestamp - lastEvent.timestamp, 1)

      const delta = [
        (coords[0] - lastEvent.coords[0]) / deltaMs * 120,
        (coords[1] - lastEvent.coords[1]) / deltaMs * 120
      ]

      const distance = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1])

      if (distance > MIN_DRAG_FOR_THROW) {
        const diagonal = Math.sqrt(width * width + height * height)

        const throwTime = DIAGONAL_THROW_TIME * distance / diagonal

        const lng = tile2lng(lng2tile(center[1], zoom) - (delta[0] / 256.0), zoom)
        const lat = tile2lat(lat2tile(center[0], zoom) - (delta[1] / 256.0), zoom)

        this.setCenterZoomTarget([lat, lng], zoom, false, null, throwTime)
      }
    }

    this.stopTrackingMoveEvents()
  }

  sendDeltaChange = () => {
    const { center, zoom, pixelDelta, zoomDelta } = this.state

    let lat = center[0]
    let lng = center[1]

    if (pixelDelta || zoomDelta !== 0) {
      lng = tile2lng(lng2tile(center[1], zoom + zoomDelta) - (pixelDelta ? pixelDelta[0] / 256.0 : 0), zoom + zoomDelta)
      lat = tile2lat(lat2tile(center[0], zoom + zoomDelta) - (pixelDelta ? pixelDelta[1] / 256.0 : 0), zoom + zoomDelta)
      this.setCenterZoom([lat, lng], zoom + zoomDelta)
    }

    this.setState({
      pixelDelta: null,
      zoomDelta: 0
    }, NOOP)

    return {
      center: this.limitCenterAtZoom([lat, lng], zoom + zoomDelta),
      zoom: zoom + zoomDelta
    }
  }

  getBounds = (center = this.state.center, zoom = this.zoomPlusDelta()) => {
    const { width, height } = this.props

    return {
      ne: this.pixelToLatLng([width - 1, 0], center, zoom),
      sw: this.pixelToLatLng([0, height - 1], center, zoom)
    }
  }

  syncToProps = (center = this.state.center, zoom = this.state.zoom) => {
    const { onBoundsChanged } = this.props

    if (onBoundsChanged) {
      const bounds = this.getBounds(center, zoom)

      onBoundsChanged({ center, zoom, bounds, initial: !this._boundsSynced })

      this._boundsSynced = true
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

    const latLngNow = this.pixelToLatLng(this._mousePosition)

    this.setCenterZoomTarget(null, Math.max(1, Math.min(zoom + zoomDiff, 18)), false, latLngNow)
  }

  // tools

  zoomPlusDelta = () => {
    return this.state.zoom + this.state.zoomDelta
  }

  pixelToLatLng = (pixel, center = this.state.center, zoom = this.zoomPlusDelta()) => {
    const { width, height } = this.props
    const { pixelDelta } = this.state

    const pointDiff = [
      (pixel[0] - width / 2 - (pixelDelta ? pixelDelta[0] : 0)) / 256.0,
      (pixel[1] - height / 2 - (pixelDelta ? pixelDelta[1] : 0)) / 256.0
    ]

    const tileX = lng2tile(center[1], zoom) + pointDiff[0]
    const tileY = lat2tile(center[0], zoom) + pointDiff[1]

    return this.limitCenterAtZoom([tile2lat(tileY, zoom), tile2lng(tileX, zoom)], zoom)
  }

  latLngToPixel = (latLng, center = this.state.center, zoom = this.zoomPlusDelta()) => {
    const { width, height } = this.props
    const { pixelDelta } = this.state

    const limitedCenter = this.limitCenterAtZoom(center)

    const tileCenterX = lng2tile(limitedCenter[1], zoom)
    const tileCenterY = lat2tile(limitedCenter[0], zoom)

    const tileX = lng2tile(latLng[1], zoom)
    const tileY = lat2tile(latLng[0], zoom)

    return [
      (tileX - tileCenterX) * 256.0 + width / 2 + (pixelDelta ? pixelDelta[0] : 0),
      (tileY - tileCenterY) * 256.0 + height / 2 + (pixelDelta ? pixelDelta[1] : 0)
    ]
  }

  calculateZoomCenter = (center, coords, oldZoom, newZoom) => {
    const { width, height } = this.props

    const pixelBefore = this.latLngToPixel(coords, center, oldZoom)
    const pixelAfter = this.latLngToPixel(coords, center, newZoom)

    const newCenter = this.pixelToLatLng([
      width / 2 + pixelAfter[0] - pixelBefore[0],
      height / 2 + pixelAfter[1] - pixelBefore[1]
    ], center, newZoom)

    return this.limitCenterAtZoom(newCenter, newZoom)
  }

  // ref

  setRef = (dom) => {
    this._containerRef = dom
  }

  // data to display the tiles

  tileValues (props, state) {
    const { width, height } = props
    const { center, zoom, pixelDelta, zoomDelta } = state

    const roundedZoom = Math.round(zoom + (zoomDelta || 0))
    const zoomDiff = zoom + (zoomDelta || 0) - roundedZoom

    const scale = Math.pow(2, zoomDiff)
    const scaleWidth = width / scale
    const scaleHeight = height / scale

    const tileCenterX = lng2tile(center[1], roundedZoom) - (pixelDelta ? pixelDelta[0] / 256.0 / scale : 0)
    const tileCenterY = lat2tile(center[0], roundedZoom) - (pixelDelta ? pixelDelta[1] / 256.0 / scale : 0)

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
      zoomDelta: zoomDelta || 0,
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
      willChange: 'transform',
      transform: `scale(${scale}, ${scale})`,
      transformOrigin: 'top left'
    }

    const left = -((tileCenterX - tileMinX) * 256 - scaleWidth / 2)
    const top = -((tileCenterY - tileMinY) * 256 - scaleHeight / 2)

    const tilesStyle = {
      position: 'absolute',
      width: (tileMaxX - tileMinX + 1) * 256,
      height: (tileMaxY - tileMinY + 1) * 256,
      willChange: 'transform',
      transform: `translate(${left}px, ${top}px)`
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
                 style={{ position: 'absolute', left: tile.left, top: tile.top, willChange: 'transform', transform: tile.transform, transformOrigin: 'top left', opacity: 1 }} />
          ))}
        </div>
      </div>
    )
  }

  renderOverlays () {
    const { width, height } = this.props
    const { center } = this.state

    const mapState = {
      bounds: this.getBounds(),
      zoom: this.zoomPlusDelta(),
      center: center,
      width,
      height
    }

    let childrenWithProps
    if (process.env.BABEL_ENV === 'react') {
      childrenWithProps = React.Children.map(this.props.children,
        (child) => {
          const { anchor, position, offset } = child.props

          const c = this.latLngToPixel(anchor || position || center)

          return React.cloneElement(child, {
            left: c[0] - (offset ? offset[0] : 0),
            top: c[1] - (offset ? offset[1] : 0),
            latLngToPixel: this.latLngToPixel,
            pixelToLatLng: this.pixelToLatLng,
            mapState
          })
        }
      )
    }

    if (process.env.BABEL_ENV === 'inferno') {
      const childrenChecked = this.props.children
      ? (
        (Array.isArray && Array.isArray(this.props.children))
          ? this.props.children
          : [].concat(this.props.children)
        )
      : []

      childrenWithProps = childrenChecked.map((child) => {
        const { anchor, position, offset } = child.props

        const c = this.latLngToPixel(anchor || position || center)

        return Inferno.cloneVNode(child, {
          left: c[0] - (offset ? offset[0] : 0),
          top: c[1] - (offset ? offset[1] : 0),
          latLngToPixel: this.latLngToPixel,
          pixelToLatLng: this.pixelToLatLng,
          mapState
        })
      })
    }

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

  renderAttribution () {
    const { attribution, attributionPrefix } = this.props

    if (attribution === false) {
      return null
    }

    const style = {
      position: 'absolute',
      bottom: 0,
      right: 0,
      fontSize: '11px',
      padding: '2px 5px',
      background: 'rgba(255, 255, 255, 0.7)',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: '#333'
    }

    const linkStyle = {
      color: '#0078A8',
      textDecoration: 'none'
    }

    return (
      <div key='attr' className='pigeon-attribution' style={style}>
        {attributionPrefix === false ? null : (
          <span>
            {attributionPrefix || <a href='https://github.com/mariusandra/pigeon-maps' style={linkStyle}>Pigeon</a>}
            {' | '}
          </span>
        )}
        {attribution || (<span>
          {' © '}
          <a href='https://www.openstreetmap.org/copyright' style={linkStyle}>OpenStreetMap</a>
          {' contributors'}
        </span>)}
      </div>
    )
  }

  render () {
    const { width, height, zoomOnMoouseWheel } = this.props

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
           onWheel={zoomOnMoouseWheel ? this.handleWheel : undefined}>
        {this.renderTiles()}
        {this.renderOverlays()}
        {this.renderAttribution()}
      </div>
    )
  }
}
