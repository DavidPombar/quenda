// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Sport } from "./sport.entity";
export const SPORT_CODE = /^[a-z0-9-]{2,40}$/;
export abstract class SportRepository {
  /** The municipality's whole catalogue, ordered by position and code. */
  abstract list(tenantId: string): Promise<Sport[]>;
  /**
   * Visible sports of the given municipalities (all of the deployment when empty), one per code;
   * names come from the first municipality, alphabetically, that shows the sport.
   */
  abstract visible(slugs: readonly string[]): Promise<Sport[]>;
  abstract find(tenantId: string, code: string): Promise<Sport | null>;
  abstract save(tenantId: string, sport: Sport): Promise<void>;
}
