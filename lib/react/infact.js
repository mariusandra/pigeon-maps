'use strict';

// // infact = inferno + react

if (false) {
  exports.Inferno = require('inferno');
  exports.ReactDOM = exports.Inferno;
  exports.Component = require('inferno-component');
  exports.PropTypes = {};
}
if (true) {
  exports.React = require('react');
  exports.ReactDOM = require('react-dom');
  exports.Component = exports.React.Component;
  exports.PropTypes = exports.React.PropTypes;
}