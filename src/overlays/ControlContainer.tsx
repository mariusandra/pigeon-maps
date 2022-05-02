import React from 'react'
import { PigeonProps } from '../types'

interface ControlContainerProps extends PigeonProps {
  className?: string
  children?: React.ReactNode
}

export function ControlContainer(props: ControlContainerProps) {
  const { left, top, latLngToPixel, pixelToLatLng, setCenterZoom, mapContainer, mapProps, mapState } = props
  const childProps = {
    left,
    top,
    latLngToPixel,
    pixelToLatLng,
    setCenterZoom,
    mapContainer,
    mapProps,
    mapState,
    style: { position: 'relative' },
  }

  return (
    <div
      style={{
        position: 'absolute',
        ...(props.style || {}),
      }}
      className={props.className ? `${props.className} pigeon-click-block` : 'pigeon-click-block'}
    >
      {React.Children.map(props.children, (child) => React.cloneElement(child, childProps))}
    </div>
  )
}
