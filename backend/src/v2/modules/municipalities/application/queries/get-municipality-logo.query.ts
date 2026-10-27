// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { MunicipalitySettingsRepository } from "../../domain/municipality-settings.repository";
import { Logo } from "../../domain/logo";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class GetMunicipalityLogo {
  constructor(private readonly settings: MunicipalitySettingsRepository) {}
  async execute(args: {
    slug: string;
  }): Promise<Result<Logo & { version: string }, AppError<"not_found">>> {
    const logo = await this.settings.findLogo(args.slug);
    return logo ? Result.ok(logo) : Result.err(failure("not_found"));
  }
}
