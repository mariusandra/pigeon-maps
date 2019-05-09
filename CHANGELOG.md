# Change Log
All notable changes to this project will be documented in this file.

As we're at the 0.x phase, deprecations and breaking changes will still happen. They will be documented here.

Once we reach 1.0 all deprecations will be removed and the project will switch to SemVer.

## Uncommitted

## 0.13.0 - 2019-05-09
### Changes
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
### Fixes
- Fix 100% height issue. #48 and #4

## 0.12.0 - 2019-03-26
### Changes
- Removed inferno support, which reportedly didn't even work (#39).
- Started using rollup and babel loose mode to reduce the size even more. #59 @markusenglund (a [~8% reduction!](https://bundlephobia.com/result?p=pigeon-maps@0.12.0))

## 0.11.11 - 2018-11-16
### Fixes
- Fix wheel/touchpad scrolling on Chrome 73+, which requires non-passive event handlers for wheel events. [See also this](https://github.com/facebook/react/issues/14856).

## 0.11.8 - 2018-11-16
### Fixes
- Another edge case bug with animation and changing the center before the animation had time to finish.

## 0.11.7 - 2018-11-16
### Fixes
- Bug when animating between screens and forced to jump to a far away screen, it would freeze instead of jumping.

## 0.11.6 - 2018-11-05
### Fixes
- The `pigeon-drag-block` class also works with touch events

## 0.11.5 - 2018-10-18
### Changes
- Fixes "0 0 0 0" appearing if the map has no size. #46 @PofMagicfingers

## 0.11.4 - 2018-10-18
### Changes
- Added an undocumented feature `limitBounds`. If defaults to `center`, but if set to `edge`, we will try show as much map as possible. See issue #45 for details.

## 0.11.3 - 2018-10-17
### Changes
- Added a polyfill for `window.requestAnimationFrame`
- Updated attribution URL to https://pigeon-maps.js.org/

## 0.11.2 - 2018-10-10
### Addition
- Added `boxClassname` props allowing you to apply css for the tiles div only #43 @sgerin

### Fix
- Fix bug zoom position when browser loses focus #41 @benrampon

## 0.11.1 - 2018-09-29
### Updates
- Explicitly set touch event listeners to use non-passive mode. Fixes iOS 11.3 dragging issue. #40 @Jercik

## 0.11.0 - 2018-09-19
### Updates
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
