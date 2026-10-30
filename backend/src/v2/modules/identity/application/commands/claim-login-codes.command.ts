// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  LoginCodeRepository,
  PendingLoginCode,
} from "../../domain/login-code.repository";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
/** Leases codes to mail: one just requested, or any left unsent by a failure. */
@Injectable()
export class ClaimLoginCodes {
  constructor(
    private readonly codes: LoginCodeRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    id?: string;
    limit: number;
  }): Promise<Result<PendingLoginCode[], never>> {
    return Result.ok(
      await this.codes.claim({
        id: args.id,
        now: this.clock.now(),
        limit: args.limit,
      }),
    );
  }
}
