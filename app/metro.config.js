const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// Explicitly set the project root to ensure correct resolution regardless of execution context
config.projectRoot = __dirname;

// Add support for GLB/GLTF 3D model files
config.resolver.assetExts.push('glb', 'gltf', 'png', 'jpg');

// Polyfill Node built-ins for packages like react-native-svg that import 'buffer'
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
};

// Normalize path to use forward slashes for Windows compatibility
const inputPath = path.resolve(__dirname, './src/global.css').replace(/\\/g, '/');

let finalConfig = config;
try {
  finalConfig = withNativeWind(config, { input: inputPath });
  console.log('✅ NativeWind configuration applied successfully.');
} catch (error) {
  console.error('❌ Error applying withNativeWind:', error);
  // Keep the try-catch to allow app to launch even if style config fails
}

module.exports = finalConfig;
