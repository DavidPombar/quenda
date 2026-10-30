// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Sport, SportArt } from "./sport.entity";
export const SPORT_CODE = /^[a-z0-9-]{2,40}$/;
export const SPORT_ARTS: readonly SportArt[] = [
  "padel",
  "tennis",
  "futsal",
  "swimming",
  "generic",
];
export abstract class SportRepository {
  /** The municipality's whole catalogue, ordered by position and code. */
  abstract list(tenantId: string): Promise<Sport[]>;
  /**
   * Visible sports that at least one facility of the given municipalities (all of the deployment
   * when empty) offers, one per code, so the filters never lead to an empty result; names come from
   * the first municipality, alphabetically, that shows the sport.
   */
  abstract visible(slugs: readonly string[]): Promise<Sport[]>;
  abstract find(tenantId: string, code: string): Promise<Sport | null>;
  abstract save(tenantId: string, sport: Sport): Promise<void>;
  /** Whether a facility or a club of the municipality uses the sport. */
  abstract inUse(tenantId: string, code: string): Promise<boolean>;
  abstract remove(tenantId: string, code: string): Promise<boolean>;
}
