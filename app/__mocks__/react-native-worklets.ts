// Mock for react-native-worklets in Jest environment
export const runOnUI = (fn: (...args: unknown[]) => unknown) => fn;
export const runOnJS = (fn: (...args: unknown[]) => unknown) => fn;
export const useWorkletCallback = (fn: (...args: unknown[]) => unknown) => fn;
export const makeShareable = (v: unknown) => v;
export const isWorklet = () => false;
export const createSerializable = (v: unknown) => v;
export const makeRemote = (v: unknown) => v;
export const setupCallGuard = () => {};
export const setupRequestAnimationFrame = () => {};
export const WorkletsModule = {};

export default {
  runOnUI,
  runOnJS,
  useWorkletCallback,
  makeShareable,
  isWorklet,
  createSerializable,
  makeRemote,
  setupCallGuard,
  setupRequestAnimationFrame,
  WorkletsModule,
};
