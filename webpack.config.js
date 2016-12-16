const webpack = require('webpack')
const path = require('path')

const nodeEnv = process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'

var config = {
  devtool: isProd ? 'hidden-source-map' : 'cheap-eval-source-map',
  context: path.join(__dirname, './demo'),
  entry: {
    common: [
      'babel-polyfill', 'react',
      './index.js'
    ]
  },
  output: {
    path: path.join(__dirname, './static'),
    publicPath: '/',
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'file',
        query: {
          name: '[name].[ext]'
        }
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loaders: (isProd ? [] : ['react-hot']).concat([
          'babel-loader'
        ])
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    modules: [
      path.resolve('./demo'),
      'node_modules'
    ],
    alias: {
      '~': path.join(__dirname, './demo'),
      'fully-react-maps': path.join(__dirname, './src')
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(nodeEnv) }
    })
  ],
  devServer: {
    contentBase: './demo'
  }
}

// development mode
if (!isProd) {
  Object.keys(config.entry).forEach(function (k) {
    config.entry[k].unshift(
      'webpack-dev-server/client?http://0.0.0.0:4040',
      'webpack/hot/only-dev-server'
    )
  })
}

module.exports = config
