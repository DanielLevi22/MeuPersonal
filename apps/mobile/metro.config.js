const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
// Normalize path to use forward slashes for Windows compatibility
const inputPath = path.resolve(__dirname, "./src/global.css").replace(/\\/g, "/");

let finalConfig = config;
try {
  finalConfig = withNativeWind(config, { input: inputPath });
  console.log("✅ NativeWind configuration applied successfully.");
} catch (error) {
  console.error("❌ Error applying withNativeWind:", error);
  // Keep the try-catch to allow app to launch even if style config fails
}

module.exports = finalConfig;
