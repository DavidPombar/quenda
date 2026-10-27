// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OperatorSessionRepository } from "../../domain/operator-session.repository";
import { OperatorPrincipal } from "../../../../shared/application/operator-principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CreateOperatorSessionError =
  AppError<"demo_disabled"> | AppError<"not_found">;
@Injectable()
export class CreateOperatorSession {
  constructor(
    private readonly sessions: OperatorSessionRepository,
    private readonly clock: Clock,
  ) {}
  async execute(
    _args: Record<string, never>,
  ): Promise<
    Result<
      { token: string; principal: OperatorPrincipal },
      CreateOperatorSessionError
    >
  > {
    // Like tenant sessions, only the demo sign-in exists until an identity provider lands (#36).
    if (process.env.DEMO_MODE !== "true")
      return Result.err(failure("demo_disabled"));
    const principal = await this.sessions.findDemoOperator();
    if (!principal) return Result.err(failure("not_found"));
    const token = await this.sessions.create(
      principal,
      this.clock.now().add({ hours: 8 }),
    );
    return Result.ok({ token, principal });
  }
}
