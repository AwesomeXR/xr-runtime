const config = require('./webpack.config');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

config.plugins.push(
  new BundleAnalyzerPlugin({ analyzerPort: 9888, generateStatsFile: true, statsFilename: __dirname + '/stats.json' })
);

module.exports = config;
