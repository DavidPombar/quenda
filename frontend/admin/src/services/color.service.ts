// SPDX-License-Identifier: AGPL-3.0-or-later
/** WCAG 2.1 AA for normal text; mirrors the API rule for the municipal colour. */
export const MIN_CONTRAST = 4.5;
const HEX = /^#[0-9a-f]{6}$/i;
function rgb(hex: string) {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
}
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((value) => {
    const srgb = value / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function isHexColor(value: string) {
  return HEX.test(value);
}
export function contrastWithWhite(hex: string) {
  return 1.05 / (luminance(hex) + 0.05);
}
export function isAccessibleColor(hex: string) {
  return isHexColor(hex) && contrastWithWhite(hex) >= MIN_CONTRAST;
}
function mix(hex: string, target: number, amount: number) {
  return (
    "#" +
    rgb(hex)
      .map((value) =>
        Math.round(value + (target - value) * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export const BRAND_VARIABLES = [
  "--court",
  "--court-dark",
  "--court-tint",
  "--court-200",
  "--court-300",
] as const;
/** CSS custom properties of the brand palette; empty when the colour is unusable. */
export function brandVariables(hex: string): Record<string, string> {
  if (!isAccessibleColor(hex)) return {};
  return {
    "--court": hex.toLowerCase(),
    "--court-dark": mix(hex, 0, 0.25),
    "--court-tint": mix(hex, 255, 0.89),
    "--court-200": mix(hex, 255, 0.75),
    "--court-300": mix(hex, 255, 0.55),
  };
}
