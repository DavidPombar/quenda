// SPDX-License-Identifier: AGPL-3.0-or-later
import qrcode from "qrcode-generator";
/**
 * QR modules of `text` as a single SVG path in module units. Level M survives a scratched or
 * dimmed phone screen at the door.
 */
export function qrPath(text: string) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let path = "";
  for (let row = 0; row < size; row++)
    for (let column = 0; column < size; column++)
      if (qr.isDark(row, column)) path += `M${column} ${row}h1v1h-1z`;
  return { size, path };
}
