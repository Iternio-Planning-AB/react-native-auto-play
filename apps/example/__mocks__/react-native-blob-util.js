// react-native-blob-util contains native code and cannot run under Jest;
// its polyfill also calls into the native module eagerly at import time.
export default {
  fs: {
    dirs: {
      DocumentDir: '/mock/DocumentDir',
      LegacyDownloadDir: '/mock/LegacyDownloadDir',
    },
    writeFile: jest.fn(() => Promise.resolve()),
  },
};
