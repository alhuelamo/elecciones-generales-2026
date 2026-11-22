export const FALLBACK_PARTY_COLOR = "#8c877c";
export const NEUTRAL_PARTY_COLOR = "#77737b";
export const PAPER_COLORS = { light: "#faf7f0", dark: "#16151a" } as const;

const MAXIMUM_CHROMA = 0.12;
const ACHROMATIC_CHROMA = 0.02;
const MINIMUM_LIGHTNESS = 0.55;
const MAXIMUM_LIGHTNESS = 0.65;
const CHROMA_STEP = 0.005;

type Triple = [number, number, number];

export function partyColor(color: string | null): string {
  return color === null ? FALLBACK_PARTY_COLOR : harmonizePartyColor(color);
}

export function harmonizePartyColor(hex: string): string {
  const [lightness, chroma, hue] = hexToOklch(hex);
  if (chroma < ACHROMATIC_CHROMA) return NEUTRAL_PARTY_COLOR;
  return fitToGamut(
    Math.min(Math.max(lightness, MINIMUM_LIGHTNESS), MAXIMUM_LIGHTNESS),
    Math.min(chroma, MAXIMUM_CHROMA),
    hue,
  );
}

export function harmonizePartyColorAtLightness(
  hex: string,
  lightness: number,
): string {
  const [, chroma, hue] = hexToOklch(hex);
  if (chroma < ACHROMATIC_CHROMA) return NEUTRAL_PARTY_COLOR;
  return fitToGamut(lightness, Math.min(chroma, MAXIMUM_CHROMA), hue);
}

export function colorDistance(firstHex: string, secondHex: string): number {
  const [firstLightness, firstA, firstB] = hexToOklab(firstHex);
  const [secondLightness, secondA, secondB] = hexToOklab(secondHex);
  return Math.hypot(
    firstLightness - secondLightness,
    firstA - secondA,
    firstB - secondB,
  );
}

function hexToOklab(hex: string): Triple {
  const [lightness, chroma, hue] = hexToOklch(hex);
  return [lightness, chroma * Math.cos(hue), chroma * Math.sin(hue)];
}

function fitToGamut(lightness: number, chroma: number, hue: number): string {
  for (let reduced = chroma; reduced > 0; reduced -= CHROMA_STEP) {
    const linear = oklchToLinearRgb(lightness, reduced, hue);
    if (linear.every((channel) => channel >= 0 && channel <= 1)) {
      return linearRgbToHex(linear);
    }
  }
  return linearRgbToHex(oklchToLinearRgb(lightness, 0, hue));
}

function hexToOklch(hex: string): Triple {
  const [red, green, blue] = [1, 3, 5].map((start) =>
    toLinear(parseInt(hex.slice(start, start + 2), 16) / 255),
  );
  const long = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
  );
  const medium = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
  );
  const short = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
  );
  const lightness =
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short;
  const a = 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short;
  const b = 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short;
  return [lightness, Math.hypot(a, b), Math.atan2(b, a)];
}

function oklchToLinearRgb(
  lightness: number,
  chroma: number,
  hue: number,
): Triple {
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];
}

function linearRgbToHex(linear: number[]): string {
  return `#${linear
    .map((channel) => {
      const value = Math.round(
        fromLinear(Math.min(Math.max(channel, 0), 1)) * 255,
      );
      return value.toString(16).padStart(2, "0");
    })
    .join("")}`;
}

function toLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * value ** (1 / 2.4) - 0.055;
}
