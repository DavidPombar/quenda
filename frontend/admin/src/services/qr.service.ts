// SPDX-License-Identifier: AGPL-3.0-or-later
import { create } from "qrcode";
/** QR modules as one SVG path, drawn by the view with a quiet zone of four modules. */
export function qrPath(text: string) {
  const { modules } = create(text, { errorCorrectionLevel: "M" });
  const quiet = 4;
  let d = "";
  for (let y = 0; y < modules.size; y++)
    for (let x = 0; x < modules.size; x++)
      if (modules.get(y, x)) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
  return { size: modules.size + quiet * 2, d };
}
