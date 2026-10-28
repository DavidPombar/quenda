// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Req } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
import type { Request } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { operatorSessionToken } from "../../../../../shared/infrastructure/api/operator.guard";
import { GetOperatorSession } from "../../../application/queries/get-operator-session.query";
import { CurrentOperatorSessionResponseDTO } from "../dto/operator-session.response.dto";
@V2Controller("public/operator-session")
export class GetOperatorSessionController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetOperatorSession);
  }
  @Get()
  @ApiOkResponse({ type: CurrentOperatorSessionResponseDTO })
  async handle(@Req() request: Request) {
    return (
      await this.operation.execute({ token: operatorSessionToken(request) })
    ).fold(CurrentOperatorSessionResponseDTO.from, (error) => {
      throw new Error(String(error));
    });
  }
}
