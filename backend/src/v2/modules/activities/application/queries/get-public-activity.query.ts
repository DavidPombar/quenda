// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { PublicActivityDetails } from "../../domain/activity.read-model";
import { enrolmentState } from "../activity-input";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** A published or cancelled activity with its upcoming sessions; drafts stay private (#97). */
@Injectable()
export class GetPublicActivity {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    id: string;
  }): Promise<Result<PublicActivityDetails, AppError<"not_found">>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const details = await this.activities.publicDetails(
      municipality.id,
      args.id,
      now,
    );
    if (!details) return Result.err(failure("not_found"));
    const today = now.toZonedDateTimeISO(municipality.timezone).toPlainDate();
    return Result.ok({
      ...details,
      enrolment:
        details.status === "cancelled"
          ? "closed"
          : enrolmentState(details, today),
    });
  }
}
