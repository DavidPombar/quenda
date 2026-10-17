// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListMunicipalities } from "../../../application/queries/list-municipalities.query";
import { MunicipalityResponseDTO } from "../dto/municipality.response.dto";
@V2Controller("public/municipalities")
export class ListMunicipalitiesController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(ListMunicipalities);
  }
  @Get()
  @ApiOkResponse({ type: MunicipalityResponseDTO, isArray: true })
  async handle() {
    return (await this.operation.execute({})).fold(
      (values) => values.map(MunicipalityResponseDTO.from),
      (error) => {
        throw new Error(String(error));
      },
    );
  }
}
