module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: [require.resolve('@react-native/jest-preset/jest/setup.js'), './jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|immer|react-redux)/)',
  ],
};
