import React, { SVGAttributes, useMemo, useEffect, useState } from 'react'
import { PigeonProps } from '../types'

interface GeoJsonProps extends PigeonProps {
  className?: string
  data?: any
  svgAttributes?: any
  styleCallback?: any
  hover?: any
  style?: CSSProperties

  // callbacks
  onClick?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onContextMenu?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onMouseOver?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onMouseOut?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
}

interface GeoJsonLoaderProps extends GeoJsonProps {
  link?: string
}

interface GeoJsonGeometry {
  type: string
  coordinates?: Array<[number, number]> | Array<Array<[number, number]>> | Array<Array<Array<[number, number]>>>
  geometries?: Array<GeoJsonGeometry>
}

interface GeometryProps {
  latLngToPixel?: (latLng: Point, center?: Point, zoom?: number) => Point
  svgAttributes?: SVGAttributes
  geometry?: GeoJsonGeometry
}

const defaultSvgAttributes = { fill: '#93c0d099', strokeWidth: '2', stroke: 'white', r: '30' }

export function Point(props: GeometryProps): JSX.Element {
  const { latLngToPixel } = props
  const [y, x] = props.coordinates
  const [cx, cy] = latLngToPixel([x, y])
  return <circle cx={cx} cy={cy} {...props.svgAttributes} />
}

export function MultiPoint(props: GeometryProps): JSX.Element {
  return props.coordinates.map((point, i) => <Point {...props} coordinates={point} key={i} />)
}

export function LineString(props: GeometryProps): JSX.Element {
  const { latLngToPixel } = props
  const p =
    'M' +
    props.coordinates.reduce((a, [y, x]) => {
      const [v, w] = latLngToPixel([x, y])
      return a + ' ' + v + ' ' + w
    }, '')

  return <path d={p} {...props.svgAttributes} />
}

export function MultiLineString(props: GeometryProps): JSX.Element {
  return props.coordinates.map((line, i) => <LineString coordinates={line} key={i} />)
}

export function Polygon(props: GeometryProps): JSX.Element {
  const { latLngToPixel } = props
  // GeoJson polygons is a collection of linear rings
  const p = props.coordinates.reduce(
    (a, part) =>
      a +
      ' M' +
      part.reduce((a, [y, x]) => {
        const [v, w] = latLngToPixel([x, y])
        return a + ' ' + v + ' ' + w
      }, '') +
      'Z',
    ''
  )
  return <path d={p} {...props.svgAttributes} />
}

export function MultiPolygon(props: GeometryProps): JSX.Element {
  return props.coordinates.map((polygon, i) => <Polygon {...props} coordinates={polygon} key={i} />)
}

export function GeometryCollection(props: GeometryProps): JSX.Element {
  const renderer = {
    Point,
    MultiPoint,
    LineString,
    MultiLineString,
    Polygon,
    MultiPolygon,
  }

  const { type, coordinates, geometries } = props.geometry

  if (type === 'GeometryCollection') {
    return geometries.map((geometry) => <GeometryCollection {...props} geometry={geometry} />)
  }

  const Component = renderer[type]

  if (Component === undefined) {
    console.warn(`The GeoJson Type ${type} is not known`)
    return null
  }
  return (
    <Component
      latLngToPixel={props.latLngToPixel}
      geometry={props.geometry}
      coordinates={coordinates}
      svgAttributes={props.svgAttributes}
    />
  )
}

export function GeoJsonFeature(props: GeoJsonProps): JSX.Element {
  const [internalHover, setInternalHover] = useState(props.hover || false)
  const hover = props.hover !== undefined ? props.hover : internalHover
  const callbackSvgAttributes = props.styleCallback && props.styleCallback(props.feature, hover)
  const svgAttributes = callbackSvgAttributes
    ? props.svgAttributes
      ? { ...props.svgAttributes, ...callbackSvgAttributes }
      : callbackSvgAttributes
    : props.svgAttributes
    ? props.svgAttributes
    : defaultSvgAttributes

  const eventParameters = (event: React.MouseEvent<SVGElement>) => ({
    event,
    anchor: props.anchor,
    payload: props.feature,
  })

  return (
    <g
      clipRule="evenodd"
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
      <GeometryCollection {...props} svgAttributes={svgAttributes} />
    </g>
  )
}

export function GeoJson(props: GeoJsonProps): JSX.Element {
  const { width, height } = props.mapState

  return (
    <div
      style={{
        position: 'absolute',
        left: '0',
        top: '0',
        pointerEvents: 'none',
        cursor: 'pointer',
        ...(props.style || {}),
      }}
      className={props.className ? `${props.className} pigeon-click-block` : 'pigeon-click-block'}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {props.data.features.map((feature, i) => (
          <GeoJsonFeature key={i} {...props} feature={feature} {...feature} />
        ))}
      </svg>
    </div>
  )
}

export function GeoJsonLoader(props: GeoJsonLoaderProps): JSX.Element {
  const [data, setData] = useState(props.data ? props.data : null)

  useEffect(() => {
    fetch(props.link)
      .then((response) => response.json())
      .then((data) => setData(data))
  }, [props.path])

  return data ? <GeoJson data={data} {...props} /> : null
}
