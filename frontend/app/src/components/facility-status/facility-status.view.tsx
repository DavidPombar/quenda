// SPDX-License-Identifier: AGPL-3.0-or-later
import { PiCheck, PiLock, PiWrench } from "react-icons/pi";
import type { Facility } from "@/types/models";
const ICONS = { active: PiCheck, maintenance: PiWrench, closed: PiLock };
// Facility status as text with a supporting icon.
export function FacilityStatus({
  status,
  label,
}: {
  status: Facility["status"];
  label: string;
}) {
  const Icon = ICONS[status];
  return (
    <span className={`facility-status ${status}`}>
      <Icon size={18} aria-hidden="true" />
      {label}
    </span>
  );
}
