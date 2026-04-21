module.exports = (api) => {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@elevapro/core': './src/packages/core',
            '@elevapro/supabase': './src/packages/supabase',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
