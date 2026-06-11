const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['ios', 'android', 'native', 'web'];

/**
 * Force specific packages to resolve via CJS instead of ESM on web.
 * Packages like zustand v5 ship .mjs files that use `import.meta.env`
 * which causes "Cannot use 'import.meta' outside a module" errors in
 * Metro's non-module web bundle.
 */
const ESM_TO_CJS_MAP = {
  'zustand/middleware': path.join(__dirname, 'node_modules/zustand/middleware.js'),
  'zustand': path.join(__dirname, 'node_modules/zustand/index.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && ESM_TO_CJS_MAP[moduleName]) {
    return {
      filePath: ESM_TO_CJS_MAP[moduleName],
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
