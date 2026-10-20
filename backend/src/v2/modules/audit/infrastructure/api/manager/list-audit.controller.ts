// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  ListAudit,
  ListAuditError,
} from "../../../application/queries/list-audit.query";
import { AuditQueryRequestDTO } from "../dto/audit-query.request.dto";
import { AuditEventResponseDTO } from "../dto/audit-event.response.dto";
@V2Controller("manager/audit")
@UseGuards(PrincipalGuard)
export class ListAuditController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(ListAudit);
  }
  @Get()
  @ApiOkResponse({ type: AuditEventResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Query() query: AuditQueryRequestDTO,
  ): Promise<AuditEventResponseDTO[]> {
    return (
      await this.operation.execute({
        principal,
        from: query.from,
        to: query.to,
        action: query.action,
        limit: query.limit,
      })
    ).fold(
      (values) => values.map(AuditEventResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: ListAuditError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
