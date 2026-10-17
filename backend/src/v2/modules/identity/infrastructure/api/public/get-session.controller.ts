// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Req } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
import type { Request } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { sessionToken } from "../../../../../shared/infrastructure/api/principal.guard";
import { GetSession } from "../../../application/queries/get-session.query";
import { CurrentSessionResponseDTO } from "../dto/current-session.response.dto";
@V2Controller("public/session")
export class GetSessionController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetSession);
  }
  @Get()
  @ApiOkResponse({
    type: CurrentSessionResponseDTO,
    description: "Current session, or null when signed out",
  })
  async handle(@Req() request: Request) {
    const result = await this.operation.execute({
      token: sessionToken(request),
    });
    return result.fold(CurrentSessionResponseDTO.from, (error) => {
      throw new Error(String(error));
    });
  }
}
