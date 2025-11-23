export const theme = {
  colors: {
    // Cyber-Fitness Palette (Mapped to CSS Variables)
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    'surface-highlight': 'var(--color-surface-highlight)',
    
    // Primary - High Voltage
    primary: {
      DEFAULT: 'var(--color-primary)',
      hover: 'var(--color-primary-hover)',
      foreground: 'var(--color-primary-foreground)',
    },

    // Secondary - Tech/Science
    secondary: {
      DEFAULT: 'var(--color-secondary)',
      hover: 'var(--color-secondary-hover)',
      foreground: 'var(--color-secondary-foreground)',
    },

    // Accent - Gamification/Urgency
    accent: {
      DEFAULT: 'var(--color-accent)',
      hover: 'var(--color-accent-hover)',
      foreground: 'var(--color-accent-foreground)',
    },

    // Text
    foreground: 'var(--color-foreground)',
    muted: 'var(--color-muted)',
    'muted-dark': 'var(--color-muted-dark)',

    // Semantic
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',

    // Borders
    border: 'var(--color-border)',
    'border-light': 'var(--color-border-light)',
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
  },
};
