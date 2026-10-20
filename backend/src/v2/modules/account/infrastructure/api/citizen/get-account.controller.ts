// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  GetAccount,
  GetAccountError,
} from "../../../application/queries/get-account.query";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { AccountResponseDTO } from "../dto/account.response.dto";
@V2Controller("citizen/me")
@UseGuards(PrincipalGuard)
export class GetAccountController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetAccount);
  }
  @Get()
  @ApiOperation({ summary: "GetAccount" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: AccountResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<AccountResponseDTO> {
    const result = await this.operation.execute({ principal });
    return result.fold(AccountResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: GetAccountError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
