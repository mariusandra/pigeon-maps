import React from 'react'
import { PigeonProps } from '../types'

interface ZoomProps extends PigeonProps {
  style?: React.CSSProperties
  buttonStyle?: React.CSSProperties
}

const commonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
}

const commonButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 2,
  boxShadow: '0 1px 4px -1px rgba(0,0,0,.3)',
  background: 'white',
  lineHeight: '26px',
  fontSize: '20px',
  fontWeight: 700,
  color: '#666',
  marginBottom: 1,
  cursor: 'pointer',
  border: 'none',
  display: 'block',
  outline: 'none',
}

export function ZoomControl({ style, buttonStyle, setCenterZoom, mapState, mapProps }: ZoomProps): JSX.Element {
  return (
    <div className="pigeon-zoom-buttons pigeon-drag-block" style={style ? { ...commonStyle, ...style } : commonStyle}>
      <button
        className="pigeon-zoom-in"
        style={buttonStyle ? { ...commonButtonStyle, ...buttonStyle } : commonButtonStyle}
        onClick={() => setCenterZoom(mapState.center, Math.min(mapState.zoom + 1, mapProps.maxZoom))}
      >
        +
      </button>
      <button
        className="pigeon-zoom-out"
        style={buttonStyle ? { ...commonButtonStyle, ...buttonStyle } : commonButtonStyle}
        onClick={() => setCenterZoom(mapState.center, Math.max(mapState.zoom - 1, mapProps.minZoom))}
      >
        –
      </button>
    </div>
  )
}
