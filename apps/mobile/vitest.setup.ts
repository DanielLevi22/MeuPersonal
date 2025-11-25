// Setup file for Vitest

// Mock global objects that might be needed
global.setImmediate = global.setImmediate || ((fn: Function, ...args: any[]) => global.setTimeout(fn, 0, ...args));
