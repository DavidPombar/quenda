// SPDX-License-Identifier: AGPL-3.0-or-later
import type { PushDevice } from "@/types/models";
/** Where this browser stands with push notices, before asking the server anything. */
export type DeviceSupport = "supported" | "unsupported" | "ios_home_screen";
const SCOPE = `${import.meta.env.BASE_URL}`;
const WORKER = `${import.meta.env.BASE_URL}sw.js`;
function standalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
function base64UrlToBytes(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
/** The browser side of Web Push: the service worker and its subscription. */
export const pushDeviceRepository = {
  support(): DeviceSupport {
    const capable =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    // iOS only offers push to web apps added to the home screen (16.4 and later).
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !standalone())
      return "ios_home_screen";
    return capable ? "supported" : "unsupported";
  },
  permission(): NotificationPermission {
    return Notification.permission;
  },
  async current(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.getRegistration(SCOPE);
    return (await registration?.pushManager.getSubscription()) ?? null;
  },
  /** Asks for permission (call it from a click), registers the worker and subscribes. */
  async subscribe(publicKey: string): Promise<PushDevice | null> {
    if ((await Notification.requestPermission()) !== "granted") return null;
    await navigator.serviceWorker.register(WORKER, { scope: SCOPE });
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(publicKey),
    });
    return subscription.toJSON() as PushDevice;
  },
};
