import React, { useMemo, useEffect, useState } from 'react'
import { PigeonProps } from '../types'

interface GeoJsonProps extends PigeonProps {
  path: string,
  style?: React.CSSProperties
  className?: string,
  data?: any,
  geometry?: any,
  type?: any,
  properties?: any,
  polygon?: any,
  feature?: any,
  pathAttributes?: any,
  styleCallback?: any,

  // callbacks
  onClick?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onContextMenu?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onMouseOver?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
  onMouseOut?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void
}

export function GeoJsonLoader(props: GeoJsonProps): JSX.Element {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(props.path)
    .then((response) => response.json())
    .then((data) => setData(data))
  }, [props.path]);

  return data ? <GeoJson data={data} {...props}/> : null;
};

export function Polygon(props: GeoJsonProps): JSX.Element {
  const {latLngToPixel} = props;
  const p = props.polygon.reduce(
    (a, part) => (a + " M" + part.reduce((a, [y, x]) => {
            const [v, w] = latLngToPixel([x,y]);
            return a + " " + v + " " + w; 
        }, "") + "Z"
  ), "");
  return <path d={p} {...props.svgAttributes}/>
}

export function GeoJsonFeature(props: GeoJsonProps): JSX.Element {
  const [internalHover, setInternalHover] = useState(props.hover || false)
  const hover = props.hover || internalHover;
  const callbackSvgAttributes = props.styleCallback && props.styleCallback(props.feature, hover);

  // what do you expect to get back with the event
  const eventParameters = (event: React.MouseEvent<SVGElement>) => ({
    event,
    anchor: props.anchor,
    payload: props.payload,
    feature: props.feature,
  })

  let children = null;
  if(props.geometry.type === "Polygon"){
    children = <Polygon
        {...props}
        polygon={props.geometry.coordinates}
        hover={props.hover || internalHover}
        svgAttributes={callbackSvgAttributes ? {...props.svgAttributes, ...callbackSvgAttributes} : props.svgAttributes}
    />
  }
  else if(props.geometry.type === "MultiPolygon"){
    children = props.geometry.coordinates.map(
        (polygon, i) => <Polygon
            key={i}
            {...props}
            polygon={polygon}
            hover={props.hover || internalHover}
            svgAttributes={callbackSvgAttributes ? {...props.svgAttributes, ...callbackSvgAttributes} : props.svgAttributes}
            />
    );
  }

    return <g
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
        {children}
    </g>
};

export function GeoJson(props: GeoJsonProps): JSX.Element {
  const {width, height} = props.mapState;

  return (
    <div
      style={{
        pointerEvents: 'none',
        cursor: 'pointer',
        ...(props.style || {}),
      }}
      className={props.className ? `${props.className} pigeon-click-block` : 'pigeon-click-block'}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {props.data.features.map((feature, i) => (
            <GeoJsonFeature key={i} {...props} feature={feature} {...feature} />
        ))}
      </svg>
    </div>
  )
}
