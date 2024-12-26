# Change Log
All notable changes to this project will be documented in this file.

As we're at the 0.x phase, deprecations and breaking changes will still happen. They will be documented here.

Once we reach 1.0 all deprecations will be removed and the project will switch to SemVer.

## 0.22.1 - 2024-12-26
- Fix for multiple children

## 0.22.0 - 2024-12-24
- React 19 support

## 0.21.6 - 2024-06-13
- Allow image option for GeoJSON PointComponent

## 0.21.5 - 2024-04-19
- Fix GeoJSON MultiLineString prop passing

## 0.21.4 - 2024-03-01
- Use new [OSM URLs](https://github.com/openstreetmap/operations/issues/737)
- Add Stadia URL to providers list

## 0.21.3 - 2022-10-01
- Add `dir="ltr"` to map container div.

## 0.21.2 - 2022-09-18
- Support custom content as children of `<Marker><Icon /></Marker>`

## 0.21.1 - 2022-09-18
- Fix the usage of `<ZoomControl />` buttons inside `<form>` tags.

## 0.21.0 - 2022-03-13
- Add `GeoJson`, `GeoJsonLoader`, `GeoJsonFeature` by @baldulin #149

## 0.20.0 - 2022-01-29
- Add `tileComponent` prop, which lets you swap out the default `<img />` component for a custom one.

## 0.19.7 - 2021-07-04
- Improve `<Draggable />` for cases when controlling its location via `onDragMove`.

## 0.19.6 - 2021-05-29
- Minor change: the default value for `dpr` in `provider` functions now defaults to `1` (instead of `undefined`)

## 0.19.5 - 2021-03-20
- Draggable: Set the cursor to `grab` and`grabbing` by default

## 0.19.4 - 2021-03-20
- Center align the tiles and overlays when the pre-rendered map is not the same size as on the final rendered page. 

## 0.19.3 - 2021-03-20
- Add `maptiler` to providers 

## 0.19.0 - 2021-03-19
- Add `<Draggable />` overlay

## 0.18.1 - 2021-03-19
- Support `import { osm, ... } from 'pigeon-maps/providers'`

## 0.18.0 - 2021-03-17
- Remove default export of `Map`. You must now do `import { Map } from 'pigeon-maps'`. 
- Add `<ZoomControl />`
- Add `mapProps` and `setCenterZoom` to the props given to child components
- Set the default provider to OSM again (from stamenToner)

## 0.17.3 - 2021-03-16
- With `metaWheelZoom` you can now also scroll with the CTRL key (#120 by olehmaksym)

## 0.17.2 - 2021-03-16
- Use a `ResizeObserver` to update the size even when the window doesn't resize (#125 by @mischnic)
- Add classes `pigeon-tile-box`, `pigeon-tiles`, `pigeon-overlays` and `pigeon-overlay-warning` to internal divs.

## 0.17.1 - 2021-02-13
- Fixes faulty types for `Marker` and `Overlay`

## 0.17.0 - 2020-12-03
- Add `Marker` and `Overlay` components to the pigeon-maps "standard library"
- Fix a bug with mousewheel scroll when width & height present (#117 by @roux1max)

## 0.16.1 - 2020-08-28
- Add empty ALT attribute to map tiles

## 0.16.0 - 2020-08-10
- Rewritten in TypeScript without changing any functionality
- Attribution links now open in a new tab

## 0.15.0 - 2020-03-03
- Changed the default tile provider from the broken Wikimedia to OSM
- Add more information about setting up your own tile provider
- Add lazy loading for tiles (#87 by @maxsteenbergen)

## 0.14.0 - 2019-08-31
- React 16.8 support by removing deprecated componentWillReceiveProps and replacing it with componentDidUpdate. #70 @JoaquimEsteves

## 0.13.0 - 2019-05-09
- Add the `dprs` parameter to `<Map />` and `dpr` as the 4th argument for the `provider` functions.

Previously if you wanted to support HiDPI screens your `provider` function looked something like this:

```js
function wikimedia (x, y, z) {
  const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2
  return `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}${retina ? '@2x' : ''}.png`
}
```

This works fine and will continue to work in `0.13`. However this had some issues with server rendering. The code on your server would always render the non-retina image and later React would hydrate it with the real retina image. This lead to a bit of flickering and to the loading of an excessive amount of map tiles.

Now you can pass `<Map dprs={[1, 2]} />` and update your provider function to:

```js
function wikimedia (x, y, z, dpr) {
  return `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`
}
```

... and pigeon-maps will call the provider twice to create a `<img srcset>` for both resolutions.

The value of `dpr` will be `undefined` for the default tile (`<img src>`) which acts as a backup for older browsers.

If you don't need server rendering, then the old approach of having no `dprs` array and figuring out the `dpr` from the `window` inside `provider` will continue to work fine.

## 0.12.1 - 2019-03-26
- Fix 100% height issue. #48 and #4

## 0.12.0 - 2019-03-26
- Removed inferno support, which reportedly didn't even work (#39).
- Started using rollup and babel loose mode to reduce the size even more. #59 @markusenglund (a [~8% reduction!](https://bundlephobia.com/result?p=pigeon-maps@0.12.0))

## 0.11.11 - 2018-11-16
- Fix wheel/touchpad scrolling on Chrome 73+, which requires non-passive event handlers for wheel events. [See also this](https://github.com/facebook/react/issues/14856).

## 0.11.8 - 2018-11-16
- Another edge case bug with animation and changing the center before the animation had time to finish.

## 0.11.7 - 2018-11-16
- Bug when animating between screens and forced to jump to a far away screen, it would freeze instead of jumping.

## 0.11.6 - 2018-11-05
- The `pigeon-drag-block` class also works with touch events

## 0.11.5 - 2018-10-18
- Fixes "0 0 0 0" appearing if the map has no size. #46 @PofMagicfingers

## 0.11.4 - 2018-10-18
- Added an undocumented feature `limitBounds`. If defaults to `center`, but if set to `edge`, we will try show as much map as possible. See issue #45 for details.

## 0.11.3 - 2018-10-17
- Added a polyfill for `window.requestAnimationFrame`
- Updated attribution URL to https://pigeon-maps.js.org/

## 0.11.2 - 2018-10-10
- Added `boxClassname` props allowing you to apply css for the tiles div only #43 @sgerin
- Fix bug zoom position when browser loses focus #41 @benrampon

## 0.11.1 - 2018-09-29
- Explicitly set touch event listeners to use non-passive mode. Fixes iOS 11.3 dragging issue. #40 @Jercik

## 0.11.0 - 2018-09-19
- Added `minZoom` and `maxZoom` to limit the zoom range
- Several small bugfixes

## 0.10.0 - 2018-09-10
### New updates
- `width` and `height` can now be omitted to force the component to 100% of the parent container
- `defaultWidth` and `defaultHeight` are added to specify a placeholder width/height for the initial render and server rendering
- `mouseEvents` and `touchEvents` can be used to enable/disable mouse and touch events completely
- `animateMaxScreens` specifies how far must a change to `center` be before we stop smoothly animating to it
- `twoFingerDrag` and `twoFingerDragWarning` can be used to block dragging the map with one finger
- `onAnimationStart` and `onAnimationEnd` callbacks notify us if the map is moving or not

### Breaking changes
- `zoomSnap` is now enabled by default
- `metaWheelZoom` replaces `zoomOnMouseWheel` and is reversed (previous `false` is now `true`)
- `metaWheelZoomWarning` replaces `mouseWheelMetaText`

### Other changes
- There have been numerous bug fixes since the `0.9` series, too many to mention all now
