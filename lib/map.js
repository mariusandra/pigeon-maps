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

    _this.handleMouseDown = function (event) {
      var _this$props = _this.props,
          width = _this$props.width,
          height = _this$props.height;

      var coords = getMouseCoords(_this._containerRef, event);

      if (coords[0] >= 0 && coords[1] >= 0 && coords[0] < width && coords[1] < height) {
        _this._mouseDown = true;
        _this._dragStart = coords;
        event.preventDefault();
      }
    };

    _this.handleMouseUp = function (event) {
      if (_this._mouseDown) {
        var _this$props2 = _this.props,
            center = _this$props2.center,
            zoom = _this$props2.zoom,
            onBoundsChanged = _this$props2.onBoundsChanged;
        var dragDelta = _this.state.dragDelta;


        if (dragDelta && onBoundsChanged) {
          var lng = tile2lng(lng2tile(center[1], zoom) - (dragDelta ? dragDelta[0] / 256.0 : 0), zoom);
          var lat = tile2lat(lat2tile(center[0], zoom) - (dragDelta ? dragDelta[1] / 256.0 : 0), zoom);
          onBoundsChanged({ center: [lat, lng], zoom: zoom });
        }

        _this._mouseDown = false;
        _this.setState({
          dragDelta: null
        });
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

    _this.handleWheel = (0, _throttleDebounce.throttle)(100, true, function (event) {
      if (event.deltaY < 0) {
        _this.zoomAroundMouse(1);
      } else if (event.deltaY > 0) {
        _this.zoomAroundMouse(-1);
      }
    });

    _this.pixelToLatLng = function (x, y) {
      var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.props.zoom;
      var _this$props3 = _this.props,
          center = _this$props3.center,
          width = _this$props3.width,
          height = _this$props3.height;


      var pointDiff = [(x - width / 2) / 256.0, (y - height / 2) / 256.0];

      var tileX = lng2tile(center[1], zoom) + pointDiff[0];
      var tileY = lat2tile(center[0], zoom) + pointDiff[1];

      return [tile2lat(tileY, zoom), tile2lng(tileX, zoom)];
    };

    _this.latLngToPixel = function (lat, lng) {
      var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.props.zoom;
      var _this$props4 = _this.props,
          center = _this$props4.center,
          width = _this$props4.width,
          height = _this$props4.height;


      var tileCenterX = lng2tile(center[1], zoom);
      var tileCenterY = lat2tile(center[0], zoom);

      var tileX = lng2tile(lng, zoom);
      var tileY = lat2tile(lat, zoom);

      return [(tileX - tileCenterX) * 256.0 + width / 2, (tileY - tileCenterY) * 256.0 + height / 2];
    };

    _this.zoomAroundMouse = function (zoomDiff) {
      var _this$props5 = _this.props,
          center = _this$props5.center,
          zoom = _this$props5.zoom,
          onBoundsChanged = _this$props5.onBoundsChanged;


      if (zoom + zoomDiff < 1 || zoom + zoomDiff > 18) {
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
    _this.state = {
      dragDelta: null
    };
    return _this;
  }

  _createClass(Map, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      window.addEventListener('mousedown', this.handleMouseDown);
      window.addEventListener('mouseup', this.handleMouseUp);
      window.addEventListener('mousemove', this.handleMouseMove);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      window.removeEventListener('mousedown', this.handleMouseDown);
      window.removeEventListener('mouseup', this.handleMouseUp);
      window.removeEventListener('mousemove', this.handleMouseMove);
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          center = _props.center,
          zoom = _props.zoom,
          width = _props.width,
          height = _props.height,
          provider = _props.provider;
      var dragDelta = this.state.dragDelta;


      var mapUrl = provider || wikimedia;

      var tileCenterX = lng2tile(center[1], zoom) - (dragDelta ? dragDelta[0] / 256.0 : 0);
      var tileCenterY = lat2tile(center[0], zoom) - (dragDelta ? dragDelta[1] / 256.0 : 0);

      var halfWidth = width / 2 / 256.0;
      var halfHeight = height / 2 / 256.0;

      var tileMinX = Math.floor(tileCenterX - halfWidth);
      var tileMaxX = Math.floor(tileCenterX + halfWidth);

      var tileMinY = Math.floor(tileCenterY - halfHeight);
      var tileMaxY = Math.floor(tileCenterY + halfHeight);

      var tiles = [];
      for (var x = tileMinX; x <= tileMaxX; x++) {
        for (var y = tileMinY; y <= tileMaxY; y++) {
          tiles.push({
            key: x + '-' + y + '-' + zoom,
            url: mapUrl(x, y, zoom),
            left: (x - tileMinX) * 256,
            top: (y - tileMinY) * 256
          });
        }
      }

      var left = -((tileCenterX - tileMinX) * 256 - width / 2);
      var top = -((tileCenterY - tileMinY) * 256 - height / 2);

      var childrenWithProps = _react2.default.Children.map(this.props.children, function (child) {
        var _child$props = child.props,
            position = _child$props.position,
            offset = _child$props.offset;

        if (position) {
          var childLeft = (lng2tile(position[1], zoom) - tileMinX) * 256;
          var childTop = (lat2tile(position[0], zoom) - tileMinY) * 256;
          return _react2.default.cloneElement(child, {
            left: childLeft - (offset ? offset[0] : 0),
            top: childTop - (offset ? offset[1] : 0)
          });
        }
      });

      var containerStyle = {
        width: width,
        height: height,
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden'
      };

      var tilesStyle = {
        position: 'absolute',
        width: (tileMaxX - tileMinX + 1) * 256,
        height: (tileMaxY - tileMinY + 1) * 256,
        left: left,
        top: top
      };

      return _react2.default.createElement(
        'div',
        { style: containerStyle,
          ref: this.setRef,
          onWheel: this.handleWheel },
        _react2.default.createElement(
          'div',
          { style: tilesStyle },
          tiles.map(function (tile) {
            return _react2.default.createElement('img', { key: tile.key, src: tile.url, width: 256, height: 256, style: { position: 'absolute', left: tile.left, top: tile.top } });
          })
        ),
        _react2.default.createElement(
          'div',
          { style: tilesStyle },
          childrenWithProps
        )
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