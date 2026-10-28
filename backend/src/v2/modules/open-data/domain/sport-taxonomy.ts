// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "../../facilities/domain/facility.entity";
export type Sport = Facility["sport"];
export interface SportClassification {
  /** CNID (Censo Nacional de Instalaciones Deportivas, CSD 2005) group of conventional spaces. */
  cnidClass: string;
  /** CNID space type within the group. The census publishes names, not codes. */
  cnidType: string;
  /** Most specific schema.org type for the facility. */
  schemaType: string;
}
/**
 * Initial classification of the sports Quenda knows, aligned with the CNID taxonomy and
 * schema.org. Issue #26 turns it into a per-municipality catalogue that starts from this list.
 */
export const sportTaxonomy: Record<Sport, SportClassification> = {
  padel: {
    cnidClass: "Pistas",
    cnidType: "Pista de pádel",
    schemaType: "SportsActivityLocation",
  },
  tennis: {
    cnidClass: "Pistas",
    cnidType: "Pista de tenis",
    schemaType: "TennisComplex",
  },
  futsal: {
    cnidClass: "Pabellones",
    cnidType: "Pabellón polideportivo",
    schemaType: "SportsActivityLocation",
  },
  swimming: {
    cnidClass: "Vasos de piscina",
    cnidType: "Vaso de piscina cubierta",
    schemaType: "PublicSwimmingPool",
  },
};
