function relativeLuminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(
  foregroundHex: string,
  backgroundHex: string,
): number {
  const [lighter, darker] = [
    relativeLuminance(foregroundHex),
    relativeLuminance(backgroundHex),
  ].sort((first, second) => second - first);
  return (lighter + 0.05) / (darker + 0.05);
}
