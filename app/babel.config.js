module.exports = (api) => {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@meupersonal/core': './src/packages/core',
            '@meupersonal/supabase': './src/packages/supabase',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
