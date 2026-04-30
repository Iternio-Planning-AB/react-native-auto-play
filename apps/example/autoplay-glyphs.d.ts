import type { GlyphName } from './assets/symbolFont/Glyphmap';

declare module '@iternio/react-native-auto-play' {
  interface AutoPlayGlyphMap extends Record<GlyphName, number> {}
}
