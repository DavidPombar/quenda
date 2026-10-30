// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef } from "react";
import L from "leaflet";
import { useGetMapSettingsQuery } from "@/queries/facilities/get-map-settings.query";
/** Zoom that shows the facility with its street and surroundings. */
const ZOOM = 16;
export function useFacilityMapController(args: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const settings = useGetMapSettingsQuery();
  const tiles = settings.data;
  useEffect(() => {
    if (!container.current || !tiles) return;
    const map = L.map(container.current, {
      center: [args.latitude, args.longitude],
      zoom: ZOOM,
      scrollWheelZoom: false,
      keyboard: true,
    });
    // An empty template (tests, offline installs) still shows the marker without tiles.
    if (tiles.tileUrl)
      L.tileLayer(tiles.tileUrl, {
        maxZoom: 19,
        attribution: tiles.attribution,
      }).addTo(map);
    // A vector marker needs no image assets and keeps the brand colour.
    L.circleMarker([args.latitude, args.longitude], {
      radius: 10,
      weight: 3,
      color: "#ffffff",
      fillColor: "#1d5c9a",
      fillOpacity: 1,
    })
      .bindTooltip(args.name)
      .addTo(map);
    return () => {
      map.remove();
    };
  }, [tiles, args.latitude, args.longitude, args.name]);
  return {
    container,
    ready: !!tiles,
    openStreetMapUrl: `https://www.openstreetmap.org/?mlat=${args.latitude}&mlon=${args.longitude}#map=18/${args.latitude}/${args.longitude}`,
  };
}
