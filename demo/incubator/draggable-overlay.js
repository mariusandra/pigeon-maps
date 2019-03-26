import React, { Component } from 'react'

function isDescendentOf (element, ancestor) {
  while (element) {
    if (element === ancestor) {
      return true
    }
    element = element.offsetParent
  }

  return false
}

export default class DraggableOverlay extends Component {
  // static propTypes = {
  //   // input
  //   anchor: PropTypes.array.isRequired,
  //   offset: PropTypes.array,

  //   // passed to div
  //   className: PropTypes.string,

  //   // pigeon variables
  //   left: PropTypes.number,
  //   top: PropTypes.number,

  //   // map state
  //   mapState: PropTypes.shape({
  //     center: PropTypes.array,
  //     zoom: PropTypes.number,
  //     bounds: PropTypes.array,
  //     width: PropTypes.number,
  //     height: PropTypes.number
  //   }),

  //   // pigeon functions
  //   latLngToPixel: PropTypes.func,
  //   pixelToLatLng: PropTypes.func,
  // }

  constructor (props) {
    super(props)
    this.state = {
      isDragging: false,
      deltaX: 0,
      deltaY: 0
    }
  }

  componentDidMount () {
    this.bindMouseEvents()
    this.bindTouchEvents()
  }

  componentWillUnmount () {
    this.unBindMouseEvents()
    this.unBindTouchEvents()
  }

  wa = (e, t, o) => window.addEventListener(e, t, o)
  wr = (e, t) => window.removeEventListener(e, t)

  bindMouseEvents = () => {
    this.wa('mousedown', this.handleDragStart)
    this.wa('mousemove', this.handleDragMove)
    this.wa('mouseup', this.handleDragEnd)
  }

  bindTouchEvents = () => {
    this.wa('touchstart', this.handleDragStart, { passive: false })
    this.wa('touchmove', this.handleDragMove, { passive: false })
    this.wa('touchend', this.handleDragEnd, { passive: false })
  }

  unbindMouseEvents = () => {
    this.wr('mousedown', this.handleDragStart)
    this.wr('mousemove', this.handleDragMove)
    this.wr('mouseup', this.handleDragEnd)
  }

  unbindTouchEvents = () => {
    this.wr('touchstart', this.handleDragStart)
    this.wr('touchmove', this.handleDragMove)
    this.wr('touchend', this.handleDragEnd)
  }

  handleDragStart = (event) => {
    if (isDescendentOf(event.target, this._dragRef)) {
      event.preventDefault()

      this.setState({
        isDragging: true,
        startX: (event.touches ? event.touches[0] : event).clientX,
        startY: (event.touches ? event.touches[0] : event).clientY,
        deltaX: 0,
        deltaY: 0
      })

      if (this.props.onDraStart) {
        this.props.onDragStart()
      }
    }
  }

  handleDragMove = (event) => {
    if (!this.state.isDragging) {
      return
    }

    event.preventDefault()

    const x = (event.touches ? event.touches[0] : event).clientX
    const y = (event.touches ? event.touches[0] : event).clientY

    this.setState({
      deltaX: x - this.state.startX,
      deltaY: y - this.state.startY
    })

    if (this.props.onDragMove) {
      const { left, top, offset, pixelToLatLng } = this.props

      this.props.onDragMove(pixelToLatLng([
        left + x - this.state.startX + (offset ? offset[0] : 0),
        top + y - this.state.startY + (offset ? offset[1] : 0)
      ]))
    }
  }

  handleDragEnd = (event) => {
    if (!this.state.isDragging) {
      return
    }

    event.preventDefault()

    const { left, top, offset, pixelToLatLng } = this.props
    const { deltaX, deltaY } = this.state

    this.props.onDragEnd && this.props.onDragEnd(pixelToLatLng([
      left + deltaX + (offset ? offset[0] : 0),
      top + deltaY + (offset ? offset[1] : 0)
    ]))

    this.setState({
      isDragging: false,
      deltaX: 0,
      deltaY: 0
    })
  }

  setRef = (ref) => {
    this._dragRef = ref
  }

  render () {
    const { left, top, className, style } = this.props
    const { deltaX, deltaY } = this.state

    return (
      <div
        style={{
          ...(style || {}),
          position: 'absolute',
          transform: `translate(${left + deltaX}px, ${top + deltaY}px)`
        }}
        ref={this.setRef}
        className={`pigeon-drag-block${className ? ` ${className}` : ''}`}>
        {this.props.children}
      </div>
    )
  }
}
