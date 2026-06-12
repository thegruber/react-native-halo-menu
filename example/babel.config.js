module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo transforms every file Metro bundles — including the
  // library's src/ pulled in via watchFolders — and brings the worklets
  // plugin by default.
  return {
    presets: ["babel-preset-expo"],
  };
};
