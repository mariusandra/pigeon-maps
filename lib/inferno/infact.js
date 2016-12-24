'use strict';

// // infact = inferno + react

if (true) {
  exports.Inferno = require('inferno');
  exports.ReactDOM = exports.Inferno;
  exports.Component = require('inferno-component');
  exports.PropTypes = {};
}
if (false) {
  exports.React = require('react');
  exports.ReactDOM = require('react-dom');
  exports.Component = exports.React.Component;
  exports.PropTypes = exports.React.PropTypes;
}