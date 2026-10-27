// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  DeploymentRepository,
  StaffMember,
} from "../../domain/deployment.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import {
  OperatorPrincipal,
  canOperate,
} from "../../../../shared/application/operator-principal";
import { OperatorAudit } from "../../../../shared/application/operator-audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CreateManagerError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"id_reused">;
@Injectable()
export class CreateManager {
  constructor(
    private readonly deployment: DeploymentRepository,
    private readonly municipalities: Municipalities,
    private readonly audit: OperatorAudit,
  ) {}
  async execute(args: {
    principal: OperatorPrincipal;
    municipalityId: string;
    id: string;
    displayName: string;
    email: string;
  }): Promise<Result<StaffMember, CreateManagerError>> {
    if (!canOperate(args.principal, "deployment:manage"))
      return Result.err(failure("forbidden"));
    if (!(await this.municipalities.find(args.municipalityId)))
      return Result.err(failure("not_found"));
    const manager: StaffMember = {
      id: args.id,
      tenantId: args.municipalityId,
      displayName: args.displayName.trim(),
      email: args.email.trim().toLowerCase(),
    };
    const existing = await this.deployment.findUser(args.id);
    if (existing)
      return existing.role === "manager" &&
        existing.tenantId === manager.tenantId &&
        existing.displayName === manager.displayName &&
        existing.email === manager.email
        ? Result.ok(manager)
        : Result.err(failure("id_reused"));
    await this.deployment.createManager(manager);
    await this.audit.record(
      args.principal,
      "manager.created",
      manager.id,
      manager.tenantId,
      { displayName: manager.displayName },
    );
    return Result.ok(manager);
  }
}
