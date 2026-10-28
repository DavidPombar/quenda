// SPDX-License-Identifier: AGPL-3.0-or-later
import { createBrowserRouter } from "react-router-dom";
import { homeRoute } from "@/pages/home/home.route";
import { accessibilityRoute } from "@/pages/accessibility/accessibility.route";
export const router = createBrowserRouter([homeRoute, accessibilityRoute]);
