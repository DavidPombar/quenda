// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef } from "react";
import L from "leaflet";
import { useGetMapSettingsQuery } from "@/queries/facilities/get-map-settings.query";
/** Zoom that shows the facility with its street and surroundings. */
const ZOOM = 16;
/**
 * The pages send `Referrer-Policy: same-origin`, so a cross-origin tile request would carry no
 * Referer and OpenStreetMap's tile policy blocks those requests. The tiles alone send this
 * deployment's origin (never the page path, so not which facility is viewed) to the tile server.
 */
export const TILE_REFERRER_POLICY = "strict-origin-when-cross-origin";
export function useFacilityMapController(args: {
  latitude: number;
  longitude: number;
  zoomInLabel: string;
  zoomOutLabel: string;
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
      zoomControl: false,
    });
    // Zoom buttons named in the page's language (WCAG 3.1.2), and an attribution prefix without
    // Leaflet's English tooltip.
    L.control
      .zoom({ zoomInTitle: args.zoomInLabel, zoomOutTitle: args.zoomOutLabel })
      .addTo(map);
    map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com">Leaflet</a>',
    );
    // An empty template (tests, offline installs) still shows the marker without tiles.
    if (tiles.tileUrl)
      L.tileLayer(tiles.tileUrl, {
        maxZoom: 19,
        attribution: tiles.attribution,
        referrerPolicy: TILE_REFERRER_POLICY,
      }).addTo(map);
    // A vector marker needs no image assets and keeps the brand colour. It is only a picture:
    // not focusable and with no hover-only tooltip; the page heading names the place (4.1.2).
    L.circleMarker([args.latitude, args.longitude], {
      radius: 10,
      weight: 3,
      color: "#ffffff",
      fillColor: "#1d5c9a",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map);
    return () => {
      map.remove();
    };
  }, [
    tiles,
    args.latitude,
    args.longitude,
    args.zoomInLabel,
    args.zoomOutLabel,
  ]);
  return {
    container,
    ready: !!tiles,
    openStreetMapUrl: `https://www.openstreetmap.org/?mlat=${args.latitude}&mlon=${args.longitude}#map=18/${args.latitude}/${args.longitude}`,
  };
}
