const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const assetExts = new Set(config.resolver.assetExts);
assetExts.add('mp4');
assetExts.add('MP4');
config.resolver.assetExts = Array.from(assetExts);

module.exports = config;
