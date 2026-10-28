// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { RecordCheckIns } from "../../../application/commands/record-check-ins.command";
import { CheckInsRequestDTO } from "../dto/check-ins.request.dto";
import { CheckInsResponseDTO } from "../dto/check-ins.response.dto";
@V2Controller("access/check-ins")
@UseGuards(PrincipalGuard)
export class RecordCheckInsController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RecordCheckIns);
  }
  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: "RecordCheckIns" })
  @ApiResponse({ status: 200, type: CheckInsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: CheckInsRequestDTO,
  ): Promise<CheckInsResponseDTO> {
    const result = await this.operation.execute({
      principal,
      items: body.items,
    });
    return result.fold((results) => ({ results }), this.handleError);
  }
  private handleError(
    this: void,
    error:
      AppError<"forbidden"> | AppError<"validation"> | AppError<"not_found">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "validation":
        throw new ProblemException(400, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
