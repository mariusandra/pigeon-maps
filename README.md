# Pigeon Maps - ReactJS maps without external dependencies

[![npm version](https://img.shields.io/npm/v/pigeon-maps.svg)](https://www.npmjs.com/package/pigeon-maps)
[![minified](https://badgen.net/bundlephobia/min/pigeon-maps)](https://bundlephobia.com/result?p=pigeon-maps)
[![minified + gzipped](https://badgen.net/bundlephobia/minzip/pigeon-maps)](https://bundlephobia.com/result?p=pigeon-maps)

![Demonstration](https://pigeon-maps.js.org/assets/video.gif?raw=true)

Demo: https://pigeon-maps.js.org/ (using maps from OSM and Stamen)

## What is it?

![Pigeon](https://pigeon-maps.js.org/assets/pigeon.jpg?raw=true)

Are you tired of waiting 3 seconds to parse 200kb of Google Maps JavaScript just to display a few tiles and a marker? 140kb of minified Leaflet too much?

Welcome to the club!

This project aims to provide a performance-first React-centric extendable map engine.

It was originally created to reduce page load speed for the search results on [Apprentus](https://www.apprentus.com/), a marketplace for private lessons.

We're currently at:
- [![minified](https://badgen.net/bundlephobia/min/pigeon-maps)](https://bundlephobia.com/result?p=pigeon-maps)
- [![minified + gzipped](https://badgen.net/bundlephobia/minzip/pigeon-maps)](https://bundlephobia.com/result?p=pigeon-maps)

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
- Double click and double tap zooming
- Option to block dragging with one finger and mouse wheel scrolling without holding meta key
- Enable/disable touch and mouse events as needed - you could make a 100% static server rendered react map
- Support for 100% width/height containers

Missing:
- Double tap and then swipe touch zooming

## Install


```
# using yarn
yarn add pigeon-maps

# using npm
npm install --save pigeon-maps
```

## Code

[Demo](https://pigeon-maps.js.org/)

```js
import { Map, Marker, Overlay } from 'pigeon-maps'

const map = (
  <Map defaultCenter={[50.879, 4.6997]} defaultZoom={12} width={600} height={400}>
    <Marker anchor={[50.874, 4.6947]} payload={1} onClick={({ event, anchor, payload }) => {}} />

    <Overlay anchor={[50.879, 4.6997]} offset={[120, 79]}>
      <img src='pigeon.jpg' width={240} height={158} alt='' />
    </Overlay>
  </Map>
)
```

## Choose a tile provider

**Note:** If you're getting **429 errors**, it's time to upgrade pigeon maps and choose a new tile layer provider. Versions before `0.15.0` use a default tile provider that no longer works.

Pigeon Maps defaults to loading map tiles from [OpenStreetMap.org](https://www.openstreetmap.org/). While free (thanks to volunteers and donations), these OSM tiles aren't the best looking visually.
 
Usually you want to specify a custom map tile provider. There are [many](https://wiki.openstreetmap.org/wiki/Commercial_OSM_Software_and_Services) commercial tile servers to choose from
and you can even [set up your own](https://openmaptiles.org/).

One nice option is [MapTiler](https://www.maptiler.com/cloud/). Their maps look good and their free plan provides up to 100k tile loads per month.
You will need to sign up for an account and pass your API key and map id to the following provider

```jsx
const MAPTILER_ACCESS_TOKEN = ''
const MAP_ID = ''

function mapTilerProvider (x, y, z, dpr) {
  return `https://api.maptiler.com/maps/${MAP_ID}/256/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png?key=${MAPTILER_ACCESS_TOKEN}`
}

render(
  <Map
    provider={mapTilerProvider} 
    dprs={[1, 2]} // add this to support hidpi/retina (2x) maps if your provider supports them 
    ...
  />
)
```

Adapt this example for other providers you might want to use.


## Plugins

[pigeon-draggable](https://mariusandra.github.io/pigeon-draggable/) ([demo](https://mariusandra.github.io/pigeon-draggable/)) - a draggable overlay

Note: The `Overlay` and `Marker` components were previously packaged as separate plugins
[pigeon-overlay](https://github.com/mariusandra/pigeon-overlay) & [pigeon-marker](https://github.com/mariusandra/pigeon-marker). You should use the built in components instead!


## API

### `<Map />`

```js
import { Map } from 'pigeon-maps'

export function MyMap() {
  const [center, setCenter] = useState([50.879, 4.6997])
  const [zoom, setZoom] = useState(11)
  return (
    <Map 
      width={600} 
      height={400}
      center={center} 
      zoom={zoom} 
      onBoundsChanged={({ center, zoom }) => { setCenter(center); setZoom(zoom) }}>
      ...
    </Map>
  )
}
```

**provider** - Function that returns a [TMS URL](https://wiki.openstreetmap.org/wiki/TMS): `(x, y, z, dpr) => url`. The argument `dpr` will be a value from the `dprs` array (see below) or `undefined` when requesting the default tile.

**center** - Coordinates of the map center in the format `[lat, lng]`. Use if the component is controlled, e.g. you'll be listening to `onBoundsChanged` and passing a new `center` when the bounds change.

**defaultCenter** - Initial coordinates of the map center in the format `[lat, lng]`. Use if the component is uncontrolled.

**zoom** - Current zoom level, e.g. `12`, use for controlled components and update when `onBoundsChanged` give you a new value.

**defaultZoom** - The initial zoom for uncontrolled components.

**width** - Width of the component in pixels. Defaults to `100%` of the parent div if not set.

**height** - Height of the component in pixels. Defaults to `100%` of the parent div if not set.

**defaultWidth** - If you don't specify a `width`, we wait until the component is mounted and measure the container before rendering tiles, markers and other objects. Setting `defaultWidth` assumes a width and renders everything before mounting. If the actual width of the component differs, it will just be re-rendered. Use this for example to render tiles on server rendering, when `width` is not set.

**defaultHeight** - Similar as `defaultWidth`, but for the `height`.

**dprs** - An array of `devicePixelRatio`s that your tile provider supports. Defaults to `[]`. Pass an array like `[1, 2]` and the numbers here will be sent to `provider` as the 4th argument. The responses will be combined into an `<img srcset>` attribute, which modern browsers use to select tiles with [the right resolution](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#Resolution_switching_Same_size_different_resolutions).

**animate** - Animations enabled, `true`.

**animateMaxScreens** - If an updated `center` prop is more than `animateMaxScreens` screens away, we will directly switch to it, otherwise smoothly animate to it. Defaults to `5`

**zoomSnap** - Snap to discrete zoom increments (14, 15, 16, etc) when scrolling with the mouse or pinching with touch events, Defaults to `true`.

**minZoom** - The lowest zoom level possible. Defaults to `1`

**maxZoom** - The highest zoom level possible. Defaults to `18`

**attribution** - What to show as an [attribution](https://www.openstreetmap.org/copyright). React node or `false` to hide.

**attributionPrefix** - Prefix before attribution. React node or `false` to hide.

**onClick** - When map is clicked `function ({ event, latLng, pixel })``

**onBoundsChanged** - When the bounds change, `function ({ center, zoom, bounds, initial })`. Use this for a controlled component, then set `center` and `zoom` when it's called. This callback also gets called on the initial mount (when the first bounds become known). In this case the prop `initial` will be set to `true`. It will be `false` on all subsequent calls.

**onAnimationStart** - Called when the map starts moving

**onAnimationStop** - Called when the map stops moving

**mouseEvents** - Can the user interact with the map with the mouse? Defaults to `true`.

**touchEvents** - Can the user interact with the map by touching it? Defaults to `true`.

**metaWheelZoom** - Zooming with the mouse wheel only works when you hold down the `cmd` or `ctrl` keys. Defaults to `false`.

**metaWheelZoomWarning** - Warning text to show if scrolling on a map with `metaWheelZoom` enabled, but without the meta key. Defaults to `Use META+wheel to zoom!`, where `META` is automatically replaced with either "⌘" or "⊞", depending on Mac vs non-Mac. Set to `null` to disable.

**twoFingerDrag** - Moving the map requires touching with two fingers. Defaults to `false`.

**twoFingerDragWarning** - Warning to show when `twoFingerDrag` and you try to move the map with one finger. Defaults to `Use two fingers to move the map`. Set to `null` to disable.

**warningZIndex** - The `z-index` value for the meta warning. Defaults to `100`

**boxClassname** - The classname for the tiles div, allowing you to style it with a filter css property without impacting the overlays.

### `<Overlay />`

Anchor random react components to the map

```js
import { Map, Overlay } from 'pigeon-maps'

export function MyMap() {
  return (
    <Map defaultCenter={[50.879, 4.6997]} defaultZoom={12} width={600} height={400}>  
      <Overlay anchor={[50.879, 4.6997]} offset={[120, 79]}>
        <img src='pigeon.jpg' width={240} height={158} alt='' />
      </Overlay>
    </Map>
  )
}
```

**anchor** - At which coordinates `[lat, lng]` to anchor the overlay with the map.

**offset** - Offset in pixels relative to the anchor.

### `<Marker />`

Position a marker.

```js
import { Map, Marker } from 'pigeon-maps'

export function MyMap() {
  return (
    <Map 
      width={600} 
      height={400}
      defaultCenter={[50.879, 4.6997]} 
      defaultZoom={12} 
    > 
      <Marker 
        anchor={[50.874, 4.6947]}
        color='black'
        payload={1} 
        onClick={({ event, anchor, payload }) => {
          console.log('Clicked marker nr: ', payload)
        }}
      />
    </Map>
  )
}
```

**anchor** - At which coordinates `[lat, lng]` to anchor the marker with the map.

**width** and **height** - Size of the marker. Any of the two can be omitted.

**payload** - Random payload that will be returned on events.

**hover** - Should we show the "hover" state of the marker? Default: `undefined`

Events

**onClick** - `({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void`

**onContextMenu** - `({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void`

**onMouseOver** `({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void`

**onMouseOut** `({ event: HTMLMouseEvent, anchor: Point, payload: any }) => void`


### `<ZoomControl />`

Add `+` and `-` zoom buttons.

```js
import { Map, ZoomControl } from 'pigeon-maps'

export function MyMap() {
  return (
    <Map 
      width={600} 
      height={400}
      defaultCenter={[50.879, 4.6997]} 
      defaultZoom={12} 
    >
      {/* <Marker />, ... */}
      <ZoomControl />
    </Map>
  )
}
```
**style** - Add extra style attributes to the container div. For example: `{ right: 10, top: 10, zIndex: 100 }` to change its position.

**buttonStyle** - Override the style of the buttons themselves. For example: `{ background: 'black', color: 'white' }` to invert its colors.


### Custom Elements

`<Map />` takes random React components as its children. The children may have these special props:

**anchor** - At which coordinates `[lat, lng]` to anchor the overlay with the map.

**offset** - Offset in pixels relative to the anchor.

The children get passed these additional props:

**left** - Pixels from the left of the map, calculated from `anchor` and `offset`

**top** - Pixels from the top of the map, calculated from `anchor` and `offset`

**mapState** - An object `{ center, zoom, bounds, width, height }` that gets updated at every animation frame.

**mapProps** - The props passed to the `Map` itself. Used for example to get `maxZoom` in `<ZoomControl />`. 

**latLngToPixel** - A helper `function (latLng: Point, center?: Point, zoom?: number)` that returns the position in pixels `[x, y]` for any `[lat, lng]`. The last 2 arguments are optional.

**pixelToLatLng** - A helper `function (pixel: Point, center?: Point, zoom?: number)` that converts any pixel coordinates `[x, y]` to `[lat, lng]`. The last 2 arguments are optional.

**setCenterZoom** - A helper `function (center: Point | null, zoom?: number)` to control the map's position.


Use these two functions to create beautiful widgets.

Add the class `pigeon-drag-block` to disable dragging on the overlay. Add the class `pigeon-click-block` to disable map background clicks on the element.

## Yeah, but why pigeon??

Pigeons are experts in [magnetoreception](https://en.wikipedia.org/wiki/magnetoreception). Good pigeons can find their way home from anywhere.

Magnets were essential in making the first maps. With a good map you can find your way home from anywhere.

Thus, `pigeon`.

Source: https://en.wikipedia.org/wiki/Homing_pigeon

---

Pigeon image by [Robert Claypool](https://www.flickr.com/photos/35106989@N08/7934833110/in/photolist-d6b6rq-9Mukwr-7ZmKb4-fGmwjr-j88Kou-8rMH5s-fhVDED-bMKvR8-o1g6uD-6ymdPD-fXtb7c-pfRt2D-dAChga-cJnQWu-f8EZou-9kcduE-oGhwp5-fGD6YW-dSLETS-anJCUh-98SLJQ-7bkuhT-4uSjrb-bfg6HB-qs9sHM-4gYYBL-q4GXdw-a4gKa9-iWxwyC-4HwW6X-auscdw-9mxYrg-9s659U-X7Nvz-dqcKc2-nE1XAU-qbXkKQ-4RpEww-cwxt6A-5HMS77-mGNr2K-aGjzm4-6AUdCU-9qyyvt-ceov6E-5APWsT-9mB1Hw-emfCwt-bFSixV-4dn3Cs)
