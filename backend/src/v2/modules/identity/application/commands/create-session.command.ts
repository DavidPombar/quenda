// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../domain/session.repository";
import { ConsentRepository } from "../../../account/domain/consent.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
import { Principal } from "../../../../shared/application/principal";
export type CreateSessionError =
  | AppError<"demo_disabled">
  | AppError<"not_found">
  | AppError<"consent_required">;
const demoCitizenName = "Alex · conta de proba";
@Injectable()
export class CreateSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly consents: ConsentRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    slug: string;
    role: "citizen" | "manager";
    legalVersion?: string;
  }): Promise<
    Result<{ token: string; principal: Principal }, CreateSessionError>
  > {
    if (process.env.DEMO_MODE !== "true")
      return Result.err(failure("demo_disabled"));
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const consentGiven = args.legalVersion === municipality.legalVersion;
    if (args.role === "citizen" && !consentGiven)
      return Result.err(failure("consent_required"));
    let principal = await this.sessions.findDemoUser(
      municipality.id,
      args.role,
    );
    // The demo citizen may have deleted their account; a fresh synthetic one keeps the demo usable.
    if (!principal && args.role === "citizen")
      principal = await this.sessions.createDemoUser({
        id: this.ids.next(),
        tenantId: municipality.id,
        role: "citizen",
        displayName: demoCitizenName,
        // Synthetic address at a reserved domain, so demo notices land in the local mail catcher.
        email: `alex@${municipality.slug}.example`,
      });
    if (!principal) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const token = await this.sessions.create(principal, now.add({ hours: 8 }));
    if (args.role === "citizen") {
      await this.consents.add({
        id: this.ids.next(),
        tenantId: municipality.id,
        userId: principal.userId,
        legalVersion: municipality.legalVersion,
        acceptedAt: now,
      });
      await this.audit.record(principal, "consent.accepted", principal.userId, {
        legalVersion: municipality.legalVersion,
      });
    }
    return Result.ok({ token, principal });
  }
}
