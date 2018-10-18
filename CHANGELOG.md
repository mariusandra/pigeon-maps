# Change Log
All notable changes to this project will be documented in this file.

As we're at the 0.x phase, deprecations and breaking changes will still happen. They will be documented here.

Once we reach 1.0 all deprecations will be removed and the project will switch to SemVer.

## Uncommitted

## 0.11.5 - 2019-10-18
### Changes
- Fixes "0 0 0 0" appearing if the map has no size. #46 @PofMagicfingers

## 0.11.4 - 2019-10-18
### Changes
- Added an undocumented feature `limitBounds`. If defaults to `center`, but if set to `edge`, we will try show as much map as possible. See issue #45 for details.

## 0.11.3 - 2019-10-17
### Changes
- Added a polyfill for `window.requestAnimationFrame`
- Updated attribution URL to https://pigeon-maps.js.org/

## 0.11.2 - 2019-10-10
### Addition
- Added `boxClassname` props allowing you to apply css for the tiles div only #43 @sgerin

### Fix
- Fix bug zoom position when browser loses focus #41 @benrampon

## 0.11.1 - 2019-09-29
### Updates
- Explicitly set touch event listeners to use non-passive mode. Fixes iOS 11.3 dragging issue. #40 @Jercik

## 0.11.0 - 2019-09-19
### Updates
- Added `minZoom` and `maxZoom` to limit the zoom range
- Several small bugfixes

## 0.10.0 - 2019-09-10
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

