// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { GetAuthMethods } from "../../../application/queries/get-auth-methods.query";
import { AuthMethodsResponseDTO } from "../dto/auth-methods.response.dto";
@V2Controller("public/auth/methods")
export class GetAuthMethodsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetAuthMethods);
  }
  @Get()
  @ApiOperation({
    summary: "Sign-in methods enabled in this deployment",
    description:
      "Frontends render only the methods listed here. `oidc` is set when OIDC_ISSUER, OIDC_CLIENT_ID and PUBLIC_URL are configured.",
  })
  @ApiOkResponse({ type: AuthMethodsResponseDTO })
  async handle() {
    const result = await this.operation.execute({});
    return result.fold(AuthMethodsResponseDTO.from, (error) => {
      throw new Error(String(error));
    });
  }
}
