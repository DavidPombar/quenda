// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { LocalizedText } from "./activity.entity";
import type { ActivityEnrolment, EnrolmentStatus } from "./enrolment.entity";
/** An enrolment as the person sees it in their account. */
export interface MyEnrolment {
  id: string;
  activityId: string;
  activityName: LocalizedText;
  activityStatus: "draft" | "published" | "cancelled";
  facilityId: string;
  facilityName: string;
  resourceName: string;
  status: EnrolmentStatus;
  /** Place in the waiting list, from 1; null unless waiting. */
  position: number | null;
  createdAt: Temporal.Instant;
  enrolledAt: Temporal.Instant | null;
  endedAt: Temporal.Instant | null;
  /** First active session that has not started. */
  nextSession: Temporal.Instant | null;
  /** Sessions cancelled that had not started when enrolling. */
  cancelledSessions: number;
}
/** An enrolment as the municipality lists it, with the person's contact. */
export interface ManagedEnrolment extends Omit<
  ActivityEnrolment,
  "tenantId" | "activityId"
> {
  position: number | null;
  name: string;
  email: string | null;
}
export interface ManagedEnrolmentPage {
  items: ManagedEnrolment[];
  total: number;
  page: number;
  pageSize: number;
}
