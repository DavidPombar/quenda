// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext } from "react-router-dom";
import { fullDateLabel } from "@/services/date.service";
import type { AppContext } from "@/types/app-context";
export function useAccessibilityController() {
  const { municipality, locale, t } = useOutletContext<AppContext>();
  const statement = municipality.accessibility;
  // Until the municipality configures its statement, its general contact answers requests.
  return {
    t,
    municipality: municipality.name,
    unit: statement.unit || municipality.name,
    email: statement.email || municipality.contact,
    phone: statement.phone,
    reviewedOn: fullDateLabel(statement.reviewedOn, locale),
    method: t(
      statement.method === "external" ? "a11yMethodExternal" : "a11yMethodSelf",
    ),
    exceptions: statement.exceptions[locale],
  };
}
