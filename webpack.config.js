const cwd = process.cwd();
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const glob = require('glob');
const path = require('path');

function applyPlatform(platform) {
  const entry = {};

  glob.sync(`./src/${platform}/*.ts`).forEach(path => {
    const name = path.replace(`src/${platform}/`, '').replace('.ts', '');
    entry[name] = ['@babel/polyfill', './' + path];
  });

  return {
    entry,

    mode: 'production',
    devtool: false,
    target: 'web',

    output: {
      path: `${cwd}/dist/${platform}`,
      library: { type: 'umd', name: ['XR', '[name]'] },
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: cwd + '/tsconfig.build.json',
              },
            },
          ],
        },
        {
          test: /\.js$/,
          use: [{ loader: 'babel-loader' }],
        },
        {
          // 处理: BREAKING CHANGE: The request 'process/browser' failed to resolve only because it was resolved as fully specified
          test: /\.m?js/,
          resolve: { fullySpecified: false },
        },
      ],
    },

    plugins: [
      // [Won’t work in browser because of process.cwd()? · Issue #8 · browserify/path-browserify](https://github.com/browserify/path-browserify/issues/8)
      new webpack.ProvidePlugin({ process: 'process/browser' }),
    ],

    resolve: {
      extensions: ['.ts', '.js'],
      fallback: { crypto: false, path: false, fs: false },

      alias: {
        'ah-flow-node$': path.resolve(__dirname, 'node_modules/ah-flow-node'),
        'xr-core$': path.resolve(__dirname, 'node_modules/xr-core'),
      },
    },

    stats: {
      children: true,
    },

    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 5,
            compress: { drop_debugger: true },
          },
        }),
      ],
    },
  };
}

module.exports = [applyPlatform('h5')];
