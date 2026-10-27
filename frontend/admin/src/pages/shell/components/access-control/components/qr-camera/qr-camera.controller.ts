// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
// The camera keeps reading the same code while it is in view; ignore repeats for a moment.
const REPEAT_MS = 3000;
export function useQrCameraController(onCode: (text: string) => void) {
  const video = useRef<HTMLVideoElement>(null);
  const handler = useRef(onCode);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    handler.current = onCode;
  }, [onCode]);
  useEffect(() => {
    if (!video.current) return;
    let last = { text: "", at: 0 };
    const scanner = new QrScanner(
      video.current,
      ({ data }) => {
        const now = Date.now();
        if (data === last.text && now - last.at < REPEAT_MS) return;
        last = { text: data, at: now };
        handler.current(data);
      },
      { returnDetailedScanResult: true, highlightScanRegion: true },
    );
    scanner.start().catch(() => setFailed(true));
    return () => {
      scanner.destroy();
    };
  }, []);
  return { video, failed };
}
