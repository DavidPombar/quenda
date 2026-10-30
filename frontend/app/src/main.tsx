// SPDX-License-Identifier: AGPL-3.0-or-later
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/components/app/app.view";
import { serviceWorkerRepository } from "@/repositories/service-worker.repository";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
// Only built apps: in development and tests Vite and MSW own the requests.
if (import.meta.env.PROD && serviceWorkerRepository.supported())
  serviceWorkerRepository.register().catch(() => {
    /* Without the worker the app still works online. */
  });
