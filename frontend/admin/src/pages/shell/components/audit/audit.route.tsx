// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { Audit } from "./audit.view";
export const auditRoute = {
  path: ROUTES.audit,
  element: <Audit />,
};
