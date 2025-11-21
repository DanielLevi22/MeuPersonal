module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Fitness-themed vibrant colors
        background: '#0A0E1A', // Deep dark blue-black
        surface: '#141B2D', // Dark blue surface
        'surface-light': '#1E2A42', // Lighter surface

        // Primary - Energetic Orange/Red
        primary: {
          DEFAULT: '#FF6B35', // Vibrant orange
          light: '#FF8C61',
          dark: '#E85A2A',
        },

        // Secondary - Electric Blue
        secondary: {
          DEFAULT: '#00D9FF', // Cyan blue
          light: '#33E3FF',
          dark: '#00B8D9',
        },

        // Accent - Neon Green (for success/active)
        accent: {
          DEFAULT: '#00FF88', // Neon green
          light: '#33FFA3',
          dark: '#00CC6E',
        },

        // Text colors
        foreground: '#FFFFFF',
        muted: '#8B92A8',
        'muted-dark': '#5A6178',

        // Semantic colors
        success: '#00FF88',
        warning: '#FFB800',
        error: '#FF3B3B',

        // Borders
        border: '#1E2A42',
        'border-light': '#2A3A52',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
