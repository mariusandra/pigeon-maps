import React, { Component } from 'react'

import Map from 'pigeon-maps'
import Marker from 'pigeon-marker'

import pigeonSvg from './incubator/pigeon.svg'
import DraggableOverlay from './incubator/draggable-overlay'

const providers = {
  osm: (x, y, z) => {
    const s = String.fromCharCode(97 + (x + y + z) % 3)
    return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`
  },
  stamenTerrain: (x, y, z, dpr) => {
    return `https://stamen-tiles.a.ssl.fastly.net/terrain/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.jpg`
  },
  stamenToner: (x, y, z, dpr) => {
    return `https://stamen-tiles.a.ssl.fastly.net/toner/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`
  }
}

const markers = {
  leuven1: [[50.879, 4.6997], 13],
  leuven2: [[50.874, 4.6947], 13],
  brussels: [[50.85050, 4.35149], 11],
  ghent: [[51.0514, 3.7103], 12],
  coast: [[51.2214, 2.9541], 10]
}

const lng2tile = (lon, zoom) => (lon + 180) / 360 * Math.pow(2, zoom)
const lat2tile = (lat, zoom) => (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)

const Banner = () => (
  <a href="https://github.com/mariusandra/pigeon-maps">
    <img style={{ position: 'absolute', top: 0, right: 0, border: 0 }} src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub" />
  </a>
)

const StamenAttribution = () => (
  <span className='map-attribution'>
    Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.
  </span>
)

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      center: [50.1102, 3.1506],
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
      dragAnchor: [48.8565, 2.3475]
    }
  }

  zoomIn = () => {
    this.setState({
      zoom: Math.min(this.state.zoom + 1, 18)
    })
  }

  zoomOut = () => {
    this.setState({
      zoom: Math.max(this.state.zoom - 1, 1)
    })
  }

  handleBoundsChange = ({ center, zoom, bounds, initial }) => {
    if (initial) {
      console.log('Got initial bounds: ', bounds)
    }
    this.setState({ center, zoom })
  }

  handleClick = ({ event, latLng, pixel }) => {
    console.log('Map clicked!', latLng, pixel)
  }

  handleMarkerClick = ({ event, payload, anchor }) => {
    console.log(`Marker #${payload} clicked at: `, anchor)
  }

  handleAnimationStart = () => {
    this.setState({ animating: true })
  }

  handleAnimationStop = () => {
    this.setState({ animating: false })
  }

  render () {
    const { center, zoom, provider, animate, metaWheelZoom, twoFingerDrag, zoomSnap, mouseEvents, touchEvents, animating, minZoom, maxZoom } = this.state

    return (
      <div style={{textAlign: 'center', marginTop: 50}}>
        <Banner />
        <div style={{maxWidth: 600, margin: '0 auto'}}>
          <Map
            limitBounds='edge'
            center={center}
            zoom={zoom}
            provider={providers[provider]}
            dprs={[1, 2]}
            onBoundsChanged={this.handleBoundsChange}
            onClick={this.handleClick}
            onAnimationStart={this.handleAnimationStart}
            onAnimationStop={this.handleAnimationStop}
            animate={animate}
            metaWheelZoom={metaWheelZoom}
            twoFingerDrag={twoFingerDrag}
            zoomSnap={zoomSnap}
            mouseEvents={mouseEvents}
            touchEvents={touchEvents}
            minZoom={minZoom}
            maxZoom={maxZoom}
            attribution={
              provider === 'stamenTerrain' || provider === 'stamenToner'
                ? <StamenAttribution />
                : provider === 'wikimedia'
                  ? <WikimediaAttribution />
                  : null}
            defaultWidth={600}
            height={400}
            boxClassname="pigeon-filters">
            {Object.keys(markers).map(key => (
              <Marker key={key} anchor={markers[key][0]} payload={key} onClick={this.handleMarkerClick} />
            ))}
            <DraggableOverlay
              anchor={this.state.dragAnchor}
              offset={[60, 87]}
              onDragMove={(anchor) => console.log('moving pigeon', anchor)}
              onDragEnd={(anchor) => { console.log('moved pigeon', anchor); this.setState({ dragAnchor: anchor }) }}
              style={{ clipPath: 'polygon(100% 0, 83% 0, 79% 15%, 0 68%, 0 78%, 39% 84%, 43% 96%, 61% 100%, 79% 90%, 69% 84%, 88% 71%, 100% 15%)' }}>
              <img
                src={pigeonSvg}
                width={100}
                height={95} />
            </DraggableOverlay>
          </Map>
        </div>
        <div>
          <button onClick={this.zoomIn}>Zoom In</button>
          <button onClick={this.zoomOut}>Zoom Out</button>
          {' '}
          {Math.round(center[0] * 10000) / 10000} ({lat2tile(center[0], zoom)})
          {' x '}
          {Math.round(center[1] * 10000) / 10000} ({lng2tile(center[1], zoom)})
          {' @ '}
          {Math.round(zoom * 100) / 100}
          {' - '}
          {animating ? 'animating' : 'stopped'}
        </div>
        <div style={{marginTop: 20}}>
          {Object.keys(providers).map(key => (
            <button
              key={key}
              onClick={() => this.setState({ provider: key })}
              style={{fontWeight: provider === key ? 'bold' : 'normal'}}>
              {key}
            </button>
          ))}
        </div>
        <div style={{marginTop: 20}}>
          <button onClick={() => this.setState({ animate: !animate })}>{animate ? '[X] animation' : '[ ] animation'}</button>
          <button onClick={() => this.setState({ twoFingerDrag: !twoFingerDrag })}>{twoFingerDrag ? '[X] two finger drag' : '[ ] two finger drag'}</button>
          <button onClick={() => this.setState({ metaWheelZoom: !metaWheelZoom })}>{metaWheelZoom ? '[X] meta wheel zoom' : '[ ] meta wheel zoom'}</button>
          <button onClick={() => this.setState({ zoomSnap: !zoomSnap })}>{zoomSnap ? '[X] zoom snap' : '[ ] zoom snap'}</button>
          <button onClick={() => this.setState({ mouseEvents: !mouseEvents })}>{mouseEvents ? '[X] mouse events' : '[ ] mouse events'}</button>
          <button onClick={() => this.setState({ touchEvents: !touchEvents })}>{touchEvents ? '[X] touch events' : '[ ] touch events'}</button>
        </div>
        <div style={{marginTop: 20}}>
          minZoom: <input onChange={(e) => this.setState({ minZoom: parseInt(e.target.value) || 1 })} value={minZoom} type='number' style={{ width: 40 }} />
          {' '}
          maxZoom: <input onChange={(e) => this.setState({ maxZoom: parseInt(e.target.value) || 18 })} value={maxZoom} type='number' style={{ width: 40 }} />
        </div>
        <div style={{marginTop: 20}}>
          {Object.keys(markers).map(key => (
            <button key={key} onClick={() => this.setState({ center: markers[key][0], zoom: markers[key][1] })}>{key}</button>
          ))}
        </div>
        <div style={{marginTop: 20}}>
          <a href='https://github.com/mariusandra/pigeon-maps'>Documentation and more on GitHub</a>
        </div>
      </div>
    )
  }
}
