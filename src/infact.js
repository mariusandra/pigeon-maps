// // infact = inferno + react

if (process.env.BABEL_ENV === 'inferno') {
  exports.Inferno = require('inferno')
  exports.ReactDOM = exports.Inferno
  exports.Component = require('inferno-component')
  exports.PropTypes = {}
}
if (process.env.BABEL_ENV === 'react') {
  exports.React = require('react')
  exports.ReactDOM = require('react-dom')
  exports.Component = exports.React.Component
  exports.PropTypes = exports.React.PropTypes
}
