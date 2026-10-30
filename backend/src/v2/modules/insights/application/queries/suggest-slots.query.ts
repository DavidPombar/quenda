// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { FacilityRepository } from "../../../facilities/domain/facility.repository";
import { ResourceRepository } from "../../../facilities/domain/resource.repository";
import { AvailabilityGrid } from "../../../facilities/application/availability-grid";
import { OccupancyHistory } from "../occupancy-history";
import {
  Recommender,
  SlotCandidate,
  Suggestion,
} from "../../domain/slot-recommender";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Alternatives offered when the wanted slot or day is full (#25). */
export const SUGGESTION_LIMIT = 3;
export interface SlotSuggestion extends Suggestion {
  facilityName: string;
  resourceName: string;
}
export type SuggestSlotsError = AppError<"not_found"> | AppError<"validation">;
/**
 * Free slots on the same day, in the facility the person was looking at and in the municipality's
 * other active facilities of the same sport, ranked by their usual occupancy. Only aggregated,
 * anonymous history is used; nothing leaves the server.
 */
@Injectable()
export class SuggestSlots {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly resources: ResourceRepository,
    private readonly grid: AvailabilityGrid,
    private readonly history: OccupancyHistory,
    private readonly recommender: Recommender,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    facilityId: string;
    date: string;
    around?: string;
  }): Promise<Result<SlotSuggestion[], SuggestSlotsError>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const origin = await this.facilities.find(municipality.id, args.facilityId);
    if (!origin) return Result.err(failure("not_found"));
    let date: Temporal.PlainDate;
    let around: Temporal.Instant | null = null;
    try {
      date = Temporal.PlainDate.from(args.date, { overflow: "reject" });
      if (args.around !== undefined)
        around = Temporal.Instant.from(args.around);
    } catch {
      return Result.err(failure("validation"));
    }
    const timezone = municipality.timezone;
    const now = this.clock.now();
    const [facilities, resources, history] = await Promise.all([
      this.facilities.list(municipality.id),
      this.resources.listByTenant(municipality.id),
      this.history.usual(municipality),
    ]);
    const nearby = facilities.filter(
      (facility) =>
        facility.status === "active" && facility.sport === origin.sport,
    );
    const candidates: SlotCandidate[] = [];
    for (const facility of nearby) {
      const own = resources.filter(
        (resource) => resource.facilityId === facility.id,
      );
      for (const { resource, slots } of await this.grid.day({
        municipality,
        facility,
        resources: own,
        date,
        now,
      }))
        for (const slot of slots) {
          if (slot.status !== "available") continue;
          const local = slot.start.toZonedDateTimeISO(timezone);
          candidates.push({
            facilityId: facility.id,
            resourceId: resource.id,
            start: slot.start,
            end: slot.end,
            weekday: local.dayOfWeek,
            hour: local.hour,
          });
        }
    }
    const suggestions = this.recommender.recommend({
      facilityId: origin.id,
      around,
      candidates,
      history,
      limit: SUGGESTION_LIMIT,
    });
    return Result.ok(
      suggestions.map((suggestion) => ({
        ...suggestion,
        facilityName:
          nearby.find((facility) => facility.id === suggestion.facilityId)
            ?.name ?? "",
        resourceName:
          resources.find((resource) => resource.id === suggestion.resourceId)
            ?.name ?? "",
      })),
    );
  }
}
