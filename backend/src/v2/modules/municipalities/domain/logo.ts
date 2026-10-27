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
