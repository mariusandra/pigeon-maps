'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// infact = inferno + react
var React = void 0;
var ReactDOM = void 0;
var Inferno = void 0;
var Component = void 0;
var PropTypes = void 0;

if (true) {
  exports.Inferno = Inferno = require('inferno');
  exports.ReactDOM = ReactDOM = Inferno;
  exports.Component = Component = require('inferno-component');
  exports.PropTypes = PropTypes = {};
}
if (false) {
  exports.React = React = require('react');
  exports.ReactDOM = ReactDOM = require('react-dom');
  exports.Component = Component = React.Component;
  exports.PropTypes = PropTypes = React.PropTypes;
}

exports.React = React;
exports.Inferno = Inferno;
exports.Component = Component;
exports.ReactDOM = ReactDOM;
exports.PropTypes = PropTypes;