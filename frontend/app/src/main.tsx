// SPDX-License-Identifier: AGPL-3.0-or-later
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/components/app/app.view";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
