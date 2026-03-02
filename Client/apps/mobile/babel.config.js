// Path resolution (packages/, @/, etc.) is handled by Metro's custom resolver in metro.config.cjs.
// We do not use babel-plugin-module-resolver here because it calls glob.hasMagic, which is
// incompatible with the project's glob@10+ override and causes "Cannot read properties of undefined (reading 'hasMagic')".
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
