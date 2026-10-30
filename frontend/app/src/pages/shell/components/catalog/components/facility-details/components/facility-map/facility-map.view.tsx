// SPDX-License-Identifier: AGPL-3.0-or-later
import "leaflet/dist/leaflet.css";
import { PiArrowSquareOut } from "react-icons/pi";
import { useFacilityMapController } from "./facility-map.controller";
// The map adds context for sighted people; the address next to it is the text alternative and the
// link opens the place in OpenStreetMap.
export function FacilityMap(props: {
  latitude: number;
  longitude: number;
  name: string;
  label: string;
  openLabel: string;
}) {
  const c = useFacilityMapController(props);
  return (
    <div className="facility-map">
      <div
        ref={c.container}
        className="facility-map-canvas"
        role="region"
        aria-label={props.label}
      />
      <a
        className="text-link"
        href={c.openStreetMapUrl}
        target="_blank"
        rel="noreferrer"
      >
        {props.openLabel}
        <PiArrowSquareOut size={16} aria-hidden="true" />
      </a>
    </div>
  );
}
