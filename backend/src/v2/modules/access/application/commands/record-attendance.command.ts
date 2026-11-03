// SPDX-License-Identifier: AGPL-3.0-or-later
import { AccessWindow } from "../access-window";
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AccessRepository } from "../../domain/access.repository";
import type {
  AttendanceOutcome,
  AttendanceStatus,
} from "../../domain/access.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
// Device clocks drift; a mark this far in the future is still accepted.
const CLOCK_SKEW_MINUTES = 5;
export interface AttendanceRequest {
  sessionId: string;
  enrolmentId: string;
  status: AttendanceStatus;
  recordedAt: string;
}
/**
 * Records the roll of activity sessions taken at the gate, possibly queued offline (#97, part D).
 * A mark counts from when the door opens for the session until the end of its local day; the
 * latest mark per person wins, so repeating a batch is harmless. Absences carry no penalty.
 */
@Injectable()
export class RecordAttendance {
  constructor(
    private readonly access: AccessRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly audit: Audit,
    private readonly window: AccessWindow,
  ) {}
  async execute(args: {
    principal: Principal;
    items: readonly AttendanceRequest[];
  }): Promise<
    Result<
      { sessionId: string; enrolmentId: string; outcome: AttendanceOutcome }[],
      AppError<"forbidden"> | AppError<"validation"> | AppError<"not_found">
    >
  > {
    if (!can(args.principal, "access:control"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const marks: { item: AttendanceRequest; at: Temporal.Instant }[] = [];
    for (const item of args.items) {
      try {
        marks.push({ item, at: Temporal.Instant.from(item.recordedAt) });
      } catch {
        return Result.err(failure("validation"));
      }
    }
    const results = [];
    for (const { item, at } of marks)
      results.push({
        sessionId: item.sessionId,
        enrolmentId: item.enrolmentId,
        outcome: await this.record(
          args.principal,
          item,
          at,
          now,
          settings.timezone,
        ),
      });
    return Result.ok(results);
  }
  private async record(
    principal: Principal,
    item: AttendanceRequest,
    at: Temporal.Instant,
    now: Temporal.Instant,
    timezone: string,
  ): Promise<AttendanceOutcome> {
    const session = await this.access.findForAttendance(
      principal.tenantId,
      item.sessionId,
      item.enrolmentId,
    );
    if (!session) return "not_found";
    if (
      session.status === "cancelled" ||
      session.activityStatus !== "published"
    )
      return "cancelled";
    if (!session.enrolled) return "not_enrolled";
    const opens = this.window.of({ ...session, timezone }).from;
    const closes = session.start
      .toZonedDateTimeISO(timezone)
      .toPlainDate()
      .add({ days: 1 })
      .toZonedDateTime({ timeZone: timezone })
      .toInstant();
    if (
      Temporal.Instant.compare(at, opens.subtract({ minutes: 1 })) < 0 ||
      Temporal.Instant.compare(at, closes) >= 0 ||
      Temporal.Instant.compare(at, now.add({ minutes: CLOCK_SKEW_MINUTES })) > 0
    )
      return "out_of_window";
    const saved = await this.access.saveAttendance({
      tenantId: principal.tenantId,
      sessionId: item.sessionId,
      enrolmentId: item.enrolmentId,
      status: item.status,
      recordedAt: at,
      actorId: principal.userId,
    });
    if (!saved) return "stale";
    await this.audit.record(
      principal,
      "activity_attendance.recorded",
      item.sessionId,
      { enrolmentId: item.enrolmentId, status: item.status },
    );
    return "recorded";
  }
}
