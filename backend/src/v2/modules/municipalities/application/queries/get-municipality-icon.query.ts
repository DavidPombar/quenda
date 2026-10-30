// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { MunicipalitySettingsRepository } from "../../domain/municipality-settings.repository";
import { Icon } from "../../domain/logo";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class GetMunicipalityIcon {
  constructor(private readonly settings: MunicipalitySettingsRepository) {}
  async execute(args: {
    slug: string;
  }): Promise<Result<Icon & { version: string }, AppError<"not_found">>> {
    const icon = await this.settings.findIcon(args.slug);
    return icon ? Result.ok(icon) : Result.err(failure("not_found"));
  }
}
