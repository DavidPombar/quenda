// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { Campaign } from "../../domain/season.read-model";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Campaigns still open, with their published criteria, for transparency (#17). */
@Injectable()
export class ListPublicCampaigns {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
  }): Promise<Result<Campaign[], AppError<"not_found">>> {
    const settings = await this.municipalities.findBySlug(args.slug);
    if (!settings) return Result.err(failure("not_found"));
    const today = this.clock
      .now()
      .toZonedDateTimeISO(settings.timezone)
      .toPlainDate()
      .toString();
    return Result.ok(await this.seasons.currentCampaigns(settings.id, today));
  }
}
