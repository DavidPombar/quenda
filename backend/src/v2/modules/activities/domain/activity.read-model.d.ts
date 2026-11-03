// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { SportArt } from "../../facilities/domain/sport.entity";
import type {
  Activity,
  ActivitySession,
  LocalizedText,
} from "./activity.entity";
/**
 * Whether people can enrol today, by the enrolment dates in the municipality's time zone; `full`
 * is an open period without free places, where enrolling means joining the waiting list.
 */
export type EnrolmentState = "upcoming" | "open" | "full" | "closed";
export interface ActivityPlace {
  facilityName: string;
  facilityAddress: string;
  resourceName: string;
  sportName: LocalizedText;
  sportArt: SportArt;
}
/** An activity as the backoffice lists it. */
export interface ManagedActivity extends Activity, ActivityPlace {
  /** Active sessions that have not started. */
  upcomingSessions: number;
  nextSession: Temporal.Instant | null;
  /** People holding a place, and people waiting for one. */
  enrolled: number;
  waiting: number;
}
/** An activity with its dated sessions, for its page in the backoffice. */
export interface ManagedActivityDetails extends ManagedActivity {
  sessions: ActivitySession[];
}
/** What the public catalogue shows: the published offer, no people. */
export interface PublicActivity
  extends
    Omit<
      Activity,
      "tenantId" | "schedule" | "createdAt" | "publishedAt" | "cancelledAt"
    >,
    ActivityPlace {
  enrolment: EnrolmentState;
  nextSession: Temporal.Instant | null;
  /** Places left and people waiting; counts only, no people. */
  freePlaces: number;
  waiting: number;
}
export interface PublicActivityDetails extends PublicActivity {
  /** Upcoming sessions, cancelled ones included and marked. */
  sessions: ActivitySession[];
}
export interface PublicActivityPage {
  items: PublicActivity[];
  total: number;
  page: number;
  pageSize: number;
}
