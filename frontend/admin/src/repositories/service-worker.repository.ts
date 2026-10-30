// SPDX-License-Identifier: AGPL-3.0-or-later
const SCOPE = `${import.meta.env.BASE_URL}`;
const WORKER = `${import.meta.env.BASE_URL}sw.js`;
/** The service worker that keeps the app shell for offline use (#24). */
export const serviceWorkerRepository = {
  supported() {
    return "serviceWorker" in navigator;
  },
  register(): Promise<ServiceWorkerRegistration> {
    return navigator.serviceWorker.register(WORKER, { scope: SCOPE });
  },
};
