# Pigeon Maps - ReactJS maps without external dependencies

[![npm version](https://img.shields.io/npm/v/pigeon-maps.svg)](https://www.npmjs.com/package/pigeon-maps)
[![minified](https://badgen.net/bundlephobia/min/pigeon-maps)](https://bundlephobia.com/result?p=pigeon-maps)
[![minified + gzipped](https://badgen.net/bundlephobia/minzip/pigeon-maps)](https://bundlephobia.com/result?p=pigeon-maps)

Demo: https://pigeon-maps.js.org/ (using maps from MapTiler, OSM and Stamen)

## What is it?

Are you tired of waiting 3 seconds to parse 200kb of Google Maps JavaScript just to display a few tiles and a marker? 140kb of minified Leaflet too much?

Welcome to the club!

This project aims to provide a performance-first React-centric extendable map engine.

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
- Markers
- Overlays
- Draggable Overlays
- Zoom Controls

Missing:
- Double tap and then swipe touch zooming
- Many other components

## Install

[Read the docs here!](https://pigeon-maps.js.org/docs/installation)

## Yeah, but why "pigeon"??

Pigeons are experts in [magnetoreception](https://en.wikipedia.org/wiki/magnetoreception). Good pigeons can find their way home from anywhere.

Magnets were essential in making the first maps. With a good map you can find your way home from anywhere.

Thus, `pigeon`.

Source: https://en.wikipedia.org/wiki/Homing_pigeon
