// SPDX-License-Identifier: AGPL-3.0-or-later
/** WCAG 2.1 AA for normal text: the brand colour carries white text and is used as text on white. */
export const MIN_CONTRAST = 4.5;
function channel(value: number) {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}
export function relativeLuminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((index) =>
    channel(parseInt(hex.slice(index, index + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Contrast ratio between a #rrggbb colour and white. */
export function contrastWithWhite(hex: string) {
  return 1.05 / (relativeLuminance(hex) + 0.05);
}
export function isAccessiblePrimaryColor(hex: string) {
  return /^#[0-9a-f]{6}$/.test(hex) && contrastWithWhite(hex) >= MIN_CONTRAST;
}
