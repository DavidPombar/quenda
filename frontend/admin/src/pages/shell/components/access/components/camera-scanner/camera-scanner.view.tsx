// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { PiCamera, PiCameraSlash } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import { useCameraScannerController } from "./camera-scanner.controller";
export function CameraScanner(p: {
  onCode: (value: string) => void;
  t: (key: TextKey) => string;
}) {
  const c = useCameraScannerController(p.onCode);
  return (
    <div className="camera-scanner">
      <div className={`camera-frame${c.active ? " active" : ""}`}>
        <video
          ref={c.video}
          muted
          playsInline
          aria-label={p.t("accessCamera")}
        />
        {!c.active && <p className="muted">{p.t("accessCameraOff")}</p>}
      </div>
      {c.active ? (
        <Button variant="outline" size="lg" onClick={c.stop}>
          <PiCameraSlash size={20} aria-hidden="true" />
          {p.t("accessStopCamera")}
        </Button>
      ) : (
        <Button colorPalette="court" size="lg" onClick={c.start}>
          <PiCamera size={20} aria-hidden="true" />
          {p.t("accessStartCamera")}
        </Button>
      )}
      {c.error && (
        <p role="alert" className="error-text">
          {p.t("accessCameraError")}
        </p>
      )}
    </div>
  );
}
