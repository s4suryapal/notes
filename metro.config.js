const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').ConfigT} */
module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // 📦 Production optimizations: minification and console.log removal
  config.transformer = config.transformer || {};
  config.transformer.minifierConfig = {
    keep_classnames: true,  // Keep class names for better debugging
    keep_fnames: true,      // Keep function names for better stack traces
    mangle: {
      toplevel: false,      // Don't mangle top-level names
    },
    compress: {
      reduce_funcs: false,  // Preserve function structure for debugging
      drop_console: process.env.NODE_ENV === 'production',  // Remove console.log only in production
    },
  };

  return config;
})();
