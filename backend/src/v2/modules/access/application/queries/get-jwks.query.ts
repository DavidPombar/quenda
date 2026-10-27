// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccessKeyRepository } from "../../domain/access-key.repository";
import { AccessKey } from "../../domain/access.read-model";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Retired keys stay published this long so passes issued before a rotation keep working. */
export const RETIRED_KEY_HOURS = 48;
@Injectable()
export class GetJwks {
  constructor(
    private readonly keys: AccessKeyRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
  }): Promise<Result<AccessKey[], AppError<"not_found">>> {
    const settings = await this.municipalities.findBySlug(args.slug);
    if (!settings) return Result.err(failure("not_found"));
    return Result.ok(
      await this.keys.published(
        settings.id,
        this.clock.now().subtract({ hours: RETIRED_KEY_HOURS }),
      ),
    );
  }
}
