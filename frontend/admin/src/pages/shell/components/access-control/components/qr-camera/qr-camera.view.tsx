// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQrCameraController } from "./qr-camera.controller";
export function QrCamera(p: {
  onCode: (text: string) => void;
  help: string;
  error: string;
}) {
  const c = useQrCameraController(p.onCode);
  return c.failed ? (
    <p role="alert" className="error-text">
      {p.error}
    </p>
  ) : (
    <figure className="qr-camera">
      <video
        ref={c.video}
        muted
        playsInline
        aria-describedby="qr-camera-help"
      />
      <figcaption id="qr-camera-help">{p.help}</figcaption>
    </figure>
  );
}
