import React from 'react'
import { PigeonProps } from '../types'

interface OverlayProps extends PigeonProps {
  style?: React.CSSProperties
  className?: string
  children?: React.ReactNode
}

export function Overlay(props: OverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${props.left}px, ${props.top}px)`,
        ...(props.style || {}),
      }}
      className={props.className ? `${props.className} pigeon-click-block` : 'pigeon-click-block'}
    >
      {props.children}
    </div>
  )
}
