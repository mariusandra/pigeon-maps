import React, { Component } from 'react'

function wikimedia (x, y, z) {
  const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2
  return `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}${retina ? '@2x' : ''}.png`
}

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
const long2tile = (lon, zoom) => (lon + 180) / 360 * Math.pow(2, zoom)
const lat2tile = (lat, zoom) => (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)

export default class Map extends Component {
  static propTypes = {
    center: React.PropTypes.array,
    zoom: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    provider: React.PropTypes.func,
    children: React.PropTypes.node
  }

  render () {
    const { center, zoom, width, height, provider } = this.props

    const mapUrl = provider || wikimedia

    const tileCenterX = long2tile(center[1], zoom)
    const tileCenterY = lat2tile(center[0], zoom)

    const halfWidth = width / 2 / 256.0
    const halfHeight = height / 2 / 256.0

    const tileMinX = Math.floor(tileCenterX - halfWidth)
    const tileMaxX = Math.floor(tileCenterX + halfWidth)

    const tileMinY = Math.floor(tileCenterY - halfHeight)
    const tileMaxY = Math.floor(tileCenterY + halfHeight)

    let tiles = []
    for (let x = tileMinX; x <= tileMaxX; x++) {
      for (let y = tileMinY; y <= tileMaxY; y++) {
        tiles.push({
          key: `${x}-${y}-${zoom}`,
          url: mapUrl(x, y, zoom),
          left: (x - tileMinX) * 256,
          top: (y - tileMinY) * 256
        })
      }
    }

    const left = -((tileCenterX - tileMinX) * 256 - width / 2)
    const top = -((tileCenterY - tileMinY) * 256 - height / 2)

    const childrenWithProps = React.Children.map(this.props.children,
      (child) => {
        const { position, offset } = child.props
        if (position) {
          const childLeft = (long2tile(position[1], zoom) - tileMinX) * 256
          const childTop = (lat2tile(position[0], zoom) - tileMinY) * 256
          return React.cloneElement(child, {
            left: childLeft - (offset ? offset[0] : 0),
            top: childTop - (offset ? offset[1] : 0)
          })
        }
      }
    )

    return (
      <div style={{ width, height, position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: (tileMaxX - tileMinX + 1) * 256, height: (tileMaxY - tileMinY + 1) * 256, left: left, top: top }}>
          {tiles.map(tile => (
            <img key={tile.key} src={tile.url} width={256} height={256} style={{ position: 'absolute', left: tile.left, top: tile.top }} />
          ))}
        </div>
        <div style={{ position: 'absolute', width: (tileMaxX - tileMinX + 1) * 256, height: (tileMaxY - tileMinY + 1) * 256, left: left, top: top }}>
          {childrenWithProps}
        </div>
      </div>
    )
  }
}
