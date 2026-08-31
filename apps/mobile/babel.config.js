const path = require('path');

const nativeWindPackage = require.resolve('nativewind/package.json');
const cssInteropPlugin = require.resolve(
  'react-native-css-interop/dist/babel-plugin',
  { paths: [path.dirname(nativeWindPackage)] },
);

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      cssInteropPlugin,
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
