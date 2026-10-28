// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  OperatorGuard,
  CurrentOperator,
} from "../../../../../shared/infrastructure/api/operator.guard";
import { OperatorPrincipal } from "../../../../../shared/application/operator-principal";
import { ListDeployment } from "../../../application/queries/list-deployment.query";
import { DeploymentMunicipalityResponseDTO } from "../dto/deployment-municipality.response.dto";
@V2Controller("operator/municipalities")
@UseGuards(OperatorGuard)
export class ListDeploymentController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(ListDeployment);
  }
  @Get()
  @ApiOperation({ summary: "ListDeployment" })
  @ApiOkResponse({ type: DeploymentMunicipalityResponseDTO, isArray: true })
  async handle(@CurrentOperator() principal: OperatorPrincipal) {
    return (await this.operation.execute({ principal })).fold(
      (values) => values.map(DeploymentMunicipalityResponseDTO.from),
      (error) => {
        throw new ProblemException(403, error);
      },
    );
  }
}
