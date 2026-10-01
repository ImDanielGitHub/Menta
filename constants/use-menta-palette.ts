import { createContext, useContext } from 'react';
import { mentaColors, type MentaPalette } from './MentaDesignSystem';

export const MentaPaletteContext = createContext<MentaPalette>(mentaColors);
export const useMentaPalette = () => useContext(MentaPaletteContext);

const styleCache = new WeakMap<object, WeakMap<MentaPalette, unknown>>();

/** One immutable style set per factory and palette, shared across instances. */
export function useMentaStyles<T>(factory: (palette: MentaPalette) => T): T {
  const palette = useMentaPalette();
  let cache = styleCache.get(factory);
  if (!cache) {
    cache = new WeakMap();
    styleCache.set(factory, cache);
  }
  if (!cache.has(palette)) cache.set(palette, factory(palette));
  return cache.get(palette) as T;
}
