// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  GetCredential,
  GetCredentialError,
} from "../../../application/queries/get-credential.query";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { CredentialResponseDTO } from "../dto/credential.response.dto";
@V2Controller("citizen/bookings")
@UseGuards(PrincipalGuard)
export class GetCredentialController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetCredential);
  }
  @Get(":id/credential")
  @ApiOperation({ summary: "GetCredential" })
  @ApiOkResponse({ type: CredentialResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
  ): Promise<CredentialResponseDTO> {
    return (await this.operation.execute({ principal, id: path.id })).fold(
      CredentialResponseDTO.from,
      this.handleError,
    );
  }
  private handleError(this: void, error: GetCredentialError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "credential_unavailable":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
