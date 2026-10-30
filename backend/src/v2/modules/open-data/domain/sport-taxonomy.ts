// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Classification of a sport in the municipality's catalogue (#26), aligned with the CNID taxonomy
 * and schema.org. The initial catalogue is in migration 0014.
 */
export interface SportClassification {
  /** CNID (Censo Nacional de Instalaciones Deportivas, CSD 2005) group of conventional spaces. */
  cnidClass: string;
  /** CNID space type within the group. The census publishes names, not codes. */
  cnidType: string;
  /** Most specific schema.org type for the facility. */
  schemaType: string;
}
