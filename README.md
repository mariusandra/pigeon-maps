# Pigeon Maps - ReactJS maps without external dependencies

![Demonstration](https://github.com/mariusandra/pigeon-maps/blob/master/demonstration.gif?raw=true)

Demo: https://mariusandra.github.io/pigeon-maps/ (using maps from Wikimedia)

## What is it?

![Pigeon](https://github.com/mariusandra/pigeon-maps/blob/master/pigeon.jpg?raw=true)

Tired of waiting 5 seconds to include 200kb of gzipped Google Maps JavaScript code just to display a few tiles and a marker?

Welcome to the club!

This project aims to provide a performance-first React-centric extendable map engine.

We're currently at:
- ~20KB minified
- ~5KB gzipped

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
- Slide when dragging and letting go
- Event handling (clicks, etc)

Missing:

- Double click and double tap zooming

## Code

[See the demo for an example](https://github.com/mariusandra/pigeon-maps/tree/master/demo)

```js
import Map, { Overlay } from 'pigeon-maps'

const map = (
  <Map center={[50.879, 4.6997]} zoom={12} width={600} height={400}>
    <Overlay position={[50.879, 4.6997]} offset={[15, 31]}>
      <img src='pin@2x.png' width={29} height={34} alt='' />
    </Overlay>
  </Map>
)
```

## API

### Map

**center** - Coordinates of the map center in the format `[lat, lng]`

**zoom** - Current zoom level `12`

**width** - Width of the component in pixels. Must be set.

**height** - Height of the component in pixels. Must be set.

**provider** - Function that returns a [TMS URL](https://wiki.openstreetmap.org/wiki/TMS): `(x, y, z) => url`.

**animate** - Animations enabled, `true`.

**attribution** - What to show as an [attribution](https://www.openstreetmap.org/copyright). React node or `false` to hide.

**attributionPrefix** - Prefix before attribution. React node or `false` to hide.

**onClick** - When map is clicked `function ({ event, latLng, pixel })``

**onBoundsChanged** - When the bounds change, `function ({ center, zoom, bounds })`. Use this for a controlled component, then set `center` and `zoom` when it's called.

### Overlays

`<Map />` takes random React components as its children. The children may have these special props:

**position** - Coordinates of the element in the format `[lat, lng]`. These will be converted to pixels and passed as `left` and `top` to the child.

**offset** - Amount of pixels to subtract from the `left` and `top` props.

The children get passed these special props:

**left** - Pixels from the left of the map, calculated from `position` and `offset`

**top** - Pixels from the top of the map, calculated from `position` and `offset`

**latLngToPixel** - A helper `function (latLng, center, zoom)` that returns the position in pixels `[x, y]` for any `[lat, lng]`. The last 2 arguments are optional.

**pixelToLatLng** - A helper `function (pixel, center, zoom)` that converts any pixel coordinates `[x, y]` to `[lat, lng]`. The last 2 arguments are optional.

Use these two functions to create beautiful widgets. See the [example marker](https://github.com/mariusandra/pigeon-maps/blob/master/demo/marker/index.js) component.

Add the class `pigeon-drag-block` to disable dragging on the overlay. Add the class `pigeon-click-block` to disable map background clicks on the element.

Alternatively use the `<Overlay />` component. It accepts `position`, `offset` and `classNames` as its props and positions itself accordingly.

---

Pigeon image by [Robert Claypool](https://www.flickr.com/photos/35106989@N08/7934833110/in/photolist-d6b6rq-9Mukwr-7ZmKb4-fGmwjr-j88Kou-8rMH5s-fhVDED-bMKvR8-o1g6uD-6ymdPD-fXtb7c-pfRt2D-dAChga-cJnQWu-f8EZou-9kcduE-oGhwp5-fGD6YW-dSLETS-anJCUh-98SLJQ-7bkuhT-4uSjrb-bfg6HB-qs9sHM-4gYYBL-q4GXdw-a4gKa9-iWxwyC-4HwW6X-auscdw-9mxYrg-9s659U-X7Nvz-dqcKc2-nE1XAU-qbXkKQ-4RpEww-cwxt6A-5HMS77-mGNr2K-aGjzm4-6AUdCU-9qyyvt-ceov6E-5APWsT-9mB1Hw-emfCwt-bFSixV-4dn3Cs)
