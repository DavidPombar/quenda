// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { LoginCodeRepository } from "../../domain/login-code.repository";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
/** Records the outcome of mailing a code; once sent, the address and the code are forgotten. */
@Injectable()
export class CompleteLoginCode {
  constructor(
    private readonly codes: LoginCodeRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    id: string;
    error?: string;
  }): Promise<Result<void, never>> {
    if (args.error) await this.codes.markFailed(args.id, args.error);
    else await this.codes.markSent(args.id, this.clock.now());
    return Result.ok();
  }
}
