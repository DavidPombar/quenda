// SPDX-License-Identifier: AGPL-3.0-or-later
import type { MunicipalitySettings } from "../../../shared/application/municipality-settings";
/** Quenda's own colour and icons, for councils without a colour or an icon of their own. */
const DEFAULT_COLOR = "#1f5b43";
const DEFAULT_ICONS = [
  { src: "/app/icon-192.png", sizes: "192x192", type: "image/png" },
  { src: "/app/icon-512.png", sizes: "512x512", type: "image/png" },
  {
    src: "/app/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];
/**
 * Web app manifest of the council's citizen app, so it installs with the council's name,
 * colour and icon (#24). Each council is a separate app: its id and start page carry the slug.
 */
export function appManifest(
  value: Pick<
    MunicipalitySettings,
    "slug" | "name" | "locale" | "primaryColor" | "iconVersion"
  >,
) {
  const start = `/app/${value.slug}/`;
  const icon = value.iconVersion
    ? `/v2/public/municipalities/${value.slug}/icon?v=${value.iconVersion}`
    : null;
  return {
    id: start,
    name: `${value.name}: reservas`,
    short_name: value.name,
    lang: value.locale,
    start_url: start,
    scope: "/app/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: value.primaryColor || DEFAULT_COLOR,
    // The icon is drawn with a safe margin, so it also serves as the maskable one.
    icons: icon
      ? [
          { src: icon, sizes: "512x512", type: "image/png" },
          {
            src: icon,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ]
      : DEFAULT_ICONS,
  };
}
