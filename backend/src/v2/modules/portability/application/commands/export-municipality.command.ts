// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { PortabilityRepository } from "../../domain/portability.repository";
import { MunicipalityExport } from "../../domain/municipality-snapshot.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ExportMunicipalityError =
  AppError<"forbidden"> | AppError<"not_found">;
/**
 * A command rather than a query: exporting personal data is recorded in the
 * audit trail, and that write must commit with the read it describes.
 */
@Injectable()
export class ExportMunicipality {
  constructor(
    private readonly repository: PortabilityRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<MunicipalityExport, ExportMunicipalityError>> {
    if (!can(args.principal, "data:export"))
      return Result.err(failure("forbidden"));
    const snapshot = await this.repository.snapshot(args.principal.tenantId);
    if (!snapshot) return Result.err(failure("not_found"));
    await this.audit.record(
      args.principal,
      "municipality.exported",
      args.principal.tenantId,
    );
    return Result.ok({ exportedAt: this.clock.now(), snapshot });
  }
}
