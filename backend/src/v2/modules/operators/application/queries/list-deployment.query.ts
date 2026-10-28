// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  DeploymentRepository,
  StaffMember,
} from "../../domain/deployment.repository";
import {
  Municipalities,
  MunicipalitySettings,
} from "../../../../shared/application/municipality-settings";
import {
  OperatorPrincipal,
  canOperate,
} from "../../../../shared/application/operator-principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export interface DeploymentMunicipality {
  settings: MunicipalitySettings;
  facilities: number;
  activeFacilities: number;
  managers: StaffMember[];
}
@Injectable()
export class ListDeployment {
  constructor(
    private readonly deployment: DeploymentRepository,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: {
    principal: OperatorPrincipal;
  }): Promise<Result<DeploymentMunicipality[], AppError<"forbidden">>> {
    if (!canOperate(args.principal, "deployment:manage"))
      return Result.err(failure("forbidden"));
    const [settings, managers, counts] = await Promise.all([
      this.municipalities.list(),
      this.deployment.managers(),
      this.deployment.facilityCounts(),
    ]);
    return Result.ok(
      settings.map((value) => {
        const count = counts.find((item) => item.tenantId === value.id);
        return {
          settings: value,
          facilities: count?.total ?? 0,
          activeFacilities: count?.active ?? 0,
          managers: managers.filter((item) => item.tenantId === value.id),
        };
      }),
    );
  }
}
