# fully-react-map

Tired of waiting 5 seconds to include 200kb of gzipped Google Maps JavaScript code just to display a few tiles and a marker?

Welcome to the club!

This project aims to provide a performance-first React-centric map engine.

Currently implemented:

- Show tiles
- Arbitrary overlays (markers, etc)
- Move the map by dragging

Missing:

- Move the map on mobile
- Zoom in and out on mobile and with the mouse
- Map attributions

## Demo

See a demo here: https://mariusandra.github.io/fully-react-map/ (using maps from Wikimedia)

## Code

```js
import Map, { Overlay } from 'fully-react-map'

<Map center={[50.879, 4.6997]} zoom={12} width={600} height={400}>
  <Overlay position={[50.879, 4.6997]} offset={[15, 31]}>
    <img src='pin-green-large@2x.png' width={29} height={34} alt='' />
  </Overlay>
</Map>
```
