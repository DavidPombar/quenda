// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
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
  ListAccessKeys,
  ListAccessKeysError,
} from "../../../application/queries/list-access-keys.query";
import { AccessKeysResponseDTO } from "../dto/access-keys.response.dto";
@V2Controller("access/keys")
@UseGuards(PrincipalGuard)
export class ListAccessKeysController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(ListAccessKeys);
  }
  @Get()
  @ApiOperation({ summary: "ListAccessKeys" })
  @ApiOkResponse({ type: AccessKeysResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<AccessKeysResponseDTO> {
    return (await this.operation.execute({ principal })).fold(
      AccessKeysResponseDTO.from,
      this.handleError,
    );
  }
  private handleError(this: void, error: ListAccessKeysError): never {
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
