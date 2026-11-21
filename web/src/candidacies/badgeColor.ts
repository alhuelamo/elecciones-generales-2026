const LIGHT_FOREGROUND = "#ffffff";
const DARK_FOREGROUND = "#111827";
const SATURATION = 0.65;
const BASE_LIGHTNESS = 0.42;
const LIGHTNESS_STEP = 0.02;
const MINIMUM_CONTRAST = 4.5;

function hashString(text: string): number {
  let hash = 0;
  for (const character of text) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function hslToHex(hue: number, lightness: number): string {
  const chroma = SATURATION * Math.min(lightness, 1 - lightness);
  const channel = (offset: number): string => {
    const k = (offset + hue / 30) % 12;
    const value = lightness - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((first, second) => second - first);
  return (lighter + 0.05) / (darker + 0.05);
}

function bestForeground(background: string): string {
  return contrastRatio(LIGHT_FOREGROUND, background) >=
    contrastRatio(DARK_FOREGROUND, background)
    ? LIGHT_FOREGROUND
    : DARK_FOREGROUND;
}

export function badgeColor(acronym: string): {
  background: string;
  foreground: string;
} {
  const hue = hashString(acronym.toLowerCase()) % 360;
  let lightness = BASE_LIGHTNESS;
  let background = hslToHex(hue, lightness);
  while (
    contrastRatio(bestForeground(background), background) < MINIMUM_CONTRAST
  ) {
    lightness -= LIGHTNESS_STEP;
    background = hslToHex(hue, lightness);
  }
  return { background, foreground: bestForeground(background) };
}
