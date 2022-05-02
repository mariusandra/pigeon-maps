import React, { useEffect, useState } from 'react'
import { PigeonProps } from '../types'
import { commonStyle, commonButtonStyle } from './ZoomControl'

interface FullscreenProps extends PigeonProps {
  style?: React.CSSProperties
  buttonStyle?: React.CSSProperties
  isFullscreen?: boolean
  onClick?: (HTMLMouseEvent) => void
  onChange?: ({ isFullscreen: boolean }) => void
  container?: HTMLElement
  expandSymbol?: any
  collapseSymbol?: any
}

const CollapseIcon = () => (
  <svg version="1.1" x="10px" y="0px" viewBox="0 0 385.331 385.331" style={{ marginTop: '5px' }}>
    <g>
      <g id="Fullscreen_Exit">
        <path
          d="M264.943,156.665h108.273c6.833,0,11.934-5.39,11.934-12.211c0-6.833-5.101-11.85-11.934-11.838h-96.242V36.181
			c0-6.833-5.197-12.03-12.03-12.03s-12.03,5.197-12.03,12.03v108.273c0,0.036,0.012,0.06,0.012,0.084
			c0,0.036-0.012,0.06-0.012,0.096C252.913,151.347,258.23,156.677,264.943,156.665z"
        />
        <path
          d="M120.291,24.247c-6.821,0-11.838,5.113-11.838,11.934v96.242H12.03c-6.833,0-12.03,5.197-12.03,12.03
			c0,6.833,5.197,12.03,12.03,12.03h108.273c0.036,0,0.06-0.012,0.084-0.012c0.036,0,0.06,0.012,0.096,0.012
			c6.713,0,12.03-5.317,12.03-12.03V36.181C132.514,29.36,127.124,24.259,120.291,24.247z"
        />
        <path
          d="M120.387,228.666H12.115c-6.833,0.012-11.934,5.39-11.934,12.223c0,6.833,5.101,11.85,11.934,11.838h96.242v96.423
			c0,6.833,5.197,12.03,12.03,12.03c6.833,0,12.03-5.197,12.03-12.03V240.877c0-0.036-0.012-0.06-0.012-0.084
			c0-0.036,0.012-0.06,0.012-0.096C132.418,233.983,127.1,228.666,120.387,228.666z"
        />
        <path
          d="M373.3,228.666H265.028c-0.036,0-0.06,0.012-0.084,0.012c-0.036,0-0.06-0.012-0.096-0.012
			c-6.713,0-12.03,5.317-12.03,12.03v108.273c0,6.833,5.39,11.922,12.223,11.934c6.821,0.012,11.838-5.101,11.838-11.922v-96.242
			H373.3c6.833,0,12.03-5.197,12.03-12.03S380.134,228.678,373.3,228.666z"
        />
      </g>
    </g>
  </svg>
)

const ExpandIcon = () => (
  <svg version="1.1" x="0px" y="0px" viewBox="0 0 384.97 384.97" style={{ marginTop: '3px' }}>
    <g>
      <g id="Fullscreen">
        <path
          d="M384.97,12.03c0-6.713-5.317-12.03-12.03-12.03H264.847c-6.833,0-11.922,5.39-11.934,12.223
			c0,6.821,5.101,11.838,11.934,11.838h96.062l-0.193,96.519c0,6.833,5.197,12.03,12.03,12.03c6.833-0.012,12.03-5.197,12.03-12.03
			l0.193-108.369c0-0.036-0.012-0.06-0.012-0.084C384.958,12.09,384.97,12.066,384.97,12.03z"
        />
        <path
          d="M120.496,0H12.403c-0.036,0-0.06,0.012-0.096,0.012C12.283,0.012,12.247,0,12.223,0C5.51,0,0.192,5.317,0.192,12.03
			L0,120.399c0,6.833,5.39,11.934,12.223,11.934c6.821,0,11.838-5.101,11.838-11.934l0.192-96.339h96.242
			c6.833,0,12.03-5.197,12.03-12.03C132.514,5.197,127.317,0,120.496,0z"
        />
        <path
          d="M120.123,360.909H24.061v-96.242c0-6.833-5.197-12.03-12.03-12.03S0,257.833,0,264.667v108.092
			c0,0.036,0.012,0.06,0.012,0.084c0,0.036-0.012,0.06-0.012,0.096c0,6.713,5.317,12.03,12.03,12.03h108.092
			c6.833,0,11.922-5.39,11.934-12.223C132.057,365.926,126.956,360.909,120.123,360.909z"
        />
        <path
          d="M372.747,252.913c-6.833,0-11.85,5.101-11.838,11.934v96.062h-96.242c-6.833,0-12.03,5.197-12.03,12.03
			s5.197,12.03,12.03,12.03h108.092c0.036,0,0.06-0.012,0.084-0.012c0.036-0.012,0.06,0.012,0.096,0.012
			c6.713,0,12.03-5.317,12.03-12.03V264.847C384.97,258.014,379.58,252.913,372.747,252.913z"
        />
      </g>
    </g>
  </svg>
)

export function FullscreenControl(props: FullscreenProps): JSX.Element {
  const {
    collapseSymbol,
    expandSymbol,
    setCenterZoom,
    mapState,
    style,
    buttonStyle,
    onChange,
    container,
    mapContainer,
  } = props
  const [internalIsFullscreen, setInternalIsFullscreen] = useState(props.isFullscreen === undefined ? false : undefined)
  const isFullscreen = props.isFullscreen === undefined ? internalIsFullscreen : props.isFullscreen
  const _isFullscreen = container
    ? container === document.fullscreenElement
    : mapContainer === document.fullscreenElement

  useEffect(() => {
    if (props.isFullscreen !== undefined && internalIsFullscreen !== undefined) {
      console.warn('The FullscreenControl is changing from uncontrolled to controlled this should not happen.')
    }
  }, [props.isFullscreen, internalIsFullscreen])

  useEffect(() => {
    const fn = (event) => {
      const _isFullscreen = container
        ? container === document.fullscreenElement
        : mapContainer === document.fullscreenElement

      if (!_isFullscreen && mapContainer && event.target === mapContainer) {
        // Cancelling the fullscreen might not force a rerender
        // so do this manually
        setCenterZoom(mapState.center, mapState.zoom)
      }

      if ((mapContainer && event.target === mapContainer) || (container && event.target === container)) {
        // If escape is used to exit fullscreen mode also change fullscreen State
        if (!_isFullscreen && isFullscreen) {
          if (onChange) {
            onChange({ isFullscreen: false })
          } else {
            setInternalIsFullscreen(false)
          }
        }
      }
    }

    addEventListener('fullscreenchange', fn)
    return () => {
      removeEventListener('fullscreenchange', fn)
    }
  }, [container, mapContainer, isFullscreen])

  useEffect(() => {
    if (_isFullscreen !== isFullscreen) {
      if (!isFullscreen) {
        document.exitFullscreen()
      } else {
        const fullscreenContainer = container || mapContainer
        fullscreenContainer
          .requestFullscreen()
          .catch((err) => (onChange ? onChange({ isFullscreen: false }) : setInternalIsFullscreen(false)))
      }
    }
  }, [isFullscreen])

  return (
    <div
      className="pigeon-fullscreen-buttons pigeon-drag-block"
      style={style ? { ...commonStyle, ...style } : commonStyle}
    >
      <button
        className="pigeon-fullscreen-button"
        style={buttonStyle ? { ...commonButtonStyle, ...buttonStyle } : commonButtonStyle}
        onClick={(ev) =>
          onChange ? onChange({ isFullscreen: !isFullscreen }) : setInternalIsFullscreen(!isFullscreen)
        }
      >
        {isFullscreen ? collapseSymbol || <CollapseIcon /> : expandSymbol || <ExpandIcon />}
      </button>
    </div>
  )
}
