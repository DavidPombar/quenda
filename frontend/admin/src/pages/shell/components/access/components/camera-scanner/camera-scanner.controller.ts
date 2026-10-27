// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => Detector;
  }
}
/**
 * Reads QR codes from the phone's rear camera. The browser's BarcodeDetector is used where it
 * exists; elsewhere frames are decoded with jsQR. Nothing leaves the device.
 */
export function useCameraScannerController(onCode: (value: string) => void) {
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);
  const callback = useRef(onCode);
  useEffect(() => {
    callback.current = onCode;
  }, [onCode]);
  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const detector = window.BarcodeDetector
      ? new window.BarcodeDetector({ formats: ["qr_code"] })
      : null;
    async function read(element: HTMLVideoElement) {
      if (detector) return (await detector.detect(element))[0]?.rawValue;
      const width = element.videoWidth;
      const height = element.videoHeight;
      if (!width || !height) return undefined;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return undefined;
      context.drawImage(element, 0, 0, width, height);
      const image = context.getImageData(0, 0, width, height);
      return jsQR(image.data, width, height, {
        inversionAttempts: "dontInvert",
      })?.data;
    }
    async function tick() {
      if (stopped) return;
      const element = video.current;
      if (element && element.readyState >= 2) {
        const value = await read(element).catch(() => undefined);
        if (value) callback.current(value);
      }
      frame = window.setTimeout(() => void tick(), 200);
    }
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        void tick();
      } catch {
        setError(true);
        setActive(false);
      }
    })();
    return () => {
      stopped = true;
      window.clearTimeout(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active]);
  return {
    video,
    active,
    error,
    start: () => {
      setError(false);
      setActive(true);
    },
    stop: () => setActive(false),
  };
}
