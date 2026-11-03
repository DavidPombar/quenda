// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { ActivityEnrolment, EnrolmentStatus } from "./enrolment.entity";
import type {
  ManagedEnrolment,
  ManagedEnrolmentPage,
  MyEnrolment,
} from "./enrolment.read-model";
export const ENROLMENT_PAGE_SIZE = 25;
/**
 * Changes to an activity's enrolments are serialised by locking the activity row first
 * (`ActivityRepository.find`); these reads take no lock of their own.
 */
export abstract class EnrolmentRepository {
  /** Null when it does not exist in the municipality. */
  abstract find(
    tenantId: string,
    id: string,
  ): Promise<ActivityEnrolment | null>;
  /** The person's enrolled or waiting enrolment in the activity. */
  abstract findOpen(
    tenantId: string,
    activityId: string,
    userId: string,
  ): Promise<ActivityEnrolment | null>;
  /** Open enrolments of the activity, enrolled first, then waiting in order of arrival. */
  abstract open(
    tenantId: string,
    activityId: string,
  ): Promise<ActivityEnrolment[]>;
  abstract add(enrolment: ActivityEnrolment): Promise<void>;
  abstract save(enrolment: ActivityEnrolment): Promise<void>;
  /** Open enrolments of a person (account deletion). */
  abstract openOfUser(
    tenantId: string,
    userId: string,
  ): Promise<ActivityEnrolment[]>;
  abstract mine(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ): Promise<MyEnrolment[]>;
  abstract page(args: {
    tenantId: string;
    activityId: string;
    status?: Extract<EnrolmentStatus, "enrolled" | "waiting">;
    page: number;
    size: number;
  }): Promise<ManagedEnrolmentPage>;
  /** Every enrolment of the activity, open ones first, for the CSV. */
  abstract all(
    tenantId: string,
    activityId: string,
  ): Promise<ManagedEnrolment[]>;
  abstract activityExists(tenantId: string, id: string): Promise<boolean>;
  /** Whether anyone ever enrolled: their notices and calendars refer to its sessions. */
  abstract hasAny(tenantId: string, activityId: string): Promise<boolean>;
  /** The given sessions with their activity, for the notices of a cancellation. */
  abstract sessions(
    tenantId: string,
    ids: readonly string[],
  ): Promise<{ id: string; activityId: string; start: Temporal.Instant }[]>;
}
