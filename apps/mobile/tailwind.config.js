const { theme } = require('../../packages/config/src/theme');

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: theme.colors,
      fontFamily: theme.fontFamily,
    },
  },
  plugins: [],
}
