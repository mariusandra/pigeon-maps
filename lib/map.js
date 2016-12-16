'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function wikimedia(x, y, z) {
  var retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2;
  return 'https://maps.wikimedia.org/osm-intl/' + z + '/' + x + '/' + y + (retina ? '@2x' : '') + '.png';
}

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
var long2tile = function long2tile(lon, zoom) {
  return (lon + 180) / 360 * Math.pow(2, zoom);
};
var lat2tile = function lat2tile(lat, zoom) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
};

var Map = function (_Component) {
  _inherits(Map, _Component);

  function Map() {
    _classCallCheck(this, Map);

    return _possibleConstructorReturn(this, (Map.__proto__ || Object.getPrototypeOf(Map)).apply(this, arguments));
  }

  _createClass(Map, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          center = _props.center,
          zoom = _props.zoom,
          width = _props.width,
          height = _props.height,
          provider = _props.provider;


      var mapUrl = provider || wikimedia;

      var tileCenterX = long2tile(center[1], zoom);
      var tileCenterY = lat2tile(center[0], zoom);

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
          var childLeft = (long2tile(position[1], zoom) - tileMinX) * 256;
          var childTop = (lat2tile(position[0], zoom) - tileMinY) * 256;
          return _react2.default.cloneElement(child, {
            left: childLeft - (offset ? offset[0] : 0),
            top: childTop - (offset ? offset[1] : 0)
          });
        }
      });

      return _react2.default.createElement(
        'div',
        { style: { width: width, height: height, position: 'relative', display: 'inline-block', overflow: 'hidden' } },
        _react2.default.createElement(
          'div',
          { style: { position: 'absolute', width: (tileMaxX - tileMinX + 1) * 256, height: (tileMaxY - tileMinY + 1) * 256, left: left, top: top } },
          tiles.map(function (tile) {
            return _react2.default.createElement('img', { key: tile.key, src: tile.url, width: 256, height: 256, style: { position: 'absolute', left: tile.left, top: tile.top } });
          })
        ),
        _react2.default.createElement(
          'div',
          { style: { position: 'absolute', width: (tileMaxX - tileMinX + 1) * 256, height: (tileMaxY - tileMinY + 1) * 256, left: left, top: top } },
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
  children: _react2.default.PropTypes.node
};
exports.default = Map;