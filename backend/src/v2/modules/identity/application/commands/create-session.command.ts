// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../domain/session.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
import { Principal } from "../../../../shared/application/principal";
export type CreateSessionError =
  AppError<"demo_disabled"> | AppError<"not_found">;
@Injectable()
export class CreateSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    role: "citizen" | "manager";
  }): Promise<
    Result<{ token: string; principal: Principal }, CreateSessionError>
  > {
    if (process.env.DEMO_MODE !== "true")
      return Result.err(failure("demo_disabled"));
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const principal = await this.sessions.findDemoUser(
      municipality.id,
      args.role,
    );
    if (!principal) return Result.err(failure("not_found"));
    const token = await this.sessions.create(
      principal,
      this.clock.now().add({ hours: 8 }),
    );
    return Result.ok({ token, principal });
  }
}
