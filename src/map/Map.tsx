import React, { Component } from 'react'

import { debounce, parentPosition, parentHasClass } from '../utils'
import {
  Bounds,
  MapProps,
  MapReactState,
  MinMaxBounds,
  MoveEvent,
  Point,
  Tile,
  TileComponent,
  TileValues,
  WAdd,
  WarningType,
  WRem,
} from '../types'
import { osm } from '../providers'

const ANIMATION_TIME = 300
const DIAGONAL_THROW_TIME = 1500
const SCROLL_PIXELS_FOR_ZOOM_LEVEL = 150
const MIN_DRAG_FOR_THROW = 40
const CLICK_TOLERANCE = 2
const DOUBLE_CLICK_DELAY = 300
const DEBOUNCE_DELAY = 60
const PINCH_RELEASE_THROW_DELAY = 300
const WARNING_DISPLAY_TIMEOUT = 300

const NOOP = () => true

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
const lng2tile = (lon: number, zoom: number): number => ((lon + 180) / 360) * Math.pow(2, zoom)
const lat2tile = (lat: number, zoom: number): number =>
  ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
  Math.pow(2, zoom)

function tile2lng(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180
}

function tile2lat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z)
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

function getMousePixel(dom: HTMLElement, event: Pick<MouseEvent, 'clientX' | 'clientY'>): Point {
  const parent = parentPosition(dom)
  return [event.clientX - parent.x, event.clientY - parent.y]
}

function easeOutQuad(t: number): number {
  return t * (2 - t)
}

// minLat, maxLat, minLng, maxLng
const absoluteMinMax = [
  tile2lat(Math.pow(2, 10), 10),
  tile2lat(0, 10),
  tile2lng(0, 10),
  tile2lng(Math.pow(2, 10), 10),
] as MinMaxBounds

const hasWindow = typeof window !== 'undefined'

const performanceNow =
  hasWindow && window.performance && window.performance.now
    ? () => window.performance.now()
    : (() => {
        const timeStart = new Date().getTime()
        return () => new Date().getTime() - timeStart
      })()

const requestAnimationFrame = (callback: (timestamp: number) => void): number | null => {
  if (hasWindow) {
    return (window.requestAnimationFrame || window.setTimeout)(callback)
  } else {
    callback(new Date().getTime())
    return null
  }
}
const cancelAnimationFrame = (animFrame: number | null) =>
  hasWindow && animFrame ? (window.cancelAnimationFrame || window.clearTimeout)(animFrame) : false

function srcSet(
  dprs: number[],
  url: (x: number, y: number, z: number, dpr?: number) => string,
  x: number,
  y: number,
  z: number
): string {
  if (!dprs || dprs.length === 0) {
    return ''
  }
  return dprs.map((dpr) => url(x, y, z, dpr) + (dpr === 1 ? '' : ` ${dpr}x`)).join(', ')
}

const ImgTile: TileComponent = ({ tile, tileLoaded }) => (
  <img
    src={tile.url}
    srcSet={tile.srcSet}
    width={tile.width}
    height={tile.height}
    loading={'lazy'}
    onLoad={tileLoaded}
    alt={''}
    style={{
      position: 'absolute',
      left: tile.left,
      top: tile.top,
      willChange: 'transform',
      transformOrigin: 'top left',
      opacity: 1,
    }}
  />
)

export class Map extends Component<MapProps, MapReactState> {
  static defaultProps = {
    animate: true,
    metaWheelZoom: false,
    metaWheelZoomWarning: 'Use META + wheel to zoom!',
    twoFingerDrag: false,
    twoFingerDragWarning: 'Use two fingers to move the map',
    zoomSnap: true,
    mouseEvents: true,
    touchEvents: true,
    warningZIndex: 100,
    animateMaxScreens: 5,
    minZoom: 1,
    maxZoom: 18,
    limitBounds: 'center',
    dprs: [],
    tileComponent: ImgTile,
  }

  _containerRef?: HTMLDivElement
  _mousePosition?: Point
  _loadTracker?: { [key: string]: boolean }
  _dragStart: Point | null = null
  _mouseDown = false
  _moveEvents: MoveEvent[] = []
  _lastClick: number | null = null
  _lastTap: number | null = null
  _lastWheel: number | null = null
  _touchStartPixel: Point[] | null = null
  _touchStartMidPoint: Point | null = null
  _touchStartDistance: number | null = null
  _secondTouchEnd: number | null = null
  _warningClearTimeout: number | null = null

  _isAnimating = false
  _animationStart: number | null = null
  _animationEnd: number | null = null
  _zoomStart: number | null = null
  _centerTarget: Point | null = null
  _zoomTarget: number | null = null
  _zoomAround: Point | null = null
  _animFrame: number | null = null

  _boundsSynced = false
  _minMaxCache: [number, number, number, MinMaxBounds] | null = null

  _lastZoom: number
  _lastCenter: Point
  _centerStart?: Point

  _resizeObserver = null

  constructor(props: MapProps) {
    super(props)

    this.syncToProps = debounce(this.syncToProps, DEBOUNCE_DELAY)

    // When users are using uncontrolled components we have to keep this
    // so we can know if we should call onBoundsChanged
    this._lastZoom = props.defaultZoom ?? props.zoom ?? 14
    this._lastCenter = props.defaultCenter ?? props.center ?? [0, 0]

    this.state = {
      zoom: this._lastZoom,
      center: this._lastCenter,
      width: props.width ?? props.defaultWidth ?? -1,
      height: props.height ?? props.defaultHeight ?? -1,
      zoomDelta: 0,
      pixelDelta: undefined,
      oldTiles: [],
      showWarning: false,
      warningType: undefined,
    }
  }

  componentDidMount(): void {
    this.props.mouseEvents && this.bindMouseEvents()
    this.props.touchEvents && this.bindTouchEvents()

    if (!this.props.width || !this.props.height) {
      // A height:100% container div often results in height=0 being returned on mount.
      // So ask again once everything is painted.
      if (!this.updateWidthHeight()) {
        requestAnimationFrame(this.updateWidthHeight)
      }
      this.bindResizeEvent()
    }

    this.bindWheelEvent()
    this.syncToProps()

    if (typeof (window as any).ResizeObserver !== 'undefined') {
      this._resizeObserver = new (window as any).ResizeObserver(() => {
        this.updateWidthHeight()
      })

      this._resizeObserver.observe(this._containerRef)
    }
  }

  componentWillUnmount(): void {
    this.props.mouseEvents && this.unbindMouseEvents()
    this.props.touchEvents && this.unbindTouchEvents()

    this.unbindWheelEvent()

    if (!this.props.width || !this.props.height) {
      this.unbindResizeEvent()
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
    }
  }

  updateWidthHeight = (): boolean => {
    if (this._containerRef) {
      const rect = this._containerRef.getBoundingClientRect()

      if (rect && rect.width > 0 && rect.height > 0) {
        this.setState({
          width: rect.width,
          height: rect.height,
        })
        return true
      }
    }
    return false
  }

  wa: WAdd = (...args: Parameters<WAdd>) => window.addEventListener(...args)
  wr: WRem = (...args: Parameters<WRem>) => window.removeEventListener(...args)

  bindMouseEvents = (): void => {
    this.wa('mousedown', this.handleMouseDown)
    this.wa('mouseup', this.handleMouseUp)
    this.wa('mousemove', this.handleMouseMove)
  }

  bindTouchEvents = (): void => {
    this.wa('touchstart', this.handleTouchStart, { passive: false })
    this.wa('touchmove', this.handleTouchMove, { passive: false })
    this.wa('touchend', this.handleTouchEnd, { passive: false })
  }

  unbindMouseEvents = (): void => {
    this.wr('mousedown', this.handleMouseDown)
    this.wr('mouseup', this.handleMouseUp)
    this.wr('mousemove', this.handleMouseMove)
  }

  unbindTouchEvents = (): void => {
    this.wr('touchstart', this.handleTouchStart)
    this.wr('touchmove', this.handleTouchMove)
    this.wr('touchend', this.handleTouchEnd)
  }

  bindResizeEvent = (): void => {
    this.wa('resize', this.updateWidthHeight)
  }

  unbindResizeEvent = (): void => {
    this.wr('resize', this.updateWidthHeight)
  }

  bindWheelEvent = (): void => {
    if (this._containerRef) {
      this._containerRef.addEventListener('wheel', this.handleWheel, { passive: false })
    }
  }

  unbindWheelEvent = (): void => {
    if (this._containerRef) {
      this._containerRef.removeEventListener('wheel', this.handleWheel)
    }
  }

  componentDidUpdate(prevProps: MapProps): void {
    if (this.props.mouseEvents !== prevProps.mouseEvents) {
      this.props.mouseEvents ? this.bindMouseEvents() : this.unbindMouseEvents()
    }

    if (this.props.touchEvents !== prevProps.touchEvents) {
      this.props.touchEvents ? this.bindTouchEvents() : this.unbindTouchEvents()
    }

    if (this.props.width && this.props.width !== prevProps.width) {
      this.setState({ width: this.props.width })
    }

    if (this.props.height && this.props.height !== prevProps.height) {
      this.setState({ height: this.props.height })
    }

    if (!this.props.center && !this.props.zoom) {
      // if the user isn't controlling neither zoom nor center we don't have to update.
      return
    }
    if (
      (!this.props.center ||
        (this.props.center[0] === prevProps?.center?.[0] && this.props.center[1] === prevProps.center[1])) &&
      this.props.zoom === prevProps.zoom
    ) {
      // if the user is controlling either zoom or center but nothing changed
      // we don't have to update aswell
      return
    }

    const currentCenter = this._isAnimating ? this._centerTarget : this.state.center
    const currentZoom = this._isAnimating ? this._zoomTarget : this.state.zoom

    if (currentCenter && currentZoom) {
      const nextCenter = this.props.center ?? currentCenter // prevent the rare null errors
      const nextZoom = this.props.zoom ?? currentZoom

      if (
        Math.abs(nextZoom - currentZoom) > 0.001 ||
        Math.abs(nextCenter[0] - currentCenter[0]) > 0.0001 ||
        Math.abs(nextCenter[1] - currentCenter[1]) > 0.0001
      ) {
        this.setCenterZoomTarget(nextCenter, nextZoom, true)
      }
    }
  }

  setCenterZoomTarget = (
    center: Point | null,
    zoom: number,
    fromProps = false,
    zoomAround: Point | null = null,
    animationDuration = ANIMATION_TIME
  ): void => {
    if (
      this.props.animate &&
      (!fromProps ||
        this.distanceInScreens(center, zoom, this.state.center, this.state.zoom) <= this.props.animateMaxScreens)
    ) {
      if (this._isAnimating) {
        cancelAnimationFrame(this._animFrame)
        const { centerStep, zoomStep } = this.animationStep(performanceNow())
        this._centerStart = centerStep
        this._zoomStart = zoomStep
      } else {
        this._isAnimating = true
        this._centerStart = this.limitCenterAtZoom([this._lastCenter[0], this._lastCenter[1]], this._lastZoom)
        this._zoomStart = this._lastZoom
        this.onAnimationStart()
      }

      this._animationStart = performanceNow()
      this._animationEnd = this._animationStart + animationDuration

      if (zoomAround) {
        this._zoomAround = zoomAround
        this._centerTarget = this.calculateZoomCenter(this._lastCenter, zoomAround, this._lastZoom, zoom)
      } else {
        this._zoomAround = null
        this._centerTarget = center
      }
      this._zoomTarget = zoom

      this._animFrame = requestAnimationFrame(this.animate)
    } else {
      this.stopAnimating()

      if (zoomAround) {
        const center = this.calculateZoomCenter(this._lastCenter, zoomAround, this._lastZoom, zoom)
        this.setCenterZoom(center, zoom, fromProps)
      } else {
        this.setCenterZoom(center || this.state.center, zoom, fromProps)
      }
    }
  }

  setCenterZoomForChildren = (center: Point | null, zoom: number): void => {
    this.setCenterZoomTarget(center || this.state.center, zoom || this.state.zoom, true)
  }

  distanceInScreens = (centerTarget: Point, zoomTarget: number, center: Point, zoom: number): number => {
    const { width, height } = this.state

    // distance in pixels at the current zoom level
    const l1 = this.latLngToPixel(center, center, zoom)
    const l2 = this.latLngToPixel(centerTarget, center, zoom)

    // distance in pixels at the target zoom level (could be the same)
    const z1 = this.latLngToPixel(center, center, zoomTarget)
    const z2 = this.latLngToPixel(centerTarget, center, zoomTarget)

    // take the average between the two and divide by width or height to get the distance multiplier in screens
    const w = (Math.abs(l1[0] - l2[0]) + Math.abs(z1[0] - z2[0])) / 2 / width
    const h = (Math.abs(l1[1] - l2[1]) + Math.abs(z1[1] - z2[1])) / 2 / height

    // return the distance
    return Math.sqrt(w * w + h * h)
  }

  animationStep = (timestamp: number): { centerStep: Point; zoomStep: number } => {
    if (
      !this._animationEnd ||
      !this._animationStart ||
      !this._zoomTarget ||
      !this._zoomStart ||
      !this._centerStart ||
      !this._centerTarget
    ) {
      return {
        centerStep: this.state.center,
        zoomStep: this.state.zoom,
      }
    }
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
        this._centerStart[1] + (this._centerTarget[1] - this._centerStart[1]) * percentage,
      ] as Point

      return { centerStep, zoomStep }
    }
  }

  animate = (timestamp: number): void => {
    if (!this._animationEnd || timestamp >= this._animationEnd) {
      this._isAnimating = false
      this.setCenterZoom(this._centerTarget, this._zoomTarget, true)
      this.onAnimationStop()
    } else {
      const { centerStep, zoomStep } = this.animationStep(timestamp)
      this.setCenterZoom(centerStep, zoomStep)
      this._animFrame = requestAnimationFrame(this.animate)
    }
  }

  stopAnimating = (): void => {
    if (this._isAnimating) {
      this._isAnimating = false
      this.onAnimationStop()
      cancelAnimationFrame(this._animFrame)
    }
  }

  limitCenterAtZoom = (center?: Point | null, zoom?: number | null): Point => {
    // [minLat, maxLat, minLng, maxLng]
    const minMax = this.getBoundsMinMax(zoom || this.state.zoom)

    return [
      Math.max(Math.min(!center || isNaN(center[0]) ? this.state.center[0] : center[0], minMax[1]), minMax[0]),
      Math.max(Math.min(!center || isNaN(center[1]) ? this.state.center[1] : center[1], minMax[3]), minMax[2]),
    ] as Point
  }

  onAnimationStart = (): void => {
    this.props.onAnimationStart && this.props.onAnimationStart()
  }

  onAnimationStop = (): void => {
    this.props.onAnimationStop && this.props.onAnimationStop()
  }

  // main logic when changing coordinates
  setCenterZoom = (center?: Point | null, zoom?: number | null, animationEnded = false): void => {
    const limitedCenter = this.limitCenterAtZoom(center, zoom)

    if (zoom && Math.round(this.state.zoom) !== Math.round(zoom)) {
      const tileValues = this.tileValues(this.state)
      const nextValues = this.tileValues({
        center: limitedCenter,
        zoom,
        width: this.state.width,
        height: this.state.height,
      })
      const oldTiles = this.state.oldTiles

      this.setState(
        {
          oldTiles: oldTiles.filter((o) => o.roundedZoom !== tileValues.roundedZoom).concat(tileValues),
        },
        NOOP
      )

      const loadTracker: { [key: string]: boolean } = {}

      for (let x = nextValues.tileMinX; x <= nextValues.tileMaxX; x++) {
        for (let y = nextValues.tileMinY; y <= nextValues.tileMaxY; y++) {
          const key = `${x}-${y}-${nextValues.roundedZoom}`
          loadTracker[key] = false
        }
      }

      this._loadTracker = loadTracker
    }

    this.setState({ center: limitedCenter, zoom: zoom || this.state.zoom }, NOOP)

    const maybeZoom = this.props.zoom ? this.props.zoom : this._lastZoom
    const maybeCenter = this.props.center ? this.props.center : this._lastCenter
    if (
      zoom &&
      (animationEnded ||
        Math.abs(maybeZoom - zoom) > 0.001 ||
        Math.abs(maybeCenter[0] - limitedCenter[0]) > 0.00001 ||
        Math.abs(maybeCenter[1] - limitedCenter[1]) > 0.00001)
    ) {
      this._lastZoom = zoom
      this._lastCenter = [...limitedCenter]
      this.syncToProps(limitedCenter, zoom)
    }
  }

  getBoundsMinMax = (zoom: number): MinMaxBounds => {
    if (this.props.limitBounds === 'center') {
      return absoluteMinMax
    }

    const { width, height } = this.state

    if (
      this._minMaxCache &&
      this._minMaxCache[0] === zoom &&
      this._minMaxCache[1] === width &&
      this._minMaxCache[2] === height
    ) {
      return this._minMaxCache[3]
    }

    const pixelsAtZoom = Math.pow(2, zoom) * 256

    const minLng = width > pixelsAtZoom ? 0 : tile2lng(width / 512, zoom) // x
    const minLat = height > pixelsAtZoom ? 0 : tile2lat(Math.pow(2, zoom) - height / 512, zoom) // y

    const maxLng = width > pixelsAtZoom ? 0 : tile2lng(Math.pow(2, zoom) - width / 512, zoom) // x
    const maxLat = height > pixelsAtZoom ? 0 : tile2lat(height / 512, zoom) // y

    const minMax = [minLat, maxLat, minLng, maxLng] as MinMaxBounds

    this._minMaxCache = [zoom, width, height, minMax]

    return minMax
  }

  tileLoaded = (key: string): void => {
    if (this._loadTracker && key in this._loadTracker) {
      this._loadTracker[key] = true

      const unloadedCount = Object.values(this._loadTracker).filter((v) => !v).length

      if (unloadedCount === 0) {
        this.setState({ oldTiles: [] }, NOOP)
      }
    }
  }

  coordsInside(pixel: Point): boolean {
    const { width, height } = this.state

    if (pixel[0] < 0 || pixel[1] < 0 || pixel[0] >= width || pixel[1] >= height) {
      return false
    }

    const parent = this._containerRef
    if (parent) {
      const pos = parentPosition(parent)
      const element = document.elementFromPoint(pixel[0] + pos.x, pixel[1] + pos.y)

      return parent === element || parent.contains(element)
    } else {
      return false
    }
  }

  handleTouchStart = (event: TouchEvent): void => {
    if (!this._containerRef) {
      return
    }
    if (event.target && parentHasClass(event.target as HTMLElement, 'pigeon-drag-block')) {
      return
    }
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const pixel = getMousePixel(this._containerRef, touch)

      if (this.coordsInside(pixel)) {
        this._touchStartPixel = [pixel]

        if (!this.props.twoFingerDrag) {
          this.stopAnimating()

          if (this._lastTap && performanceNow() - this._lastTap < DOUBLE_CLICK_DELAY) {
            event.preventDefault()
            const latLngNow = this.pixelToLatLng(this._touchStartPixel[0])
            this.setCenterZoomTarget(
              null,
              Math.max(this.props.minZoom, Math.min(this.state.zoom + 1, this.props.maxZoom)),
              false,
              latLngNow
            )
          } else {
            this._lastTap = performanceNow()
            this.trackMoveEvents(pixel)
          }
        }
      }
      // added second finger and first one was in the area
    } else if (event.touches.length === 2 && this._touchStartPixel) {
      event.preventDefault()

      this.stopTrackingMoveEvents()

      if (this.state.pixelDelta || this.state.zoomDelta) {
        this.sendDeltaChange()
      }

      const t1 = getMousePixel(this._containerRef, event.touches[0])
      const t2 = getMousePixel(this._containerRef, event.touches[1])

      this._touchStartPixel = [t1, t2]
      this._touchStartMidPoint = [(t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2]
      this._touchStartDistance = Math.sqrt(Math.pow(t1[0] - t2[0], 2) + Math.pow(t1[1] - t2[1], 2))
    }
  }

  handleTouchMove = (event: TouchEvent): void => {
    if (!this._containerRef) {
      this._touchStartPixel = null
      return
    }
    if (event.touches.length === 1 && this._touchStartPixel) {
      const touch = event.touches[0]
      const pixel = getMousePixel(this._containerRef, touch)

      if (this.props.twoFingerDrag) {
        if (this.coordsInside(pixel)) {
          this.showWarning('fingers')
        }
      } else {
        event.preventDefault()
        this.trackMoveEvents(pixel)

        this.setState(
          {
            pixelDelta: [pixel[0] - this._touchStartPixel[0][0], pixel[1] - this._touchStartPixel[0][1]],
          },
          NOOP
        )
      }
    } else if (
      event.touches.length === 2 &&
      this._touchStartPixel &&
      this._touchStartMidPoint &&
      this._touchStartDistance
    ) {
      const { width, height, zoom } = this.state

      event.preventDefault()

      const t1 = getMousePixel(this._containerRef, event.touches[0])
      const t2 = getMousePixel(this._containerRef, event.touches[1])

      const midPoint = [(t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2]
      const midPointDiff = [midPoint[0] - this._touchStartMidPoint[0], midPoint[1] - this._touchStartMidPoint[1]]

      const distance = Math.sqrt(Math.pow(t1[0] - t2[0], 2) + Math.pow(t1[1] - t2[1], 2))

      const zoomDelta =
        Math.max(
          this.props.minZoom,
          Math.min(this.props.maxZoom, zoom + Math.log2(distance / this._touchStartDistance))
        ) - zoom
      const scale = Math.pow(2, zoomDelta)

      const centerDiffDiff = [(width / 2 - midPoint[0]) * (scale - 1), (height / 2 - midPoint[1]) * (scale - 1)]

      this.setState(
        {
          zoomDelta: zoomDelta,
          pixelDelta: [centerDiffDiff[0] + midPointDiff[0] * scale, centerDiffDiff[1] + midPointDiff[1] * scale],
        },
        NOOP
      )
    }
  }

  handleTouchEnd = (event: TouchEvent): void => {
    if (!this._containerRef) {
      this._touchStartPixel = null
      return
    }
    if (this._touchStartPixel) {
      const { zoomSnap, twoFingerDrag, minZoom, maxZoom } = this.props
      const { zoomDelta } = this.state
      const { center, zoom } = this.sendDeltaChange()

      if (event.touches.length === 0) {
        if (twoFingerDrag) {
          this.clearWarning()
        } else {
          // if the click started and ended at about
          // the same place we can view it as a click
          // and not prevent default behavior.
          const oldTouchPixel = this._touchStartPixel[0]
          const newTouchPixel = getMousePixel(this._containerRef, event.changedTouches[0])

          if (
            Math.abs(oldTouchPixel[0] - newTouchPixel[0]) > CLICK_TOLERANCE ||
            Math.abs(oldTouchPixel[1] - newTouchPixel[1]) > CLICK_TOLERANCE
          ) {
            // don't throw immediately after releasing the second finger
            if (!this._secondTouchEnd || performanceNow() - this._secondTouchEnd > PINCH_RELEASE_THROW_DELAY) {
              event.preventDefault()
              this.throwAfterMoving(newTouchPixel, center, zoom)
            }
          }

          this._touchStartPixel = null
          this._secondTouchEnd = null
        }
      } else if (event.touches.length === 1) {
        event.preventDefault()
        const touch = getMousePixel(this._containerRef, event.touches[0])

        this._secondTouchEnd = performanceNow()
        this._touchStartPixel = [touch]
        this.trackMoveEvents(touch)

        if (zoomSnap) {
          // if somehow we have no midpoint for the two finger touch, just take the center of the map
          const latLng = this._touchStartMidPoint ? this.pixelToLatLng(this._touchStartMidPoint) : this.state.center

          let zoomTarget

          // do not zoom up/down if we must drag with 2 fingers and didn't change the zoom level
          if (twoFingerDrag && Math.round(this.state.zoom) === Math.round(this.state.zoom + zoomDelta)) {
            zoomTarget = Math.round(this.state.zoom)
          } else {
            zoomTarget = zoomDelta > 0 ? Math.ceil(this.state.zoom) : Math.floor(this.state.zoom)
          }
          const zoom = Math.max(minZoom, Math.min(zoomTarget, maxZoom))

          this.setCenterZoomTarget(latLng, zoom, false, latLng)
        }
      }
    }
  }

  handleMouseDown = (event: MouseEvent): void => {
    if (!this._containerRef) {
      return
    }
    const pixel = getMousePixel(this._containerRef, event)

    if (
      event.button === 0 &&
      (!event.target || !parentHasClass(event.target as HTMLElement, 'pigeon-drag-block')) &&
      this.coordsInside(pixel)
    ) {
      this.stopAnimating()
      event.preventDefault()

      if (this._lastClick && performanceNow() - this._lastClick < DOUBLE_CLICK_DELAY) {
        if (!parentHasClass(event.target as HTMLElement, 'pigeon-click-block')) {
          const latLngNow = this.pixelToLatLng(this._mousePosition || pixel)
          this.setCenterZoomTarget(
            null,
            Math.max(this.props.minZoom, Math.min(this.state.zoom + 1, this.props.maxZoom)),
            false,
            latLngNow
          )
        }
      } else {
        this._lastClick = performanceNow()

        this._mouseDown = true
        this._dragStart = pixel
        this.trackMoveEvents(pixel)
      }
    }
  }

  handleMouseMove = (event: MouseEvent): void => {
    if (!this._containerRef) {
      return
    }
    this._mousePosition = getMousePixel(this._containerRef, event)

    if (this._mouseDown && this._dragStart) {
      this.trackMoveEvents(this._mousePosition)
      this.setState(
        {
          pixelDelta: [this._mousePosition[0] - this._dragStart[0], this._mousePosition[1] - this._dragStart[1]],
        },
        NOOP
      )
    }
  }

  handleMouseUp = (event: MouseEvent): void => {
    if (!this._containerRef) {
      this._mouseDown = false
      return
    }
    const { pixelDelta } = this.state

    if (this._mouseDown) {
      this._mouseDown = false

      const pixel = getMousePixel(this._containerRef, event)

      if (
        this.props.onClick &&
        (!event.target || !parentHasClass(event.target as HTMLElement, 'pigeon-click-block')) &&
        (!pixelDelta || Math.abs(pixelDelta[0]) + Math.abs(pixelDelta[1]) <= CLICK_TOLERANCE)
      ) {
        const latLng = this.pixelToLatLng(pixel)
        this.props.onClick({ event, latLng, pixel })
        this.setState({ pixelDelta: undefined }, NOOP)
      } else {
        const { center, zoom } = this.sendDeltaChange()

        this.throwAfterMoving(pixel, center, zoom)
      }
    }
  }

  // https://www.bennadel.com/blog/1856-using-jquery-s-animate-step-callback-function-to-create-custom-animations.htm
  stopTrackingMoveEvents = (): void => {
    this._moveEvents = []
  }

  trackMoveEvents = (coords: Point): void => {
    const timestamp = performanceNow()

    if (this._moveEvents.length === 0 || timestamp - this._moveEvents[this._moveEvents.length - 1].timestamp > 40) {
      this._moveEvents.push({ timestamp, coords })
      if (this._moveEvents.length > 2) {
        this._moveEvents.shift()
      }
    }
  }

  throwAfterMoving = (coords: Point, center: Point, zoom: number): void => {
    const { width, height } = this.state
    const { animate } = this.props

    const timestamp = performanceNow()
    const lastEvent = this._moveEvents.shift()

    if (lastEvent && animate) {
      const deltaMs = Math.max(timestamp - lastEvent.timestamp, 1)

      const delta = [
        ((coords[0] - lastEvent.coords[0]) / deltaMs) * 120,
        ((coords[1] - lastEvent.coords[1]) / deltaMs) * 120,
      ]

      const distance = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1])

      if (distance > MIN_DRAG_FOR_THROW) {
        const diagonal = Math.sqrt(width * width + height * height)

        const throwTime = (DIAGONAL_THROW_TIME * distance) / diagonal

        const lng = tile2lng(lng2tile(center[1], zoom) - delta[0] / 256.0, zoom)
        const lat = tile2lat(lat2tile(center[0], zoom) - delta[1] / 256.0, zoom)

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

    this.setState(
      {
        pixelDelta: undefined,
        zoomDelta: 0,
      },
      NOOP
    )

    return {
      center: this.limitCenterAtZoom([lat, lng], zoom + zoomDelta),
      zoom: zoom + zoomDelta,
    }
  }

  getBounds = (center = this.state.center, zoom = this.zoomPlusDelta()): Bounds => {
    const { width, height } = this.state

    return {
      ne: this.pixelToLatLng([width - 1, 0], center, zoom),
      sw: this.pixelToLatLng([0, height - 1], center, zoom),
    }
  }

  syncToProps = (center = this.state.center, zoom = this.state.zoom): void => {
    const { onBoundsChanged } = this.props

    if (onBoundsChanged) {
      const bounds = this.getBounds(center, zoom)

      onBoundsChanged({ center, zoom, bounds, initial: !this._boundsSynced })

      this._boundsSynced = true
    }
  }

  handleWheel = (event: WheelEvent): void => {
    const { mouseEvents, metaWheelZoom, zoomSnap, animate } = this.props

    if (!mouseEvents) {
      return
    }

    if (!metaWheelZoom || event.metaKey || event.ctrlKey) {
      event.preventDefault()

      const addToZoom = -event.deltaY / SCROLL_PIXELS_FOR_ZOOM_LEVEL

      if (!zoomSnap && this._zoomTarget) {
        const stillToAdd = this._zoomTarget - this.state.zoom
        this.zoomAroundMouse(addToZoom + stillToAdd, event)
      } else {
        if (animate) {
          this.zoomAroundMouse(addToZoom, event)
        } else {
          if (!this._lastWheel || performanceNow() - this._lastWheel > ANIMATION_TIME) {
            this._lastWheel = performanceNow()
            this.zoomAroundMouse(addToZoom, event)
          }
        }
      }
    } else {
      this.showWarning('wheel')
    }
  }

  showWarning = (warningType: WarningType): void => {
    if (!this.state.showWarning || this.state.warningType !== warningType) {
      this.setState({ showWarning: true, warningType })
    }

    if (this._warningClearTimeout) {
      window.clearTimeout(this._warningClearTimeout)
    }
    this._warningClearTimeout = window.setTimeout(this.clearWarning, WARNING_DISPLAY_TIMEOUT)
  }

  clearWarning = (): void => {
    if (this.state.showWarning) {
      this.setState({ showWarning: false })
    }
  }

  zoomAroundMouse = (zoomDiff: number, event: MouseEvent): void => {
    if (!this._containerRef) {
      return
    }
    const { zoom } = this.state
    const { minZoom, maxZoom, zoomSnap } = this.props

    this._mousePosition = getMousePixel(this._containerRef, event)

    if (!this._mousePosition || (zoom === minZoom && zoomDiff < 0) || (zoom === maxZoom && zoomDiff > 0)) {
      return
    }

    const latLngNow = this.pixelToLatLng(this._mousePosition)

    let zoomTarget = zoom + zoomDiff
    if (zoomSnap) {
      zoomTarget = zoomDiff < 0 ? Math.floor(zoomTarget) : Math.ceil(zoomTarget)
    }
    zoomTarget = Math.max(minZoom, Math.min(zoomTarget, maxZoom))

    this.setCenterZoomTarget(null, zoomTarget, false, latLngNow)
  }

  // tools

  zoomPlusDelta = (): number => {
    return this.state.zoom + this.state.zoomDelta
  }

  pixelToLatLng = (pixel: Point, center = this.state.center, zoom = this.zoomPlusDelta()): Point => {
    const { width, height, pixelDelta } = this.state

    const pointDiff = [
      (pixel[0] - width / 2 - (pixelDelta ? pixelDelta[0] : 0)) / 256.0,
      (pixel[1] - height / 2 - (pixelDelta ? pixelDelta[1] : 0)) / 256.0,
    ]

    const tileX = lng2tile(center[1], zoom) + pointDiff[0]
    const tileY = lat2tile(center[0], zoom) + pointDiff[1]

    return [
      Math.max(absoluteMinMax[0], Math.min(absoluteMinMax[1], tile2lat(tileY, zoom))),
      Math.max(absoluteMinMax[2], Math.min(absoluteMinMax[3], tile2lng(tileX, zoom))),
    ] as Point
  }

  latLngToPixel = (latLng: Point, center = this.state.center, zoom = this.zoomPlusDelta()): Point => {
    const { width, height, pixelDelta } = this.state

    const tileCenterX = lng2tile(center[1], zoom)
    const tileCenterY = lat2tile(center[0], zoom)

    const tileX = lng2tile(latLng[1], zoom)
    const tileY = lat2tile(latLng[0], zoom)

    return [
      (tileX - tileCenterX) * 256.0 + width / 2 + (pixelDelta ? pixelDelta[0] : 0),
      (tileY - tileCenterY) * 256.0 + height / 2 + (pixelDelta ? pixelDelta[1] : 0),
    ] as Point
  }

  calculateZoomCenter = (center: Point, coords: Point, oldZoom: number, newZoom: number): Point => {
    const { width, height } = this.state

    const pixelBefore = this.latLngToPixel(coords, center, oldZoom)
    const pixelAfter = this.latLngToPixel(coords, center, newZoom)

    const newCenter = this.pixelToLatLng(
      [width / 2 + pixelAfter[0] - pixelBefore[0], height / 2 + pixelAfter[1] - pixelBefore[1]],
      center,
      newZoom
    )

    return this.limitCenterAtZoom(newCenter, newZoom)
  }

  // ref

  setRef = (dom: HTMLDivElement) => {
    this._containerRef = dom
  }

  // data to display the tiles

  tileValues({
    center,
    zoom,
    pixelDelta,
    zoomDelta,
    width,
    height,
  }: {
    center: Point
    zoom: number
    pixelDelta?: Point
    zoomDelta?: number
    width: number
    height: number
  }): TileValues {
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
      scale,
    }
  }

  // display the tiles

  renderTiles(): JSX.Element {
    const { oldTiles, width, height } = this.state
    const { dprs } = this.props
    const mapUrl = this.props.provider || osm

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
      scale,
    } = this.tileValues(this.state)

    const tiles: Tile[] = []

    for (let i = 0; i < oldTiles.length; i++) {
      const old = oldTiles[i]
      const zoomDiff = old.roundedZoom - roundedZoom

      if (Math.abs(zoomDiff) > 4 || zoomDiff === 0) {
        continue
      }

      const pow = 1 / Math.pow(2, zoomDiff)
      const xDiff = -(tileMinX - old.tileMinX * pow) * 256
      const yDiff = -(tileMinY - old.tileMinY * pow) * 256

      const xMin = Math.max(old.tileMinX, 0)
      const yMin = Math.max(old.tileMinY, 0)
      const xMax = Math.min(old.tileMaxX, Math.pow(2, old.roundedZoom) - 1)
      const yMax = Math.min(old.tileMaxY, Math.pow(2, old.roundedZoom) - 1)

      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
          tiles.push({
            key: `${x}-${y}-${old.roundedZoom}`,
            url: mapUrl(x, y, old.roundedZoom),
            srcSet: srcSet(dprs, mapUrl, x, y, old.roundedZoom),
            left: xDiff + (x - old.tileMinX) * 256 * pow,
            top: yDiff + (y - old.tileMinY) * 256 * pow,
            width: 256 * pow,
            height: 256 * pow,
            active: false,
          })
        }
      }
    }

    const xMin = Math.max(tileMinX, 0)
    const yMin = Math.max(tileMinY, 0)
    const xMax = Math.min(tileMaxX, Math.pow(2, roundedZoom) - 1)
    const yMax = Math.min(tileMaxY, Math.pow(2, roundedZoom) - 1)

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tiles.push({
          key: `${x}-${y}-${roundedZoom}`,
          url: mapUrl(x, y, roundedZoom),
          srcSet: srcSet(dprs, mapUrl, x, y, roundedZoom),
          left: (x - tileMinX) * 256,
          top: (y - tileMinY) * 256,
          width: 256,
          height: 256,
          active: true,
        })
      }
    }

    const boxStyle: React.CSSProperties = {
      width: scaleWidth,
      height: scaleHeight,
      position: 'absolute',
      top: `calc((100% - ${height}px) / 2)`,
      left: `calc((100% - ${width}px) / 2)`,
      overflow: 'hidden',
      willChange: 'transform',
      transform: `scale(${scale}, ${scale})`,
      transformOrigin: 'top left',
    }
    const boxClassname = this.props.boxClassname || 'pigeon-tiles-box'

    const left = -((tileCenterX - tileMinX) * 256 - scaleWidth / 2)
    const top = -((tileCenterY - tileMinY) * 256 - scaleHeight / 2)

    const tilesStyle: React.CSSProperties = {
      position: 'absolute',
      width: (tileMaxX - tileMinX + 1) * 256,
      height: (tileMaxY - tileMinY + 1) * 256,
      willChange: 'transform',
      transform: `translate(${left}px, ${top}px)`,
    }

    const Tile = this.props.tileComponent

    return (
      <div style={boxStyle} className={boxClassname}>
        <div className="pigeon-tiles" style={tilesStyle}>
          {tiles.map((tile) => (
            <Tile key={tile.key} tile={tile} tileLoaded={() => this.tileLoaded(tile.key)} />
          ))}
        </div>
      </div>
    )
  }

  renderOverlays(): JSX.Element {
    const { width, height, center } = this.state

    const mapState = {
      bounds: this.getBounds(),
      zoom: this.zoomPlusDelta(),
      center: center,
      width,
      height,
    }

    const childrenWithProps = React.Children.map(this.props.children, (child) => {
      if (!child) {
        return null
      }

      if (!React.isValidElement(child)) {
        return child
      }

      const { anchor, position, offset } = child.props

      const c = this.latLngToPixel(anchor || position || center)

      return React.cloneElement(child, {
        left: c[0] - (offset ? offset[0] : 0),
        top: c[1] - (offset ? offset[1] : 0),
        latLngToPixel: this.latLngToPixel,
        pixelToLatLng: this.pixelToLatLng,
        setCenterZoom: this.setCenterZoomForChildren,
        mapProps: this.props,
        mapState,
      })
    })

    const childrenStyle: React.CSSProperties = {
      position: 'absolute',
      width: width,
      height: height,
      top: `calc((100% - ${height}px) / 2)`,
      left: `calc((100% - ${width}px) / 2)`,
    }

    return (
      <div className="pigeon-overlays" style={childrenStyle}>
        {childrenWithProps}
      </div>
    )
  }

  renderAttribution(): JSX.Element | null {
    const { attribution, attributionPrefix } = this.props

    if (attribution === false) {
      return null
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      bottom: 0,
      right: 0,
      fontSize: '11px',
      padding: '2px 5px',
      background: 'rgba(255, 255, 255, 0.7)',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: '#333',
    }

    const linkStyle: React.CSSProperties = {
      color: '#0078A8',
      textDecoration: 'none',
    }

    return (
      <div key="attr" className="pigeon-attribution" style={style}>
        {attributionPrefix === false ? null : (
          <span>
            {attributionPrefix || (
              <a href="https://pigeon-maps.js.org/" style={linkStyle} target="_blank" rel="noreferrer noopener">
                Pigeon
              </a>
            )}
            {' | '}
          </span>
        )}
        {attribution || (
          <span>
            {' © '}
            <a
              href="https://www.openstreetmap.org/copyright"
              style={linkStyle}
              target="_blank"
              rel="noreferrer noopener"
            >
              OpenStreetMap
            </a>
            {' contributors'}
          </span>
        )}
      </div>
    )
  }

  renderWarning(): JSX.Element | null {
    const { metaWheelZoom, metaWheelZoomWarning, twoFingerDrag, twoFingerDragWarning, warningZIndex } = this.props
    const { showWarning, warningType, width, height } = this.state

    if ((metaWheelZoom && metaWheelZoomWarning) || (twoFingerDrag && twoFingerDragWarning)) {
      const style: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: showWarning ? 100 : 0,
        transition: 'opacity 300ms',
        background: 'rgba(0,0,0,0.5)',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 22,
        fontFamily: '"Arial", sans-serif',
        textAlign: 'center',
        zIndex: warningZIndex,
      }

      const meta =
        typeof window !== 'undefined' && window.navigator && window.navigator.platform.toUpperCase().indexOf('MAC') >= 0
          ? '⌘'
          : 'ctrl'

      const warningText = warningType === 'fingers' ? twoFingerDragWarning : metaWheelZoomWarning

      return (
        <div className="pigeon-overlay-warning" style={style}>
          {warningText.replace('META', meta)}
        </div>
      )
    } else {
      return null
    }
  }

  render(): JSX.Element {
    const { touchEvents, twoFingerDrag } = this.props
    const { width, height } = this.state

    const containerStyle: React.CSSProperties = {
      width: this.props.width ? width : '100%',
      height: this.props.height ? height : '100%',
      position: 'relative',
      display: 'inline-block',
      overflow: 'hidden',
      background: '#dddddd',
      touchAction: touchEvents ? (twoFingerDrag ? 'pan-x pan-y' : 'none') : 'auto',
    }

    const hasSize = !!(width && height)

    return (
      <div style={containerStyle} ref={this.setRef}>
        {hasSize && this.renderTiles()}
        {hasSize && this.renderOverlays()}
        {hasSize && this.renderAttribution()}
        {hasSize && this.renderWarning()}
      </div>
    )
  }
}
