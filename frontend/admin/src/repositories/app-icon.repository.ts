// SPDX-License-Identifier: AGPL-3.0-or-later
import { APP_ICON_SIZE, appIconLayout } from "@/services/app-icon.service";
/** Draws the installed app's icon from the logo in the browser, so the server needs no image library (#24). */
export const appIconRepository = {
  async draw(logo: Blob): Promise<Blob> {
    const image = await createImageBitmap(logo);
    const canvas = document.createElement("canvas");
    canvas.width = APP_ICON_SIZE;
    canvas.height = APP_ICON_SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    // White, like the logo on the app's header; the council colour goes in the manifest.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, APP_ICON_SIZE, APP_ICON_SIZE);
    const box = appIconLayout(image.width, image.height);
    context.drawImage(image, box.x, box.y, box.width, box.height);
    image.close();
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("canvas"))),
        "image/png",
      ),
    );
  },
};
