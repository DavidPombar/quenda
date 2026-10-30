// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { appManifest } from "../../domain/app-manifest";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class GetAppManifest {
  constructor(private readonly municipalities: Municipalities) {}
  async execute(args: {
    slug: string;
  }): Promise<Result<ReturnType<typeof appManifest>, AppError<"not_found">>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    return municipality
      ? Result.ok(appManifest(municipality))
      : Result.err(failure("not_found"));
  }
}
