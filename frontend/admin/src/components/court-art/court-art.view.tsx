// SPDX-License-Identifier: AGPL-3.0-or-later
import tennis from "@/assets/illustrations/facility-tennis.svg";
import padel from "@/assets/illustrations/facility-padel.svg";
import futsal from "@/assets/illustrations/facility-futsal.svg";
import swimming from "@/assets/illustrations/facility-swimming.svg";
import generic from "@/assets/illustrations/facility-generic.svg";
import maintenance from "@/assets/illustrations/facility-maintenance.svg";
import type { Facility } from "@/types/models";
const ART: Record<string, string> = { tennis, padel, futsal, swimming };
// Decorative aerial view of the facility; the name and status are always given as text nearby.
export function CourtArt({
  sport,
  status = "active",
}: {
  sport: Facility["sport"];
  status?: Facility["status"];
}) {
  return (
    <div className={`court-art court-art-${status}`} aria-hidden="true">
      <img src={ART[sport] ?? generic} alt="" draggable={false} />
      {status === "maintenance" && (
        <img className="court-art-overlay" src={maintenance} alt="" />
      )}
    </div>
  );
}
