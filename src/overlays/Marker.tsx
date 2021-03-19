import React, { useState } from 'react'
import { PigeonProps } from '../types'

interface MarkerProps extends PigeonProps {
  color?: string
  payload?: any

  width?: number
  height?: number

  // optional modifiers
  hover?: boolean
  style?: React.CSSProperties
  className?: string

  // callbacks
  onClick?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onContextMenu?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onMouseOver?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onMouseOut?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
}

export function Marker(props: MarkerProps): JSX.Element {
  const width =
    typeof props.width !== 'undefined'
      ? props.width
      : typeof props.height !== 'undefined'
      ? (props.height * 29) / 34
      : 29
  const height =
    typeof props.height !== 'undefined'
      ? props.height
      : typeof props.width !== 'undefined'
      ? (props.width * 34) / 29
      : 34
  const [internalHover, setInternalHover] = useState(props.hover || false)
  const hover = typeof props.hover === 'undefined' ? internalHover : props.hover
  const color = props.color || '#93C0D0'

  // what do you expect to get back with the event
  const eventParameters = (event: React.MouseEvent<SVGElement>) => ({
    event,
    anchor: props.anchor,
    payload: props.payload,
  })

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${props.left - width / 2}px, ${props.top - (height - 1)}px)`,
        filter: hover ? 'drop-shadow(0 0 4px rgba(0, 0, 0, .3))' : '',
        pointerEvents: 'none',
        cursor: 'pointer',
        ...(props.style || {}),
      }}
      className={props.className ? `${props.className} pigeon-click-block` : 'pigeon-click-block'}
    >
      <svg width={width} height={height} viewBox="0 0 61 71" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g
          style={{ pointerEvents: 'auto' }}
          onClick={props.onClick ? (event) => props.onClick(eventParameters(event)) : null}
          onContextMenu={props.onContextMenu ? (event) => props.onContextMenu(eventParameters(event)) : null}
          onMouseOver={(event) => {
            props.onMouseOver && props.onMouseOver(eventParameters(event))
            setInternalHover(true)
          }}
          onMouseOut={(event) => {
            props.onMouseOut && props.onMouseOut(eventParameters(event))
            setInternalHover(false)
          }}
        >
          <path
            d="M52 31.5C52 36.8395 49.18 42.314 45.0107 47.6094C40.8672 52.872 35.619 57.678 31.1763 61.6922C30.7916 62.0398 30.2084 62.0398 29.8237 61.6922C25.381 57.678 20.1328 52.872 15.9893 47.6094C11.82 42.314 9 36.8395 9 31.5C9 18.5709 18.6801 9 30.5 9C42.3199 9 52 18.5709 52 31.5Z"
            fill={color}
            stroke="white"
            strokeWidth="4"
          />
          <circle cx="30.5" cy="30.5" r="8.5" fill="white" opacity={hover ? 0.98 : 0.6} />
        </g>
      </svg>
    </div>
  )
}
