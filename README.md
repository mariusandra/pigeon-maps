# fully-react-maps

Tired of waiting 5 seconds to include 200kb of gzipped Google Maps JavaScript code just to display a few tiles and a marker?

Welcome to the club!

This project aims to provide a performance-first React-centric map engine.

Currently implemented:

- Show tiles
- Add arbitrary overlays (markers)

Missing:

- Move the map
- Zoom in and out
- Map attributions

## Demo

See a demo here: https://mariusandra.github.io/fully-react-maps/ (using maps from Wikimedia)

## Code

```js
import Map, { Overlay } from 'fully-react-maps'

<Map center={[50.879, 4.6997]} zoom={12} width={600} height={400}>
  <Overlay position={[50.879, 4.6997]} offset={[15, 31]}>
    <img src='pin-green-large@2x.png' width={29} height={34} alt='' />
  </Overlay>
</Map>
```
