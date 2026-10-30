// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { FacilityRepository } from "../../domain/facility.repository";
import { ResourceRepository } from "../../domain/resource.repository";
import { AvailabilityGrid, ResourceAvailability } from "../availability-grid";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type {
  AvailabilitySlot,
  ResourceAvailability,
} from "../availability-grid";
export interface Availability {
  resources: ResourceAvailability[];
}
export type GetAvailabilityError =
  AppError<"not_found"> | AppError<"validation">;
@Injectable()
export class GetAvailability {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly resources: ResourceRepository,
    private readonly municipalities: Municipalities,
    private readonly grid: AvailabilityGrid,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    id: string;
    date: string;
  }): Promise<Result<Availability, GetAvailabilityError>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const facility = await this.facilities.find(municipality.id, args.id);
    if (!facility) return Result.err(failure("not_found"));
    let date: Temporal.PlainDate;
    try {
      date = Temporal.PlainDate.from(args.date);
    } catch {
      return Result.err(failure("validation"));
    }
    return Result.ok({
      resources: await this.grid.day({
        municipality,
        facility,
        resources: await this.resources.listByFacility(
          municipality.id,
          facility.id,
        ),
        date,
        now: this.clock.now(),
      }),
    });
  }
}
