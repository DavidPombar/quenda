// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { GetJwks } from "../../../application/queries/get-jwks.query";
import { JwksResponseDTO } from "../dto/jwks.response.dto";
import { SlugPathRequestDTO } from "../dto/slug-path.request.dto";
@V2Controller("public/municipalities")
export class GetJwksController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetJwks);
  }
  @Get(":slug/jwks")
  @ApiOperation({
    summary: "GetJwks",
    description: "Public keys that verify the municipality's access passes",
  })
  @ApiResponse({ status: 200, type: JwksResponseDTO })
  async handle(@Param() path: SlugPathRequestDTO): Promise<JwksResponseDTO> {
    const result = await this.operation.execute({ slug: path.slug });
    return result.fold(JwksResponseDTO.from, (error) => {
      throw new ProblemException(404, error);
    });
  }
}
