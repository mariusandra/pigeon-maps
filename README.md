# Pigeon Maps - ReactJS maps without external dependencies

![Demonstration](https://github.com/mariusandra/pigeon-maps/blob/master/demonstration.gif?raw=true)

Demo: https://mariusandra.github.io/pigeon-maps/ (using maps from Wikimedia)

## What is it?

![Pigeon](https://github.com/mariusandra/pigeon-maps/blob/master/pigeon.jpg?raw=true)

Tired of waiting 5 seconds to include 200kb of gzipped Google Maps JavaScript code just to display a few tiles and a marker?

Welcome to the club!

This project aims to provide a performance-first React-centric customizable map engine.

We're currently at:
- [17KB minified](https://raw.githubusercontent.com/mariusandra/pigeon-maps/master/static/demo.bundle.js)
- 5KB gzipped

Implemented:

- Show tiles
- Arbitrary overlays (markers, etc)
- Move the map by dragging
- Move the map by touch on mobile
- Zooming with the scroll wheel
- Zooming by touch
- Fractional zooming (e.g. to level 12.2)
- Zoom without flickering (keep old tiles until new ones load)
- Smooth animated zooming
- Slide animation when dragging and letting go with the mouse

Missing:

- Slide animation when dragging and letting go on mobile
- Map attributions
- Event handling (clicks, etc)

## Code

```js
import Map, { Overlay } from 'pigeon-maps'

<Map center={[50.879, 4.6997]} zoom={12} width={600} height={400}>
  <Overlay position={[50.879, 4.6997]} offset={[15, 31]}>
    <img src='pin-green-large@2x.png' width={29} height={34} alt='' />
  </Overlay>
</Map>
```

---

Pigeon image by [Robert Claypool](https://www.flickr.com/photos/35106989@N08/7934833110/in/photolist-d6b6rq-9Mukwr-7ZmKb4-fGmwjr-j88Kou-8rMH5s-fhVDED-bMKvR8-o1g6uD-6ymdPD-fXtb7c-pfRt2D-dAChga-cJnQWu-f8EZou-9kcduE-oGhwp5-fGD6YW-dSLETS-anJCUh-98SLJQ-7bkuhT-4uSjrb-bfg6HB-qs9sHM-4gYYBL-q4GXdw-a4gKa9-iWxwyC-4HwW6X-auscdw-9mxYrg-9s659U-X7Nvz-dqcKc2-nE1XAU-qbXkKQ-4RpEww-cwxt6A-5HMS77-mGNr2K-aGjzm4-6AUdCU-9qyyvt-ceov6E-5APWsT-9mB1Hw-emfCwt-bFSixV-4dn3Cs)
