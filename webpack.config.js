const webpack = require('webpack')
const path = require('path')

const nodeEnv = process.env.NODE_ENV || 'development'

const isProd = nodeEnv === 'production'

var config = {
  devtool: isProd ? 'hidden-source-map' : 'cheap-eval-source-map',
  context: path.join(__dirname, './demo'),
  entry: {
    vendor: ['react', 'react-dom'],
    demo: isProd ? ['./index.js'] : ['webpack-dev-server/client?http://0.0.0.0:4040', './index.js'],
  },
  output: {
    path: path.join(__dirname, './docs'),
    publicPath: '',
    chunkFilename: '[name].bundle.js',
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(html|png|jpg|gif|jpeg|svg)$/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]',
        },
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        loaders: ['babel-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: [path.resolve('./demo'), 'node_modules']
  },
  plugins: [],
  devServer: {
    contentBase: './demo',
    disableHostCheck: true,
  },
}

module.exports = config
