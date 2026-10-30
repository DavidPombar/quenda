// SPDX-License-Identifier: AGPL-3.0-or-later
import { deflateSync } from "node:zlib";
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(data: Buffer) {
  let c = 0xffffffff;
  for (const byte of data) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
/**
 * Synthetic picture of an indoor futsal court seen from above, so the demo has a real image
 * without shipping third-party photos: wooden floor, orange playing area and white lines.
 */
export function courtPhoto(width = 640, height = 400): Buffer {
  const rows: Buffer[] = [];
  const margin = 40;
  const line = 4;
  const [cx, cy, radius] = [width / 2, height / 2, 56];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      const inside =
        x >= margin && x < width - margin && y >= margin && y < height - margin;
      const grain = ((x * 7 + Math.floor(y / 12) * 31) % 23) - 11;
      let [r, g, b] = inside
        ? [214, 112, 58]
        : [196 + grain, 150 + grain, 98 + grain];
      const near = (value: number, target: number) =>
        Math.abs(value - target) < line / 2;
      const border =
        inside &&
        (near(x, margin + 1) ||
          near(x, width - margin - 2) ||
          near(y, margin + 1) ||
          near(y, height - margin - 2));
      const halfway = inside && near(x, cx);
      const circle = Math.abs(Math.hypot(x - cx, y - cy) - radius) < line / 2;
      const area = (side: number) =>
        Math.abs(Math.hypot(x - side, y - cy) - 90) < line / 2 &&
        (side === margin ? x > side : x < side);
      if (border || halfway || circle || area(margin) || area(width - margin))
        [r, g, b] = [250, 250, 245];
      row.set([r, g, b], 1 + x * 3);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
