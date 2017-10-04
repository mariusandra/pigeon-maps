// // infact = inferno + react

if (process.env.BABEL_ENV === 'inferno') {
  exports.Inferno = require('inferno')
  exports.ReactDOM = exports.Inferno
  exports.Component = require('inferno-component')
}
if (process.env.BABEL_ENV === 'react') {
  exports.React = require('react')
  exports.ReactDOM = require('react-dom')
  exports.Component = exports.React.Component
}
