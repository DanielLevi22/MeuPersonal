module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/nutrition$': '<rootDir>/src/modules/nutrition',
    '^@/workout$': '<rootDir>/src/modules/workout',
    '^@/students$': '<rootDir>/src/modules/students',
    '^@/auth$': '<rootDir>/src/modules/auth',
    '^@/assessment$': '<rootDir>/src/modules/assessment',
    '^@meupersonal/core(.*)$': '<rootDir>/src/packages/core$1',
    '^@meupersonal/supabase(.*)$': '<rootDir>/src/packages/supabase$1',
    '^@meupersonal/shared(.*)$': '<rootDir>/../shared/src$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Permite que arquivos em shared/ resolvam node_modules de app/
  modulePaths: ['<rootDir>/node_modules'],
  // Limita paralelismo para evitar flakiness em testes com timers/async
  maxWorkers: 2,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@exponent/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated)',
  ],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/__tests__/**'],
};
