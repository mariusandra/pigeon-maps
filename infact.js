if (process.env.BABEL_ENV === 'inferno') {
  module.exports = require('./lib/inferno/index.js')
}
if (process.env.BABEL_ENV === 'react') {
  module.exports = require('./lib/react/index.js')
}
