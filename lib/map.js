'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _throttleDebounce = require('throttle-debounce');

var _parentPosition = require('./utils/parent-position');

var _parentPosition2 = _interopRequireDefault(_parentPosition);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

function getMouseCoords(dom, event) {
  var parent = (0, _parentPosition2.default)(dom);
  return [event.clientX - parent.x, event.clientY - parent.y];
}

var Map = function (_Component) {
  _inherits(Map, _Component);

  function Map(props) {
    _classCallCheck(this, Map);

    var _this = _possibleConstructorReturn(this, (Map.__proto__ || Object.getPrototypeOf(Map)).call(this, props));

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
        var coords = getMouseCoords(_this._containerRef, touch);

        if (coords[0] >= 0 && coords[1] >= 0 && coords[0] < width && coords[1] < height) {
          _this._touchStartCoords = [[touch.clientX, touch.clientY]];
          event.preventDefault();
        }
      } else if (event.touches.length === 2) {
        // TODO
      }
    };

    _this.handleTouchMove = function (event) {
      if (event.touches.length === 1 && _this._touchStartCoords) {
        event.preventDefault();
        var touch = event.touches[0];

        _this.setState({
          dragDelta: [touch.clientX - _this._touchStartCoords[0][0], touch.clientY - _this._touchStartCoords[0][1]]
        });
      }
    };

    _this.handleTouchEnd = function (event) {
      if (event.touches.length === 0 && _this._touchStartCoords) {
        event.preventDefault();
        _this.sendDeltaChange();
        _this._touchStartCoords = null;
      }
    };

    _this.handleMouseDown = function (event) {
      var _this$props2 = _this.props,
          width = _this$props2.width,
          height = _this$props2.height;

      var coords = getMouseCoords(_this._containerRef, event);

      if (coords[0] >= 0 && coords[1] >= 0 && coords[0] < width && coords[1] < height) {
        _this._mouseDown = true;
        _this._dragStart = coords;
        event.preventDefault();
      }
    };

    _this.handleMouseMove = function (event) {
      _this._mousePosition = getMouseCoords(_this._containerRef, event);

      if (_this._mouseDown && _this._dragStart) {
        _this.setState({
          dragDelta: [_this._mousePosition[0] - _this._dragStart[0], _this._mousePosition[1] - _this._dragStart[1]]
        });
      }
    };

    _this.handleMouseUp = function (event) {
      if (_this._mouseDown) {
        _this.sendDeltaChange();
        _this._mouseDown = false;
      }
    };

    _this.sendDeltaChange = function () {
      var _this$props3 = _this.props,
          center = _this$props3.center,
          zoom = _this$props3.zoom,
          onBoundsChanged = _this$props3.onBoundsChanged;
      var dragDelta = _this.state.dragDelta;


      if (dragDelta && onBoundsChanged) {
        var lng = tile2lng(lng2tile(center[1], zoom) - (dragDelta ? dragDelta[0] / 256.0 : 0), zoom);
        var lat = tile2lat(lat2tile(center[0], zoom) - (dragDelta ? dragDelta[1] / 256.0 : 0), zoom);
        onBoundsChanged({ center: [lat, lng], zoom: zoom });
      }

      _this.setState({
        dragDelta: null
      });
    };

    _this.handleWheel = function (event) {
      event.preventDefault();
      _this.handleWheelThrottled(event);
    };

    _this.handleWheelThrottled = (0, _throttleDebounce.throttle)(20, true, function (event) {
      if (event.deltaY < 0) {
        _this.zoomAroundMouse(0.2);
      } else if (event.deltaY > 0) {
        _this.zoomAroundMouse(-0.2);
      }
    });

    _this.pixelToLatLng = function (x, y) {
      var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.props.zoom;
      var _this$props4 = _this.props,
          center = _this$props4.center,
          width = _this$props4.width,
          height = _this$props4.height;


      var pointDiff = [(x - width / 2) / 256.0, (y - height / 2) / 256.0];

      var tileX = lng2tile(center[1], zoom) + pointDiff[0];
      var tileY = lat2tile(center[0], zoom) + pointDiff[1];

      return [tile2lat(tileY, zoom), tile2lng(tileX, zoom)];
    };

    _this.latLngToPixel = function (lat, lng) {
      var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.props.zoom;
      var _this$props5 = _this.props,
          center = _this$props5.center,
          width = _this$props5.width,
          height = _this$props5.height;


      var tileCenterX = lng2tile(center[1], zoom);
      var tileCenterY = lat2tile(center[0], zoom);

      var tileX = lng2tile(lng, zoom);
      var tileY = lat2tile(lat, zoom);

      return [(tileX - tileCenterX) * 256.0 + width / 2, (tileY - tileCenterY) * 256.0 + height / 2];
    };

    _this.zoomAroundMouse = function (zoomDiff) {
      var _this$props6 = _this.props,
          center = _this$props6.center,
          zoom = _this$props6.zoom,
          onBoundsChanged = _this$props6.onBoundsChanged;


      if (!_this._mousePosition || zoom + zoomDiff < 1 || zoom + zoomDiff > 18) {
        return;
      }

      var latLngNow = _this.pixelToLatLng(_this._mousePosition[0], _this._mousePosition[1], zoom);

      var latLngZoomed = _this.pixelToLatLng(_this._mousePosition[0], _this._mousePosition[1], zoom + zoomDiff);

      var diffLat = latLngZoomed[0] - latLngNow[0];
      var diffLng = latLngZoomed[1] - latLngNow[1];

      onBoundsChanged({ center: [center[0] - diffLat, center[1] - diffLng], zoom: zoom + zoomDiff });
    };

    _this.setRef = function (dom) {
      _this._containerRef = dom;
    };

    _this._mousePosition = null;
    _this._dragStart = null;
    _this._mouseDown = false;
    _this._touchStartCoords = null;
    _this.state = {
      dragDelta: null,
      oldTiles: []
    };
    return _this;
  }

  _createClass(Map, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      window.addEventListener('mousedown', this.handleMouseDown);
      window.addEventListener('mouseup', this.handleMouseUp);
      window.addEventListener('mousemove', this.handleMouseMove);

      window.addEventListener('touchstart', this.handleTouchStart);
      window.addEventListener('touchmove', this.handleTouchMove);
      window.addEventListener('touchend', this.handleTouchEnd);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      window.removeEventListener('mousedown', this.handleMouseDown);
      window.removeEventListener('mouseup', this.handleMouseUp);
      window.removeEventListener('mousemove', this.handleMouseMove);

      window.removeEventListener('touchstart', this.handleTouchStart);
      window.removeEventListener('touchmove', this.handleTouchMove);
      window.removeEventListener('touchend', this.handleTouchEnd);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps, nextState) {
      var _this2 = this;

      if (Math.round(this.props.zoom) !== Math.round(nextProps.zoom)) {
        (function () {
          var tileValues = _this2.tileValues(_this2.props, _this2.state);
          var nextValues = _this2.tileValues(nextProps, nextState);
          var oldTiles = _this2.state.oldTiles;

          _this2.setState({
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

          _this2._loadTracker = loadTracker;
        })();
      }
    }
  }, {
    key: 'tileValues',
    value: function tileValues(props, state) {
      var center = props.center,
          zoom = props.zoom,
          width = props.width,
          height = props.height;
      var dragDelta = state.dragDelta;


      var roundedZoom = Math.round(zoom);
      var zoomDelta = zoom - roundedZoom;

      var scale = Math.pow(2, zoomDelta);
      var scaleWidth = width / scale;
      var scaleHeight = height / scale;

      var tileCenterX = lng2tile(center[1], roundedZoom) - (dragDelta ? dragDelta[0] / 256.0 / scale : 0);
      var tileCenterY = lat2tile(center[0], roundedZoom) - (dragDelta ? dragDelta[1] / 256.0 / scale : 0);

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
        scaleWidth: scaleWidth,
        scaleHeight: scaleHeight,
        scale: scale
      };
    }
  }, {
    key: 'renderTiles',
    value: function renderTiles() {
      var _this3 = this;

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

        for (var x = old.tileMinX; x <= old.tileMaxX; x++) {
          for (var y = old.tileMinY; y <= old.tileMaxY; y++) {
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

      for (var _x3 = tileMinX; _x3 <= tileMaxX; _x3++) {
        for (var _y = tileMinY; _y <= tileMaxY; _y++) {
          tiles.push({
            key: _x3 + '-' + _y + '-' + roundedZoom,
            url: mapUrl(_x3, _y, roundedZoom),
            left: (_x3 - tileMinX) * 256,
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
                return _this3.imageLoaded(tile.key);
              },
              style: { position: 'absolute', left: tile.left, top: tile.top, transform: tile.transform, transformOrigin: 'top left', opacity: 1 } });
          })
        )
      );
    }
  }, {
    key: 'renderOverlays',
    value: function renderOverlays() {
      var _this4 = this;

      var _props = this.props,
          zoom = _props.zoom,
          width = _props.width,
          height = _props.height;
      var dragDelta = this.state.dragDelta;


      var childrenWithProps = _react2.default.Children.map(this.props.children, function (child) {
        var _child$props = child.props,
            position = _child$props.position,
            offset = _child$props.offset;

        if (position) {
          var c = _this4.latLngToPixel(position[0], position[1], zoom);
          return _react2.default.cloneElement(child, {
            left: c[0] - (offset ? offset[0] : 0) + (dragDelta ? dragDelta[0] : 0),
            top: c[1] - (offset ? offset[1] : 0) + (dragDelta ? dragDelta[1] : 0)
          });
        }
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
    key: 'render',
    value: function render() {
      var _props2 = this.props,
          width = _props2.width,
          height = _props2.height;


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
        this.renderOverlays()
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

  onBoundsChanged: _react2.default.PropTypes.func,
  onZoomChanged: _react2.default.PropTypes.func
};
exports.default = Map;