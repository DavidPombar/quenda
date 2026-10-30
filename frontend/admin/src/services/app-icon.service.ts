// SPDX-License-Identifier: AGPL-3.0-or-later
/** Side of the installed app's icon, in pixels (#24). */
export const APP_ICON_SIZE = 512;
/**
 * Where the logo goes on the square icon: as large as fits inside the circle that
 * launchers keep visible on maskable icons (80 % of the side), and centred.
 */
export function appIconLayout(width: number, height: number) {
  const scale = (0.8 * APP_ICON_SIZE) / Math.hypot(width, height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  return {
    x: Math.round((APP_ICON_SIZE - w) / 2),
    y: Math.round((APP_ICON_SIZE - h) / 2),
    width: w,
    height: h,
  };
}
