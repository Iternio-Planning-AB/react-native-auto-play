// Side-effect-only entry point, re-exported at the package root as `installTimers` (see
// ../installTimers.ts) for `import '@iternio/react-native-auto-play/installTimers';` as the
// app's first import. installAutoPlayTimers() itself isn't part of the public API -- funneling
// installation through this one module is what actually guarantees "runs before anything else
// captures the original globals" (see the README) instead of just documenting it as a rule
// callers have to get right.
import { installAutoPlayTimers } from './utils/AutoPlayTimers';

installAutoPlayTimers();
