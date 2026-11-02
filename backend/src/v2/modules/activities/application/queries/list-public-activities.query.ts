// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  ActivityFilters,
  ActivityRepository,
} from "../../domain/activity.repository";
import { PublicActivityPage } from "../../domain/activity.read-model";
import { enrolmentState } from "../activity-input";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** One page of a municipality's published activities that have not ended (C1, #97). */
@Injectable()
export class ListPublicActivities {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    filters: ActivityFilters;
    page: number;
    pageSize: number;
  }): Promise<Result<PublicActivityPage, AppError<"not_found">>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const today = now.toZonedDateTimeISO(municipality.timezone).toPlainDate();
    const found = await this.activities.search({
      tenantId: municipality.id,
      filters: args.filters,
      today: today.toString(),
      now,
      page: args.page,
      size: args.pageSize,
    });
    return Result.ok({
      items: found.items.map((item) => ({
        ...item,
        enrolment: enrolmentState(item, today),
      })),
      total: found.total,
      page: args.page,
      pageSize: args.pageSize,
    });
  }
}
