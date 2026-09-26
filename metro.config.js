/* eslint-disable @typescript-eslint/no-require-imports -- Metro loads its configuration through CommonJS. */
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const {
  getBundleModeMetroConfig,
} = require('react-native-worklets/bundleMode');
const {
  checkNativeImports,
} = require('./scripts/metro/check-native-imports.cjs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Allow optional dependencies for the transformer
if (!config.transformer) {
  config.transformer = {};
}
config.transformer.allowOptionalDependencies = true;

// Enable tree shaking and performance optimizations
config.transformer.getTransformOptions = async () => ({
  transform: {
    inlineRequires: true,
  },
});

// Support mobile platforms only
config.resolver.platforms = ['ios', 'android'];

// Local credential files are inputs to tooling, never JavaScript modules.
// Keep them out of Metro's module graph even though Git already ignores them.
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  /[/\\]\.env(?:\.[^/\\]+)*\.local$/,
];

// Collapse Hermes/Babel pseudo-frames so Metro doesn't try to read non-existent InternalBytecode.js
config.symbolicator = {
  customizeFrame: frame => {
    if (frame.file && frame.file.includes('InternalBytecode')) {
      return { ...frame, collapse: true };
    }
    return frame;
  },
};

const nativeConfig = getBundleModeMetroConfig(config);
const originalSerializerHook =
  nativeConfig.serializer.experimentalSerializerHook;
nativeConfig.serializer.experimentalSerializerHook = (graph, delta) => {
  checkNativeImports(graph, __dirname);
  originalSerializerHook?.(graph, delta);
};

module.exports = nativeConfig;
