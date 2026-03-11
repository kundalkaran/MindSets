module.exports = {
  dependencies: {
    // Exclude react-native-worklets native code on iOS.
    // We only need its babel plugin; reanimated v3 already bundles
    // the worklets native runtime, so linking RNWorklets causes
    // duplicate symbol errors.
    "react-native-worklets": {
      platforms: {
        ios: null,
      },
    },
  },
};
