// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { appManifest } from "./app-manifest";
import { pngSize } from "./logo";
const council = {
  slug: "vilaverde",
  name: "Vilaverde",
  locale: "gl" as const,
  primaryColor: "#7a1f3d",
  iconVersion: null,
};
describe("Installed app manifest", () => {
  it("should make each council its own app with its name and colour", () => {
    expect(appManifest(council)).toMatchObject({
      id: "/app/vilaverde/",
      start_url: "/app/vilaverde/",
      scope: "/app/",
      name: "Vilaverde: reservas",
      short_name: "Vilaverde",
      lang: "gl",
      display: "standalone",
      theme_color: "#7a1f3d",
    });
  });
  it("should use the council icon when there is one and Quenda's otherwise", () => {
    expect(appManifest(council).icons[0].src).toBe("/app/icon-192.png");
    expect(
      appManifest({ ...council, primaryColor: "", iconVersion: "abc" }),
    ).toMatchObject({
      theme_color: "#1f5b43",
      icons: [
        { src: "/v2/public/municipalities/vilaverde/icon?v=abc" },
        {
          src: "/v2/public/municipalities/vilaverde/icon?v=abc",
          purpose: "maskable",
        },
      ],
    });
  });
});
describe("PNG size", () => {
  it("should read the size from the header and reject other images", () => {
    const png = Buffer.alloc(33);
    Buffer.from("89504e470d0a1a0a", "hex").copy(png);
    png.writeUInt32BE(512, 16);
    png.writeUInt32BE(256, 20);
    expect(pngSize(png)).toEqual({ width: 512, height: 256 });
    expect(pngSize(Buffer.from([0xff, 0xd8, 0xff, 0, 0]))).toBeNull();
    expect(pngSize(png.subarray(0, 12))).toBeNull();
  });
});
