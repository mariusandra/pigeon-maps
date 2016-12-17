# fully-react-map

![https://github.com/mariusandra/fully-react-map/blob/master/demonstration.gif?raw=true](Demonstration)

## Demo

See a demo here: https://mariusandra.github.io/fully-react-map/ (using maps from Wikimedia)

## What is it?

Tired of waiting 5 seconds to include 200kb of gzipped Google Maps JavaScript code just to display a few tiles and a marker?

Welcome to the club!

This project aims to provide a performance-first React-centric customizable map engine.

We're currently at:
- 12KB minified
- 4KB gzipped

Implemented:

- Show tiles
- Arbitrary overlays (markers, etc)
- Move the map by dragging
- Zooming with the scroll wheel
- Smooth / fractional zooming
- Zoom without flickering (keep old tiles until new ones load)

Missing:

- Move the map on mobile
- Zoom in and out on mobile
- Map attributions
- Event handling (clicks, etc)
- Better wheel zoom handling
- Slide animation when dragging and letting go

## Code

```js
import Map, { Overlay } from 'fully-react-map'

<Map center={[50.879, 4.6997]} zoom={12} width={600} height={400}>
  <Overlay position={[50.879, 4.6997]} offset={[15, 31]}>
    <img src='pin-green-large@2x.png' width={29} height={34} alt='' />
  </Overlay>
</Map>
```
