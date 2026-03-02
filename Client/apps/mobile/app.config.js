/* eslint-disable @typescript-eslint/no-require-imports -- Expo config is CJS */
const base = require("./app.json");

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    web: {
      ...base.expo.web,
      bundler: "metro",
    },
    experiments: {
      ...base.expo.experiments,
      baseUrl: process.env.EXPO_MOBILE_BASE_URL ?? "",
    },
  },
};
