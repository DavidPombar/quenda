// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { SearchCitizens } from "../../../application/queries/search-citizens.query";
import { CitizenSearchRequestDTO } from "../dto/citizen-search.request.dto";
import { CitizenCategoriesResponseDTO } from "../dto/citizen-categories.response.dto";
@V2Controller("manager/citizens")
@UseGuards(PrincipalGuard)
export class SearchCitizensController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(SearchCitizens);
  }
  @Get()
  @ApiOperation({ summary: "SearchCitizens" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: CitizenCategoriesResponseDTO,
    isArray: true,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Query() query: CitizenSearchRequestDTO,
  ): Promise<CitizenCategoriesResponseDTO[]> {
    const result = await this.operation.execute({
      principal,
      query: query.query ?? "",
    });
    return result.fold(
      (values) => values.map(CitizenCategoriesResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
