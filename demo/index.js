import Demo from './demo'

import './index.html'

const React = process.env.BUILD_TARGET === 'inferno' ? require('inferno') : require('react')
const ReactDOM = process.env.BUILD_TARGET === 'inferno' ? require('inferno') : require('react-dom')

ReactDOM.render(
  <Demo />,
  document.getElementById('root')
)
