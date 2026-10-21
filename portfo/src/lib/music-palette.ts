import { music } from "../data/music";

export type RGB = [number, number, number];
export type MusicPalette = [RGB, RGB];

/** Boost cover hues so they remain legible in tiny ASCII marks. */
export function albumPalette(index: number): MusicPalette {
  return music[index].colors.map((hex) => {
    const rgb = [1, 3, 5].map((start) =>
      parseInt(hex.slice(start, start + 2), 16),
    );
    const gray = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    return rgb.map((channel) =>
      Math.round(
        Math.max(0, Math.min(255, (gray + (channel - gray) * 1.45) * 0.88)),
      ),
    ) as RGB;
  }) as MusicPalette;
}
