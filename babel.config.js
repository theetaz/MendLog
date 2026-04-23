// Minimal Babel config. We rely on `babel-preset-expo` for everything
// (incl. auto-wiring react-native-reanimated in SDK 54+); the only custom
// plugin is inline-import so Drizzle's `.sql` migration files can be
// `import`ed as strings by Metro.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
