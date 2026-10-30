// SPDX-License-Identifier: AGPL-3.0-or-later
export type LogoType = "image/png" | "image/jpeg" | "image/webp";
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export interface Logo {
  contentType: LogoType;
  data: Uint8Array;
}
function startsWith(data: Uint8Array, bytes: number[], offset = 0) {
  return bytes.every((byte, index) => data[offset + index] === byte);
}
/** Identifies the image by its signature; SVG is excluded because it can carry scripts. */
export function detectLogoType(data: Uint8Array): LogoType | null {
  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return "image/png";
  if (startsWith(data, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    startsWith(data, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(data, [0x57, 0x45, 0x42, 0x50], 8)
  )
    return "image/webp";
  return null;
}
/** The installed app's icon: a square PNG the backoffice draws from the logo (#24). */
export const ICON_SIZE = 512;
export const MAX_ICON_BYTES = 512 * 1024;
export interface Icon {
  data: Uint8Array;
}
/** Width and height from the PNG header, or null when it is not a PNG. */
export function pngSize(data: Uint8Array) {
  if (detectLogoType(data) !== "image/png" || data.byteLength < 24) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
