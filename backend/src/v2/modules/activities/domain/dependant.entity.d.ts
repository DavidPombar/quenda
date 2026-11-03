// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/**
 * A person in an adult's care, such as a child they enrol in activities (#97, part C). Only the
 * first name and the year of birth are kept: enough to tell them apart and to check ages.
 */
export interface Dependant {
  id: string;
  tenantId: string;
  userId: string;
  firstName: string;
  birthYear: number;
  /** The guardianship declaration the adult accepted, and when. */
  declarationVersion: string;
  declaredAt: Temporal.Instant;
  createdAt: Temporal.Instant;
}
