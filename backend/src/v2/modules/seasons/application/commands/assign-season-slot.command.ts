// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { SeasonRepository } from "../../domain/season.repository";
import { Allocation, SeasonConflict } from "../../domain/season.read-model";
import { expandOccurrences } from "../../domain/season-occurrences";
import { units } from "../../../facilities/domain/resource-units";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type AssignSeasonSlotError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"resource_unavailable">;
export interface SeasonSlotInput {
  campaignId: string;
  organizationId: string;
  facilityId: string;
  resourceId: string;
  weekdays: number[];
  startsLocal: string;
  endsLocal: string;
  reason: string;
}
/**
 * Gives a club a weekly slot for a campaign (#17). Every future date occupies the court like a
 * booking; dates already taken by a one-off booking or another club are kept as conflicts for the
 * manager to resolve, and the rest of the assignment is saved.
 */
@Injectable()
export class AssignSeasonSlot {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    input: SeasonSlotInput;
  }): Promise<
    Result<
      { allocation: Allocation; created: number; conflicts: SeasonConflict[] },
      AssignSeasonSlotError
    >
  > {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const input = args.input;
    const reason = input.reason.trim();
    let startsLocal: Temporal.PlainTime;
    let endsLocal: Temporal.PlainTime;
    try {
      startsLocal = Temporal.PlainTime.from(input.startsLocal);
      endsLocal = Temporal.PlainTime.from(input.endsLocal);
    } catch {
      return Result.err(failure("validation"));
    }
    const weekdays = [...new Set(input.weekdays)].sort();
    if (
      !reason ||
      !weekdays.length ||
      weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7) ||
      Temporal.PlainTime.compare(startsLocal, endsLocal) >= 0
    )
      return Result.err(failure("validation"));
    const settings = await this.municipalities.find(tenantId);
    const campaign = await this.seasons.findCampaign(
      tenantId,
      input.campaignId,
    );
    const organization = await this.seasons.findOrganization(
      tenantId,
      input.organizationId,
    );
    if (!settings || !campaign || !organization)
      return Result.err(failure("not_found"));
    if (
      organization.archivedAt ||
      !campaign.facilityIds.includes(input.facilityId)
    )
      return Result.err(failure("validation"));
    if (!(await this.seasons.lockFacility(tenantId, input.facilityId)))
      return Result.err(failure("not_found"));
    const resources = await this.seasons.resources(tenantId, input.facilityId);
    const resource = resources.find((item) => item.id === input.resourceId);
    if (!resource) return Result.err(failure("not_found"));
    if (!resource.active) return Result.err(failure("resource_unavailable"));
    const now = this.clock.now();
    // Dates already past when the slot is assigned are not created.
    const occurrences = expandOccurrences({
      startsOn: Temporal.PlainDate.from(campaign.startsOn),
      endsOn: Temporal.PlainDate.from(campaign.endsOn),
      weekdays,
      startsLocal,
      endsLocal,
      timezone: settings.timezone,
    }).filter((item) => Temporal.Instant.compare(item.start, now) > 0);
    if (!occurrences.length) return Result.err(failure("validation"));
    const id = this.ids.next();
    await this.seasons.addAllocation({
      id,
      tenantId,
      campaignId: campaign.id,
      organizationId: organization.id,
      facilityId: input.facilityId,
      resourceId: resource.id,
      weekdays,
      startsLocal: startsLocal.toString({ smallestUnit: "minute" }),
      endsLocal: endsLocal.toString({ smallestUnit: "minute" }),
      reason,
      createdBy: args.principal.userId,
      createdAt: now,
    });
    const unitIds = units(resource, resources);
    const conflicts: SeasonConflict[] = [];
    for (const occurrence of occurrences) {
      const occurrenceId = this.ids.next();
      const stored = await this.seasons.addOccurrence({
        id: occurrenceId,
        tenantId,
        allocationId: id,
        unitIds,
        ...occurrence,
      });
      if (stored.conflict)
        conflicts.push({
          occurrenceId,
          ...occurrence,
          bookingId: stored.bookingId,
        });
    }
    const created = occurrences.length - conflicts.length;
    await this.audit.record(args.principal, "season_allocation.created", id, {
      organizationId: organization.id,
      campaignId: campaign.id,
      facilityId: input.facilityId,
      resourceId: resource.id,
      weekdays,
      startsLocal: input.startsLocal,
      endsLocal: input.endsLocal,
      reason,
      created,
      conflicts: conflicts.length,
    });
    const allocation = await this.seasons.getAllocation(tenantId, id);
    if (!allocation) return Result.err(failure("not_found"));
    return Result.ok({ allocation, created, conflicts });
  }
}
