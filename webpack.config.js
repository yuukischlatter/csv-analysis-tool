const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  
  // CHANGED: Use 'web' target for browser compatibility instead of 'electron-renderer'
  target: 'web',
  
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "fs": false,
      "path": false,
      "os": false
    }
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    // Fix for jsPDF in browser
    new webpack.DefinePlugin({
      'global': 'window'
    })
  ],
  
  // CHANGED: Remove electron-specific node settings
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'build'),
    },
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: true,
    open: false
  },
  
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
};