// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { CampaignInput, validCampaign } from "../campaign-input";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type SaveCampaignError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/**
 * Opens or edits a season campaign: its dates (school year, calendar year…), the facilities it
 * covers and its published priority criteria. Several campaigns may share a facility.
 */
@Injectable()
export class SaveCampaign {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id?: string;
    input: CampaignInput;
  }): Promise<Result<{ id: string }, SaveCampaignError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    if (!validCampaign(args.input)) return Result.err(failure("validation"));
    const facilityIds = [...new Set(args.input.facilityIds)];
    const known = await this.seasons.existingFacilities(tenantId, facilityIds);
    if (known.length !== facilityIds.length)
      return Result.err(failure("validation"));
    const existing = args.id
      ? await this.seasons.findCampaign(tenantId, args.id)
      : null;
    if (args.id && !existing) return Result.err(failure("not_found"));
    const id = existing?.id ?? this.ids.next();
    await this.seasons.saveCampaign({
      id,
      tenantId,
      name: args.input.name.trim(),
      startsOn: args.input.startsOn,
      endsOn: args.input.endsOn,
      criteriaGl: args.input.criteria.gl.trim(),
      criteriaEs: args.input.criteria.es.trim(),
      facilityIds,
      createdAt: existing?.createdAt ?? this.clock.now(),
    });
    await this.audit.record(
      args.principal,
      existing ? "season_campaign.updated" : "season_campaign.created",
      id,
      {
        name: args.input.name.trim(),
        startsOn: args.input.startsOn,
        endsOn: args.input.endsOn,
        facilityIds,
      },
    );
    return Result.ok({ id });
  }
}
