'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _parentPosition = require('./utils/parent-position');

var _parentPosition2 = _interopRequireDefault(_parentPosition);

var _parentHasClass = require('./utils/parent-has-class');

var _parentHasClass2 = _interopRequireDefault(_parentHasClass);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ANIMATION_TIME = 300;
var DIAGONAL_THROW_TIME = 1500;
var SCROLL_PIXELS_FOR_ZOOM_LEVEL = 150;
var MIN_DRAG_FOR_THROW = 40;
var CLICK_TOLERANCE = 2;

function wikimedia(x, y, z) {
  var retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2;
  return 'https://maps.wikimedia.org/osm-intl/' + z + '/' + x + '/' + y + (retina ? '@2x' : '') + '.png';
}

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
var lng2tile = function lng2tile(lon, zoom) {
  return (lon + 180) / 360 * Math.pow(2, zoom);
};
var lat2tile = function lat2tile(lat, zoom) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
};

function tile2lng(x, z) {
  return x / Math.pow(2, z) * 360 - 180;
}

function tile2lat(y, z) {
  var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function getMousePixel(dom, event) {
  var parent = (0, _parentPosition2.default)(dom);
  return [event.clientX - parent.x, event.clientY - parent.y];
}

function easeOutQuad(t) {
  return t * (2 - t);
}

var Map = function (_Component) {
  _inherits(Map, _Component);

  function Map(props) {
    _classCallCheck(this, Map);

    var _this = _possibleConstructorReturn(this, (Map.__proto__ || Object.getPrototypeOf(Map)).call(this, props));

    _this.setCenterZoomTarget = function (center, zoom, fromProps) {
      var zoomAround = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      var animationDuration = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : ANIMATION_TIME;

      // TODO: if center diff is more than 2 screens, no animation

      if (_this.props.animate) {
        if (_this._isAnimating) {
          window.cancelAnimationFrame(_this._animFrame);

          var _this$animationStep = _this.animationStep(window.performance.now()),
              centerStep = _this$animationStep.centerStep,
              zoomStep = _this$animationStep.zoomStep;

          _this._centerStart = centerStep;
          _this._zoomStart = zoomStep;
        } else {
          _this._isAnimating = true;
          _this._centerStart = [_this.state.center[0], _this.state.center[1]];
          _this._zoomStart = _this.state.zoom;
        }

        _this._animationStart = window.performance.now();
        _this._animationEnd = _this._animationStart + animationDuration;

        if (zoomAround) {
          _this._zoomAround = zoomAround;
          _this._centerTarget = _this.calculateZoomCenter(_this.state.center, zoomAround, _this.state.zoom, zoom);
        } else {
          _this._zoomAround = null;
          _this._centerTarget = center;
        }
        _this._zoomTarget = zoom;

        _this._animFrame = window.requestAnimationFrame(_this.animate);
      } else {
        if (zoomAround) {
          var _center = _this.calculateZoomCenter(_this.state.center, zoomAround, _this.state.zoom, zoom);
          _this.setCenterZoom(_center, zoom, fromProps);
        } else {
          _this.setCenterZoom(center, zoom, fromProps);
        }
      }
    };

    _this.animationStep = function (timestamp) {
      var length = _this._animationEnd - _this._animationStart;
      var progress = Math.max(timestamp - _this._animationStart, 0);
      var percentage = easeOutQuad(progress / length);

      var zoomDiff = (_this._zoomTarget - _this._zoomStart) * percentage;
      var zoomStep = _this._zoomStart + zoomDiff;

      if (_this._zoomAround) {
        var centerStep = _this.calculateZoomCenter(_this._centerStart, _this._zoomAround, _this._zoomStart, zoomStep);

        return { centerStep: centerStep, zoomStep: zoomStep };
      } else {
        var _centerStep = [_this._centerStart[0] + (_this._centerTarget[0] - _this._centerStart[0]) * percentage, _this._centerStart[1] + (_this._centerTarget[1] - _this._centerStart[1]) * percentage];

        return { centerStep: _centerStep, zoomStep: zoomStep };
      }
    };

    _this.animate = function (timestamp) {
      if (timestamp >= _this._animationEnd) {
        _this._isAnimating = false;
        _this.setCenterZoom(_this._centerTarget, _this._zoomTarget);
      } else {
        var _this$animationStep2 = _this.animationStep(timestamp),
            centerStep = _this$animationStep2.centerStep,
            zoomStep = _this$animationStep2.zoomStep;

        _this.setCenterZoom(centerStep, zoomStep);
        _this._animFrame = window.requestAnimationFrame(_this.animate);
      }
    };

    _this.stopAnimating = function () {
      if (_this._isAnimating) {
        _this._isAnimating = false;
        window.cancelAnimationFrame(_this._animFrame);
      }
    };

    _this.setCenterZoom = function (center, zoom) {
      if (Math.round(_this.state.zoom) !== Math.round(zoom)) {
        (function () {
          var tileValues = _this.tileValues(_this.props, _this.state);
          var nextValues = _this.tileValues(_this.props, { center: center, zoom: zoom });
          var oldTiles = _this.state.oldTiles;

          _this.setState({
            oldTiles: oldTiles.filter(function (o) {
              return o.roundedZoom !== tileValues.roundedZoom;
            }).concat(tileValues)
          });

          var loadTracker = {};

          for (var x = nextValues.tileMinX; x <= nextValues.tileMaxX; x++) {
            for (var y = nextValues.tileMinY; y <= nextValues.tileMaxY; y++) {
              var key = x + '-' + y + '-' + nextValues.roundedZoom;
              loadTracker[key] = false;
            }
          }

          _this._loadTracker = loadTracker;
        })();
      }

      _this.setState({ center: center, zoom: zoom });

      if (Math.abs(_this.props.zoom - zoom) > 0.001 || Math.abs(_this.props.center[0] - center[0]) > 0.0001 || Math.abs(_this.props.center[1] - center[1]) > 0.0001) {
        _this.syncToProps(center, zoom);
      }
    };

    _this.imageLoaded = function (key) {
      if (_this._loadTracker && key in _this._loadTracker) {
        _this._loadTracker[key] = true;

        // all loaded
        if (Object.keys(_this._loadTracker).filter(function (k) {
          return !_this._loadTracker[k];
        }).length === 0) {
          _this.setState({ oldTiles: [] });
        }
      }
    };

    _this.handleTouchStart = function (event) {
      var _this$props = _this.props,
          width = _this$props.width,
          height = _this$props.height;


      if (event.touches.length === 1) {
        var touch = event.touches[0];
        var pixel = getMousePixel(_this._containerRef, touch);

        if (pixel[0] >= 0 && pixel[1] >= 0 && pixel[0] < width && pixel[1] < height) {
          _this._touchStartCoords = [[touch.clientX, touch.clientY]];
          _this.startTrackingMoveEvents(pixel);
          event.preventDefault();
        }
        // added second finger and first one was in the area
      } else if (event.touches.length === 2 && _this._touchStartCoords) {
        event.preventDefault();

        _this.stopTrackingMoveEvents();

        if (_this.state.pixelDelta || _this.state.zoomDelta) {
          _this.sendDeltaChange();
        }

        var t1 = event.touches[0];
        var t2 = event.touches[1];

        _this._touchStartCoords = [[t1.clientX, t1.clientY], [t2.clientX, t2.clientY]];
        _this._touchStartMidPoint = [(t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2];
        _this._touchStartDistance = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
      }
    };

    _this.handleTouchMove = function (event) {
      if (event.touches.length === 1 && _this._touchStartCoords) {
        event.preventDefault();
        var touch = event.touches[0];
        var pixel = getMousePixel(_this._containerRef, touch);
        _this.trackMoveEvents(pixel);

        _this.setState({
          pixelDelta: [touch.clientX - _this._touchStartCoords[0][0], touch.clientY - _this._touchStartCoords[0][1]]
        });
      } else if (event.touches.length === 2 && _this._touchStartCoords) {
        var _this$props2 = _this.props,
            width = _this$props2.width,
            height = _this$props2.height;
        var zoom = _this.state.zoom;


        event.preventDefault();

        var t1 = event.touches[0];
        var t2 = event.touches[1];

        var parent = (0, _parentPosition2.default)(_this._containerRef);

        var midPoint = [(t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2];
        var midPointDiff = [midPoint[0] - _this._touchStartMidPoint[0], midPoint[1] - _this._touchStartMidPoint[1]];

        var distance = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));

        var zoomDelta = Math.min(18, zoom + Math.log2(distance / _this._touchStartDistance)) - zoom;
        var scale = Math.pow(2, zoomDelta);

        var centerDiffDiff = [(parent.x + width / 2 - midPoint[0]) * (scale - 1), (parent.y + height / 2 - midPoint[1]) * (scale - 1)];

        _this.setState({
          zoomDelta: zoomDelta,
          pixelDelta: [centerDiffDiff[0] + midPointDiff[0] * scale, centerDiffDiff[1] + midPointDiff[1] * scale]
        });
      }
    };

    _this.handleTouchEnd = function (event) {
      if (_this._touchStartCoords) {
        event.preventDefault();

        var _this$sendDeltaChange = _this.sendDeltaChange(),
            center = _this$sendDeltaChange.center,
            zoom = _this$sendDeltaChange.zoom;

        if (event.touches.length === 0) {
          _this._touchStartCoords = null;
          var pixel = getMousePixel(_this._containerRef, event.changedTouches[0]);
          _this.throwAfterMoving(pixel, center, zoom);
        } else if (event.touches.length === 1) {
          var touch = event.touches[0];
          var _pixel = getMousePixel(_this._containerRef, touch);

          _this._touchStartCoords = [[touch.clientX, touch.clientY]];
          _this.startTrackingMoveEvents(_pixel);
        }
      }
    };

    _this.handleMouseDown = function (event) {
      var _this$props3 = _this.props,
          width = _this$props3.width,
          height = _this$props3.height;

      var pixel = getMousePixel(_this._containerRef, event);

      if (event.button === 0 && !(0, _parentHasClass2.default)(event.target, 'pigeon-drag-block') && pixel[0] >= 0 && pixel[1] >= 0 && pixel[0] < width && pixel[1] < height) {
        _this.stopAnimating();

        _this._mouseDown = true;
        _this._dragStart = pixel;
        event.preventDefault();
        _this.startTrackingMoveEvents(pixel);
      }
    };

    _this.handleMouseMove = function (event) {
      _this._mousePosition = getMousePixel(_this._containerRef, event);

      if (_this._mouseDown && _this._dragStart) {
        _this.trackMoveEvents(_this._mousePosition);
        _this.setState({
          pixelDelta: [_this._mousePosition[0] - _this._dragStart[0], _this._mousePosition[1] - _this._dragStart[1]]
        });
      }
    };

    _this.handleMouseUp = function (event) {
      var pixelDelta = _this.state.pixelDelta;


      if (_this._mouseDown) {
        _this._mouseDown = false;

        var pixel = getMousePixel(_this._containerRef, event);

        if (_this.props.onClick && !(0, _parentHasClass2.default)(event.target, 'pigeon-click-block') && (!pixelDelta || Math.abs(pixelDelta[0]) + Math.abs(pixelDelta[1]) <= CLICK_TOLERANCE)) {
          var latLng = _this.pixelToLatLng(pixel);
          _this.props.onClick({ event: event, latLng: latLng, pixel: pixel });
          _this.setState({ pixelDelta: null });
        } else {
          var _this$sendDeltaChange2 = _this.sendDeltaChange(),
              center = _this$sendDeltaChange2.center,
              zoom = _this$sendDeltaChange2.zoom;

          _this.throwAfterMoving(pixel, center, zoom);
        }
      }
    };

    _this.startTrackingMoveEvents = function (coords) {
      _this._moveEvents = [{ timestamp: window.performance.now(), coords: coords }];
    };

    _this.stopTrackingMoveEvents = function () {
      _this._moveEvents = [];
    };

    _this.trackMoveEvents = function (coords) {
      var timestamp = window.performance.now();

      if (timestamp - _this._moveEvents[_this._moveEvents.length - 1].timestamp > 40) {
        _this._moveEvents.push({ timestamp: timestamp, coords: coords });
        if (_this._moveEvents.length > 2) {
          _this._moveEvents.shift();
        }
      }
    };

    _this.throwAfterMoving = function (coords, center, zoom) {
      var _this$props4 = _this.props,
          width = _this$props4.width,
          height = _this$props4.height;


      var timestamp = window.performance.now();
      var lastEvent = _this._moveEvents.shift();

      if (lastEvent) {
        var deltaMs = Math.max(timestamp - lastEvent.timestamp, 1);

        var delta = [(coords[0] - lastEvent.coords[0]) / deltaMs * 120, (coords[1] - lastEvent.coords[1]) / deltaMs * 120];

        var distance = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1]);

        if (distance > MIN_DRAG_FOR_THROW) {
          var diagonal = Math.sqrt(width * width + height * height);

          var throwTime = DIAGONAL_THROW_TIME * distance / diagonal;

          var lng = tile2lng(lng2tile(center[1], zoom) - delta[0] / 256.0, zoom);
          var lat = tile2lat(lat2tile(center[0], zoom) - delta[1] / 256.0, zoom);

          _this.setCenterZoomTarget([lat, lng], zoom, false, null, throwTime);
        }
      }

      _this.stopTrackingMoveEvents();
    };

    _this.sendDeltaChange = function () {
      var _this$state = _this.state,
          center = _this$state.center,
          zoom = _this$state.zoom,
          pixelDelta = _this$state.pixelDelta,
          zoomDelta = _this$state.zoomDelta;


      var lat = center[0];
      var lng = center[1];

      if (pixelDelta || zoomDelta !== 0) {
        lng = tile2lng(lng2tile(center[1], zoom + zoomDelta) - (pixelDelta ? pixelDelta[0] / 256.0 : 0), zoom + zoomDelta);
        lat = tile2lat(lat2tile(center[0], zoom + zoomDelta) - (pixelDelta ? pixelDelta[1] / 256.0 : 0), zoom + zoomDelta);
        _this.setCenterZoom([lat, lng], zoom + zoomDelta);
      }

      _this.setState({
        pixelDelta: null,
        zoomDelta: 0
      });

      return {
        center: [lat, lng],
        zoom: zoom + zoomDelta
      };
    };

    _this.syncToProps = function () {
      var center = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this.state.center;
      var zoom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this.state.zoom;
      var _this$props5 = _this.props,
          onBoundsChanged = _this$props5.onBoundsChanged,
          width = _this$props5.width,
          height = _this$props5.height;


      if (onBoundsChanged) {
        var bounds = {
          ne: _this.pixelToLatLng([width - 1, 0]),
          sw: _this.pixelToLatLng([0, height - 1])
        };

        onBoundsChanged({ center: center, zoom: zoom, bounds: bounds });
      }
    };

    _this.handleWheel = function (event) {
      event.preventDefault();

      var addToZoom = -event.deltaY / SCROLL_PIXELS_FOR_ZOOM_LEVEL;

      if (_this._zoomTarget) {
        var stillToAdd = _this._zoomTarget - _this.state.zoom;
        _this.zoomAroundMouse(addToZoom + stillToAdd);
      } else {
        _this.zoomAroundMouse(addToZoom);
      }
    };

    _this.zoomAroundMouse = function (zoomDiff) {
      var zoom = _this.state.zoom;


      if (!_this._mousePosition || zoom === 1 && zoomDiff < 0 || zoom === 18 && zoomDiff > 0) {
        return;
      }

      var latLngNow = _this.pixelToLatLng(_this._mousePosition);

      _this.setCenterZoomTarget(null, Math.max(1, Math.min(zoom + zoomDiff, 18)), false, latLngNow);
    };

    _this.zoomPlusDelta = function () {
      return _this.state.zoom + _this.state.zoomDelta;
    };

    _this.pixelToLatLng = function (pixel) {
      var center = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this.state.center;
      var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.zoomPlusDelta();
      var _this$props6 = _this.props,
          width = _this$props6.width,
          height = _this$props6.height;
      var pixelDelta = _this.state.pixelDelta;


      var pointDiff = [(pixel[0] - width / 2 - (pixelDelta ? pixelDelta[0] : 0)) / 256.0, (pixel[1] - height / 2 - (pixelDelta ? pixelDelta[1] : 0)) / 256.0];

      var tileX = lng2tile(center[1], zoom) + pointDiff[0];
      var tileY = lat2tile(center[0], zoom) + pointDiff[1];

      return [tile2lat(tileY, zoom), tile2lng(tileX, zoom)];
    };

    _this.latLngToPixel = function (latLng) {
      var center = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this.state.center;
      var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.zoomPlusDelta();
      var _this$props7 = _this.props,
          width = _this$props7.width,
          height = _this$props7.height;
      var pixelDelta = _this.state.pixelDelta;


      var tileCenterX = lng2tile(center[1], zoom);
      var tileCenterY = lat2tile(center[0], zoom);

      var tileX = lng2tile(latLng[1], zoom);
      var tileY = lat2tile(latLng[0], zoom);

      return [(tileX - tileCenterX) * 256.0 + width / 2 + (pixelDelta ? pixelDelta[0] : 0), (tileY - tileCenterY) * 256.0 + height / 2 + (pixelDelta ? pixelDelta[1] : 0)];
    };

    _this.calculateZoomCenter = function (center, coords, oldZoom, newZoom) {
      var pixel = _this.latLngToPixel(coords, center, oldZoom);
      var latLngZoomed = _this.pixelToLatLng(pixel, center, newZoom);
      var diffLat = latLngZoomed[0] - coords[0];
      var diffLng = latLngZoomed[1] - coords[1];

      return [center[0] - diffLat, center[1] - diffLng];
    };

    _this.setRef = function (dom) {
      _this._containerRef = dom;
    };

    _this._mousePosition = null;
    _this._dragStart = null;
    _this._mouseDown = false;
    _this._moveEvents = [];
    _this._touchStartCoords = null;

    _this._isAnimating = false;
    _this._animationStart = null;
    _this._animationEnd = null;
    _this._centerTarget = null;
    _this._zoomTarget = null;

    _this.state = {
      zoom: props.zoom,
      center: props.center,
      zoomDelta: 0,
      pixelDelta: null,
      oldTiles: []
    };
    return _this;
  }

  _createClass(Map, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var wa = window.addEventListener;
      wa('mousedown', this.handleMouseDown);
      wa('mouseup', this.handleMouseUp);
      wa('mousemove', this.handleMouseMove);

      wa('touchstart', this.handleTouchStart);
      wa('touchmove', this.handleTouchMove);
      wa('touchend', this.handleTouchEnd);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var wr = window.removeEventListener;
      wr('mousedown', this.handleMouseDown);
      wr('mouseup', this.handleMouseUp);
      wr('mousemove', this.handleMouseMove);

      wr('touchstart', this.handleTouchStart);
      wr('touchmove', this.handleTouchMove);
      wr('touchend', this.handleTouchEnd);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (Math.abs(nextProps.zoom - this.state.zoom) > 0.001 || Math.abs(nextProps.center[0] - this.state.center[0]) > 0.0001 || Math.abs(nextProps.center[1] - this.state.center[1]) > 0.0001) {
        this.setCenterZoomTarget(nextProps.center, nextProps.zoom, true);
      }
    }

    // https://www.bennadel.com/blog/1856-using-jquery-s-animate-step-callback-function-to-create-custom-animations.htm


    // tools

    // ref

  }, {
    key: 'tileValues',


    // data to display the tiles

    value: function tileValues(props, state) {
      var width = props.width,
          height = props.height;
      var center = state.center,
          zoom = state.zoom,
          pixelDelta = state.pixelDelta,
          zoomDelta = state.zoomDelta;


      var roundedZoom = Math.round(zoom + zoomDelta);
      var zoomDiff = zoom + zoomDelta - roundedZoom;

      var scale = Math.pow(2, zoomDiff);
      var scaleWidth = width / scale;
      var scaleHeight = height / scale;

      var tileCenterX = lng2tile(center[1], roundedZoom) - (pixelDelta ? pixelDelta[0] / 256.0 / scale : 0);
      var tileCenterY = lat2tile(center[0], roundedZoom) - (pixelDelta ? pixelDelta[1] / 256.0 / scale : 0);

      var halfWidth = scaleWidth / 2 / 256.0;
      var halfHeight = scaleHeight / 2 / 256.0;

      var tileMinX = Math.floor(tileCenterX - halfWidth);
      var tileMaxX = Math.floor(tileCenterX + halfWidth);

      var tileMinY = Math.floor(tileCenterY - halfHeight);
      var tileMaxY = Math.floor(tileCenterY + halfHeight);

      return {
        tileMinX: tileMinX,
        tileMaxX: tileMaxX,
        tileMinY: tileMinY,
        tileMaxY: tileMaxY,
        tileCenterX: tileCenterX,
        tileCenterY: tileCenterY,
        roundedZoom: roundedZoom,
        zoomDelta: zoomDelta,
        scaleWidth: scaleWidth,
        scaleHeight: scaleHeight,
        scale: scale
      };
    }

    // display the tiles

  }, {
    key: 'renderTiles',
    value: function renderTiles() {
      var _this2 = this;

      var oldTiles = this.state.oldTiles;

      var mapUrl = this.props.provider || wikimedia;

      var _tileValues = this.tileValues(this.props, this.state),
          tileMinX = _tileValues.tileMinX,
          tileMaxX = _tileValues.tileMaxX,
          tileMinY = _tileValues.tileMinY,
          tileMaxY = _tileValues.tileMaxY,
          tileCenterX = _tileValues.tileCenterX,
          tileCenterY = _tileValues.tileCenterY,
          roundedZoom = _tileValues.roundedZoom,
          scaleWidth = _tileValues.scaleWidth,
          scaleHeight = _tileValues.scaleHeight,
          scale = _tileValues.scale;

      var tiles = [];

      for (var i = 0; i < oldTiles.length; i++) {
        var old = oldTiles[i];
        var zoomDiff = old.roundedZoom - roundedZoom;

        if (Math.abs(zoomDiff) > 4 || zoomDiff === 0) {
          continue;
        }

        var pow = 1 / Math.pow(2, zoomDiff);
        var xDiff = -(tileMinX - old.tileMinX * pow) * 256;
        var yDiff = -(tileMinY - old.tileMinY * pow) * 256;

        var _xMin = Math.max(old.tileMinX, 0);
        var _yMin = Math.max(old.tileMinY, 0);
        var _xMax = Math.min(old.tileMaxX, Math.pow(2, old.roundedZoom) - 1);
        var _yMax = Math.min(old.tileMaxY, Math.pow(2, old.roundedZoom) - 1);

        for (var x = _xMin; x <= _xMax; x++) {
          for (var y = _yMin; y <= _yMax; y++) {
            tiles.push({
              key: x + '-' + y + '-' + old.roundedZoom,
              url: mapUrl(x, y, old.roundedZoom),
              left: xDiff + (x - old.tileMinX) * 256 * pow,
              top: yDiff + (y - old.tileMinY) * 256 * pow,
              width: 256 * pow,
              height: 256 * pow,
              active: false
            });
          }
        }
      }

      var xMin = Math.max(tileMinX, 0);
      var yMin = Math.max(tileMinY, 0);
      var xMax = Math.min(tileMaxX, Math.pow(2, roundedZoom) - 1);
      var yMax = Math.min(tileMaxY, Math.pow(2, roundedZoom) - 1);

      for (var _x9 = xMin; _x9 <= xMax; _x9++) {
        for (var _y = yMin; _y <= yMax; _y++) {
          tiles.push({
            key: _x9 + '-' + _y + '-' + roundedZoom,
            url: mapUrl(_x9, _y, roundedZoom),
            left: (_x9 - tileMinX) * 256,
            top: (_y - tileMinY) * 256,
            width: 256,
            height: 256,
            active: true
          });
        }
      }

      var boxStyle = {
        width: scaleWidth,
        height: scaleHeight,
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        transform: 'scale(' + scale + ', ' + scale + ')',
        transformOrigin: 'top left'
      };

      var left = -((tileCenterX - tileMinX) * 256 - scaleWidth / 2);
      var top = -((tileCenterY - tileMinY) * 256 - scaleHeight / 2);

      var tilesStyle = {
        position: 'absolute',
        width: (tileMaxX - tileMinX + 1) * 256,
        height: (tileMaxY - tileMinY + 1) * 256,
        left: left,
        top: top
      };

      return _react2.default.createElement(
        'div',
        { style: boxStyle },
        _react2.default.createElement(
          'div',
          { style: tilesStyle },
          tiles.map(function (tile) {
            return _react2.default.createElement('img', { key: tile.key,
              src: tile.url,
              width: tile.width,
              height: tile.height,
              onLoad: function onLoad() {
                return _this2.imageLoaded(tile.key);
              },
              style: { position: 'absolute', left: tile.left, top: tile.top, transform: tile.transform, transformOrigin: 'top left', opacity: 1 } });
          })
        )
      );
    }
  }, {
    key: 'renderOverlays',
    value: function renderOverlays() {
      var _this3 = this;

      var _props = this.props,
          width = _props.width,
          height = _props.height;
      var center = this.state.center;


      var childrenWithProps = _react2.default.Children.map(this.props.children, function (child) {
        var _child$props = child.props,
            position = _child$props.position,
            offset = _child$props.offset;


        var c = _this3.latLngToPixel(position || center);

        return _react2.default.cloneElement(child, {
          left: c[0] - (offset ? offset[0] : 0),
          top: c[1] - (offset ? offset[1] : 0),
          latLngToPixel: _this3.latLngToPixel,
          pixelToLatLng: _this3.pixelToLatLng
        });
      });

      var childrenStyle = {
        position: 'absolute',
        width: width,
        height: height,
        top: 0,
        left: 0
      };

      return _react2.default.createElement(
        'div',
        { style: childrenStyle },
        childrenWithProps
      );
    }
  }, {
    key: 'renderAttribution',
    value: function renderAttribution() {
      var _props2 = this.props,
          attribution = _props2.attribution,
          attributionPrefix = _props2.attributionPrefix;


      if (attribution === false) {
        return null;
      }

      var style = {
        position: 'absolute',
        bottom: 0,
        right: 0,
        fontSize: '11px',
        padding: '2px 5px',
        background: 'rgba(255, 255, 255, 0.7)',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        color: '#333'
      };

      var linkStyle = {
        color: '#0078A8',
        textDecoration: 'none'
      };

      return _react2.default.createElement(
        'div',
        { key: 'attr', className: 'pigeon-attribution', style: style },
        attributionPrefix === false ? null : _react2.default.createElement(
          'span',
          null,
          attributionPrefix || _react2.default.createElement(
            'a',
            { href: 'https://github.com/mariusandra/pigeon-maps', style: linkStyle },
            'Pigeon'
          ),
          ' | '
        ),
        attribution || _react2.default.createElement(
          'span',
          null,
          ' © ',
          _react2.default.createElement(
            'a',
            { href: 'https://www.openstreetmap.org/copyright', style: linkStyle },
            'OpenStreetMap'
          ),
          ' contributors'
        )
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var _props3 = this.props,
          width = _props3.width,
          height = _props3.height;


      var containerStyle = {
        width: width,
        height: height,
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
        background: '#dddddd'
      };

      return _react2.default.createElement(
        'div',
        { style: containerStyle,
          ref: this.setRef,
          onWheel: this.handleWheel },
        this.renderTiles(),
        this.renderOverlays(),
        this.renderAttribution()
      );
    }
  }]);

  return Map;
}(_react.Component);

Map.propTypes = {
  center: _react2.default.PropTypes.array,
  zoom: _react2.default.PropTypes.number,
  width: _react2.default.PropTypes.number,
  height: _react2.default.PropTypes.number,
  provider: _react2.default.PropTypes.func,
  children: _react2.default.PropTypes.node,
  animate: _react2.default.PropTypes.bool,
  attribution: _react2.default.PropTypes.any,
  attributionPrefix: _react2.default.PropTypes.any,

  onClick: _react2.default.PropTypes.func,
  onBoundsChanged: _react2.default.PropTypes.func
};
Map.defaultProps = {
  animate: true
};
exports.default = Map;