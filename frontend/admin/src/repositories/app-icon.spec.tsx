// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, test } from "vitest";
import { appIconRepository } from "@/repositories/app-icon.repository";
import { appIconLayout } from "@/services/app-icon.service";
describe("Installed app icon (#24)", () => {
  test("should fit the logo inside the circle launchers keep visible", () => {
    const wide = appIconLayout(300, 100);
    expect(Math.hypot(wide.width, wide.height)).toBeLessThanOrEqual(
      0.8 * 512 + 1,
    );
    expect(wide.width / wide.height).toBeCloseTo(3, 1);
    expect(Math.abs(wide.x * 2 + wide.width - 512)).toBeLessThanOrEqual(1);
    expect(appIconLayout(100, 100)).toEqual({
      x: 111,
      y: 111,
      width: 290,
      height: 290,
    });
  });
  test("should draw a square 512 px PNG from any logo", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 40;
    canvas.getContext("2d")!.fillRect(0, 0, 120, 40);
    const logo = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!), "image/webp"),
    );
    const icon = await appIconRepository.draw(logo);
    expect(icon.type).toBe("image/png");
    const image = await createImageBitmap(icon);
    expect([image.width, image.height]).toEqual([512, 512]);
  });
});
