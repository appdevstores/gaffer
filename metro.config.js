// Required for expo-sqlite web support: Metro must treat .wasm as an asset
// so the wa-sqlite engine can load in the browser.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

module.exports = config;
