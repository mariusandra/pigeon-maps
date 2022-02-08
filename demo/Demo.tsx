import React, { useState } from 'react'

import { PigeonIcon } from './PigeonIcon'
import { Point, Map, Marker, GeoJsonLoader, GeoJson, Draggable, ZoomControl } from '../src'
import * as providers from '../src/providers'

const markers = {
  leuven1: [[50.879, 4.6997], 13],
  leuven2: [[50.874, 4.6947], 13],
  brussels: [[50.8505, 4.35149], 11],
  ghent: [[51.0514, 3.7103], 12],
  coast: [[51.2214, 2.9541], 10],
}

const geoJsonSample = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2.0, 48.5] }, properties: { prop0: 'value0' } },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [2.0, 48.0],
          [3.0, 49.0],
          [4.0, 48.0],
          [5.0, 49.0],
        ],
      },
      properties: {
        prop0: 'value0',
        prop1: 0.0,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0.0, 48.0],
            [1.0, 48.0],
            [1.0, 49.0],
            [0.0, 49.0],
            [0.0, 48.0],
          ],
        ],
      },
      properties: {
        prop0: 'value0',
        prop1: { this: 'that' },
      },
    },
    {
      type: 'Feature',
      properties: { name: 'yea' },
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Point', coordinates: [2.0, 46.5] },
          {
            type: 'LineString',
            coordinates: [
              [2.0, 46.0],
              [3.0, 47.0],
              [4.0, 46.0],
              [5.0, 47.0],
            ],
          },
          {
            type: 'Polygon',
            coordinates: [
              [
                [0.0, 46.0],
                [1.0, 46.0],
                [1.0, 47.0],
                [0.0, 47.0],
                [0.0, 46.0],
              ],
            ],
          },
        ],
      },
    },
  ],
}

const lng2tile = (lon, zoom) => ((lon + 180) / 360) * Math.pow(2, zoom)
const lat2tile = (lat, zoom) =>
  ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
  Math.pow(2, zoom)

const Banner = () => (
  <a href="https://github.com/mariusandra/pigeon-maps">
    <img
      style={{ position: 'absolute', top: 0, right: 0, border: 0 }}
      src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png"
      alt="Fork me on GitHub"
    />
  </a>
)

const StamenAttribution = () => (
  <span className="map-attribution">
    Map tiles by{' '}
    <a href="http://stamen.com" target="_blank" rel="noreferrer noopener">
      Stamen Design
    </a>
    , under{' '}
    <a href="http://creativecommons.org/licenses/by/3.0" target="_blank" rel="noreferrer noopener">
      CC BY 3.0
    </a>
    . Data by{' '}
    <a href="http://openstreetmap.org" target="_blank" rel="noreferrer noopener">
      OpenStreetMap
    </a>
    , under{' '}
    <a href="http://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener">
      ODbL
    </a>
    .
  </span>
)

export function Demo(): JSX.Element {
  const [state, setRawState] = useState({
    center: [50.1102, 3.1506] as Point,
    zoom: 6,
    provider: 'osm',
    metaWheelZoom: false,
    twoFingerDrag: false,
    animate: true,
    animating: false,
    zoomSnap: true,
    mouseEvents: true,
    touchEvents: true,
    minZoom: 1,
    maxZoom: 18,
    dragAnchor: [48.8565, 2.3475] as Point,
  })
  const setState = (stateChanges) => setRawState({ ...state, ...stateChanges })

  const {
    center,
    zoom,
    provider,
    animate,
    metaWheelZoom,
    twoFingerDrag,
    zoomSnap,
    mouseEvents,
    touchEvents,
    animating,
    minZoom,
    maxZoom,
  } = state

  const zoomIn = () => {
    setState({
      zoom: Math.min(state.zoom + 1, 18),
    })
  }

  const zoomOut = () => {
    setState({
      zoom: Math.max(state.zoom - 1, 1),
    })
  }

  const handleBoundsChange = ({ center, zoom, bounds, initial }) => {
    if (initial) {
      console.log('Got initial bounds: ', bounds)
    }
    setState({ center, zoom })
  }

  const handleClick = ({ event, latLng, pixel }) => {
    console.log('Map clicked!', latLng, pixel)
  }

  const handleMarkerClick = ({ event, payload, anchor }) => {
    console.log(`Marker #${payload} clicked at: `, anchor)
  }

  const handleAnimationStart = () => {
    setState({ animating: true })
  }

  const handleAnimationStop = () => {
    setState({ animating: false })
  }

  let providerFunction = providers[provider]
  if (provider === 'maptiler') {
    providerFunction = providerFunction('wrAA6s63uzhKow7wUsFT', 'streets')
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <Banner />
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Map
          limitBounds="edge"
          center={center}
          zoom={zoom}
          provider={providerFunction}
          dprs={[1, 2]}
          onBoundsChanged={handleBoundsChange}
          onClick={handleClick}
          onAnimationStart={handleAnimationStart}
          onAnimationStop={handleAnimationStop}
          animate={animate}
          metaWheelZoom={metaWheelZoom}
          twoFingerDrag={twoFingerDrag}
          zoomSnap={zoomSnap}
          mouseEvents={mouseEvents}
          touchEvents={touchEvents}
          minZoom={minZoom}
          maxZoom={maxZoom}
          attribution={provider === 'stamenTerrain' || provider === 'stamenToner' ? <StamenAttribution /> : null}
          defaultWidth={600}
          height={400}
        >
          {Object.keys(markers).map((key, index) => (
            <Marker
              key={key}
              anchor={markers[key][0]}
              payload={key}
              onClick={handleMarkerClick}
              width={29 + 10 * index}
            />
          ))}
          <Draggable
            anchor={state.dragAnchor}
            onDragEnd={(dragAnchor) => setState({ dragAnchor })}
            offset={[60, 87]}
            style={{
              clipPath:
                'polygon(100% 0, 83% 0, 79% 15%, 0 68%, 0 78%, 39% 84%, 43% 96%, 61% 100%, 79% 90%, 69% 84%, 88% 71%, 100% 15%)',
            }}
          >
            <PigeonIcon width={100} height={95} />
          </Draggable>
          <GeoJsonLoader
            link="https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/4_niedrig.geo.json"
            styleCallback={(feature, hover) =>
              hover
                ? { fill: '#93c0d099', strokeWidth: '2', stroke: 'white' }
                : { fill: '#d4e6ec99', strokeWidth: '1', stroke: 'white', r: '20' }
            }
          />
          <GeoJson
            data={geoJsonSample}
            styleCallback={(feature, hover) => {
              if (feature.geometry.type === 'LineString') {
                return { strokeWidth: '1', stroke: 'black' }
              }
              return { fill: '#d4e6ec99', strokeWidth: '1', stroke: 'white', r: '20' }
            }}
          />
          <ZoomControl />
        </Map>
      </div>
      <div>
        <button onClick={zoomIn}>Zoom In</button>
        <button onClick={zoomOut}>Zoom Out</button> {Math.round(center[0] * 10000) / 10000} ({lat2tile(center[0], zoom)}
        ){' x '}
        {Math.round(center[1] * 10000) / 10000} ({lng2tile(center[1], zoom)}){' @ '}
        {Math.round(zoom * 100) / 100}
        {' - '}
        {animating ? 'animating' : 'stopped'}
      </div>
      <div style={{ marginTop: 20 }}>
        {Object.keys(providers).map((key) => (
          <button
            key={key}
            onClick={() => setState({ provider: key })}
            style={{ fontWeight: provider === key ? 'bold' : 'normal' }}
          >
            {key}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={() => setState({ animate: !animate })}>{animate ? '[X] animation' : '[ ] animation'}</button>
        <button onClick={() => setState({ twoFingerDrag: !twoFingerDrag })}>
          {twoFingerDrag ? '[X] two finger drag' : '[ ] two finger drag'}
        </button>
        <button onClick={() => setState({ metaWheelZoom: !metaWheelZoom })}>
          {metaWheelZoom ? '[X] meta wheel zoom' : '[ ] meta wheel zoom'}
        </button>
        <button onClick={() => setState({ zoomSnap: !zoomSnap })}>
          {zoomSnap ? '[X] zoom snap' : '[ ] zoom snap'}
        </button>
        <button onClick={() => setState({ mouseEvents: !mouseEvents })}>
          {mouseEvents ? '[X] mouse events' : '[ ] mouse events'}
        </button>
        <button onClick={() => setState({ touchEvents: !touchEvents })}>
          {touchEvents ? '[X] touch events' : '[ ] touch events'}
        </button>
      </div>
      <div style={{ marginTop: 20 }}>
        minZoom:{' '}
        <input
          onChange={(e) => setState({ minZoom: parseInt(e.target.value) || 1 })}
          value={minZoom}
          type="number"
          style={{ width: 40 }}
        />{' '}
        maxZoom:{' '}
        <input
          onChange={(e) => setState({ maxZoom: parseInt(e.target.value) || 18 })}
          value={maxZoom}
          type="number"
          style={{ width: 40 }}
        />
      </div>
      <div style={{ marginTop: 20 }}>
        {Object.keys(markers).map((key) => (
          <button key={key} onClick={() => setState({ center: markers[key][0], zoom: markers[key][1] })}>
            {key}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <a href="https://github.com/mariusandra/pigeon-maps">Documentation and more on GitHub</a>
      </div>
    </div>
  )
}
