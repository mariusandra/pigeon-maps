import { React, Inferno, Component } from '../src/infact'

import Map from 'pigeon-maps'
import Marker from 'pigeon-marker/infact'

// please change this if you take some code from here.
// otherwise the demo page will run out of credits and that would be very sad :(
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoicGlnZW9uLW1hcHMiLCJhIjoiY2l3eW01Y2E2MDA4dzJ6cWh5dG9pYWlwdiJ9.cvdCf-7PymM1Y3xp5j71NQ'

const mapbox = (mapboxId, accessToken) => (x, y, z) => {
  const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? '@2x' : ''
  return `https://api.mapbox.com/styles/v1/mapbox/${mapboxId}/tiles/256/${z}/${x}/${y}${retina}?access_token=${accessToken}`
}

const providers = {
  osm: (x, y, z) => {
    const s = String.fromCharCode(97 + (x + y + z) % 3)
    return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`
  },
  wikimedia: (x, y, z) => {
    const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? '@2x' : ''
    return `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}${retina}.png`
  },
  stamen: (x, y, z) => {
    const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? '@2x' : ''
    return `https://stamen-tiles.a.ssl.fastly.net/terrain/${z}/${x}/${y}${retina}.jpg`
  },
  streets: mapbox('streets-v10', MAPBOX_ACCESS_TOKEN),
  satellite: mapbox('satellite-streets-v10', MAPBOX_ACCESS_TOKEN),
  outdoors: mapbox('outdoors-v10', MAPBOX_ACCESS_TOKEN),
  light: mapbox('light-v9', MAPBOX_ACCESS_TOKEN),
  dark: mapbox('dark-v9', MAPBOX_ACCESS_TOKEN)
}

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      center: [50.879, 4.6997],
      zoom: 13,
      provider: 'outdoors',
      zoomOnMouseWheel: true,
      animating: false,
      zoomSnap: false
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
    const { center, zoom, provider, zoomOnMouseWheel, zoomSnap, animating } = this.state

    return (
      <div style={{textAlign: 'center', marginTop: 50}}>
        <Map
          center={center}
          zoom={zoom}
          provider={providers[provider]}
          onBoundsChanged={this.handleBoundsChange}
          onClick={this.handleClick}
          onAnimationStart={this.handleAnimationStart}
          onAnimationStop={this.handleAnimationStop}
          zoomOnMouseWheel={zoomOnMouseWheel}
          zoomSnap={zoomSnap}
          width={600}
          height={400}>
          <Marker anchor={[50.879, 4.6997]} payload={1} onClick={this.handleMarkerClick} />
          <Marker anchor={[50.874, 4.6947]} payload={2} onClick={this.handleMarkerClick} />
        </Map>
        <div>
          <button onClick={this.zoomIn}>Zoom In</button>
          <button onClick={this.zoomOut}>Zoom Out</button>
          {' '}
          {Math.round(center[0] * 10000) / 10000}
          {' x '}
          {Math.round(center[1] * 10000) / 10000}
          {' @ '}
          {Math.round(zoom * 100) / 100}
          {' - '}
          {animating ? 'animating' : 'stopped'}
        </div>
        <div style={{marginTop: 20}}>
          {Object.keys(providers).map(key => (
            <button key={key} onClick={() => this.setState({ provider: key })} style={{fontWeight: provider === key ? 'bold' : 'normal'}}>{key}</button>
          ))}
        </div>
        <div style={{marginTop: 20}}>
          <button onClick={() => this.setState({ zoomOnMouseWheel: !zoomOnMouseWheel })}>{zoomOnMouseWheel ? 'Disable wheel scroll' : 'Enable wheel scroll'}</button>
          <button onClick={() => this.setState({ zoomSnap: !zoomSnap })}>{zoomSnap ? 'Disable zoom snap' : 'Enable zoom snap'}</button>
        </div>
      </div>
    )
  }
}
