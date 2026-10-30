// SPDX-License-Identifier: AGPL-3.0-or-later
/** Illustration and colour of a sport's facilities; other sports use the generic ones. */
export type SportArt = "padel" | "tennis" | "futsal" | "swimming" | "generic";
/**
 * A sport of the municipality's own catalogue (C1, M1). It starts from the CNID list and the
 * municipality can add, hide or rename sports; the code never changes once facilities use it.
 */
export interface Sport {
  code: string;
  nameGl: string;
  nameEs: string;
  /** CNID group of conventional sports spaces. */
  cnidClass: string;
  /** CNID space type; the census publishes names, not codes. */
  cnidType: string;
  /** Most specific schema.org type for its facilities. */
  schemaType: string;
  art: SportArt;
  /** Hidden sports are kept for their facilities but not offered for new ones or as filters. */
  visible: boolean;
  position: number;
}
export interface SportName {
  gl: string;
  es: string;
}
