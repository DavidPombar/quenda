// SPDX-License-Identifier: AGPL-3.0-or-later
/** One entry of a municipality's sports catalogue (#26), aligned with the CNID taxonomy. */
export interface Sport {
  /** Stable identifier used by facilities, filters and open data. */
  code: string;
  name: { gl: string; es: string };
  /** CNID (Censo Nacional de Instalaciones Deportivas) group of conventional spaces. */
  cnidClass: string;
  /** CNID space type within the group. */
  cnidType: string;
  /** Most specific schema.org type for facilities of this sport. */
  schemaType: string;
  /** Hidden sports are not offered in filters or for new facilities. */
  hidden: boolean;
  position: number;
}
