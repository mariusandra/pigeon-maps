import React, { useEffect, useRef, useState } from 'react'
import { PigeonProps, Point } from '../types'

function isDescendentOf(element, ancestor) {
  while (element) {
    if (element === ancestor) {
      return true
    }
    element = element.parentElement
  }

  return false
}

interface DraggableProps extends PigeonProps {
  className?: string
  style?: React.CSSProperties

  children?: React.ReactNode

  onDragStart?: (anchor: Point) => void
  onDragMove?: (anchor: Point) => void
  onDragEnd?: (anchor: Point) => void
}

interface DraggableState {
  isDragging: boolean
  startX?: number
  startY?: number
  startLeft?: number
  startTop?: number
  deltaX: number
  deltaY: number
}

const defaultState: DraggableState = {
  isDragging: false,
  startX: undefined,
  startY: undefined,
  startLeft: undefined,
  startTop: undefined,
  deltaX: 0,
  deltaY: 0,
}

export function Draggable(props: DraggableProps): JSX.Element {
  const dragRef = useRef<HTMLDivElement>()
  const propsRef = useRef<DraggableProps>(props)
  const stateRef = useRef({ ...defaultState })
  const [_state, _setState] = useState(defaultState)

  propsRef.current = props

  const setState = (stateUpdate: Partial<DraggableState>): void => {
    const newState = { ...stateRef.current, ...stateUpdate }
    stateRef.current = newState
    _setState(newState)
  }

  const { mouseEvents, touchEvents } = props.mapProps

  useEffect(() => {
    const handleDragStart = (event: MouseEvent | TouchEvent) => {
      if (isDescendentOf(event.target, dragRef.current)) {
        event.preventDefault()

        setState({
          isDragging: true,
          startX: ('touches' in event ? event.touches[0] : event).clientX,
          startY: ('touches' in event ? event.touches[0] : event).clientY,
          startLeft: propsRef.current.left,
          startTop: propsRef.current.top,
          deltaX: 0,
          deltaY: 0,
        })

        if (propsRef.current.onDragStart) {
          const { left, top, offset, pixelToLatLng } = propsRef.current
          propsRef.current.onDragMove(pixelToLatLng([left + (offset ? offset[0] : 0), top + (offset ? offset[1] : 0)]))
        }
      }
    }

    const handleDragMove = (event: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging) {
        return
      }

      event.preventDefault()

      const x = ('touches' in event ? event.touches[0] : event).clientX
      const y = ('touches' in event ? event.touches[0] : event).clientY

      const deltaX = x - stateRef.current.startX
      const deltaY = y - stateRef.current.startY

      setState({ deltaX, deltaY })

      if (propsRef.current.onDragMove) {
        const { offset, pixelToLatLng } = propsRef.current
        const { startLeft, startTop } = stateRef.current

        propsRef.current.onDragMove(
          pixelToLatLng([startLeft + deltaX + (offset ? offset[0] : 0), startTop + deltaY + (offset ? offset[1] : 0)])
        )
      }
    }

    const handleDragEnd = (event: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging) {
        return
      }

      event.preventDefault()

      const { offset, pixelToLatLng } = propsRef.current
      const { deltaX, deltaY, startLeft, startTop } = stateRef.current

      propsRef.current.onDragEnd?.(
        pixelToLatLng([startLeft + deltaX + (offset ? offset[0] : 0), startTop + deltaY + (offset ? offset[1] : 0)])
      )

      setState({
        isDragging: false,
        startX: undefined,
        startY: undefined,
        startLeft: undefined,
        startTop: undefined,
        deltaX: 0,
        deltaY: 0,
      })
    }

    const wa = (e: string, t: EventListener, o?: AddEventListenerOptions) => window.addEventListener(e, t, o)
    const wr = (e: string, t: EventListener) => window.removeEventListener(e, t)

    if (mouseEvents) {
      wa('mousedown', handleDragStart)
      wa('mousemove', handleDragMove)
      wa('mouseup', handleDragEnd)
    }

    if (touchEvents) {
      wa('touchstart', handleDragStart, { passive: false })
      wa('touchmove', handleDragMove, { passive: false })
      wa('touchend', handleDragEnd, { passive: false })
    }

    return () => {
      if (mouseEvents) {
        wr('mousedown', handleDragStart)
        wr('mousemove', handleDragMove)
        wr('mouseup', handleDragEnd)
      }

      if (touchEvents) {
        wr('touchstart', handleDragStart)
        wr('touchmove', handleDragMove)
        wr('touchend', handleDragEnd)
      }
    }
  }, [mouseEvents, touchEvents])

  const { left, top, className, style } = props
  const { deltaX, deltaY, startLeft, startTop, isDragging } = _state

  return (
    <div
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        ...(style || {}),
        position: 'absolute',
        transform: `translate(${isDragging ? startLeft + deltaX : left}px, ${isDragging ? startTop + deltaY : top}px)`,
      }}
      ref={dragRef}
      className={`pigeon-drag-block${className ? ` ${className}` : ''}`}
    >
      {props.children}
    </div>
  )
}
