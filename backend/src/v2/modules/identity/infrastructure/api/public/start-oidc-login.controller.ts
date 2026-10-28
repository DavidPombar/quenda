// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { assertNever } from "../../../../../shared/application/errors";
import {
  StartOidcLogin,
  StartOidcLoginError,
} from "../../../application/commands/start-oidc-login.command";
import { StartOidcLoginRequestDTO } from "../dto/start-oidc-login.request.dto";
import { authErrorUrl, setLoginCookie } from "./auth-cookies";
@V2Controller("public/auth/oidc/start")
export class StartOidcLoginController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(StartOidcLogin);
  }
  @Get()
  @ApiOperation({
    summary: "Start an electronic identification (OIDC) sign-in",
    description:
      "Browser navigation, not fetch. Stores a 10-minute attempt and redirects to the identity provider with state, nonce and PKCE (S256).",
  })
  @ApiResponse({
    status: 302,
    description:
      "Redirect to the identity provider; sets the `quenda_login` cookie (HttpOnly, SameSite=Lax, path /v2/public/auth, 10 min)",
  })
  @ApiResponse({
    status: 303,
    description:
      "Redirect to PUBLIC_URL/app/<slug>/instalacions?authError=<consent_required|not_found|oidc_unavailable>",
  })
  async handle(
    @Query() query: StartOidcLoginRequestDTO,
    @Res() response: Response,
  ) {
    const result = await this.operation.execute({
      slug: query.slug,
      legalVersion: query.legalVersion,
      returnTo: query.returnTo,
    });
    result.fold(
      (value) => {
        setLoginCookie(response, value.state);
        response.redirect(302, value.authorizationUrl);
      },
      (error) => response.redirect(303, this.errorUrl(query.slug, error)),
    );
  }
  private errorUrl(slug: string, error: StartOidcLoginError) {
    switch (error.code) {
      case "not_found":
        return authErrorUrl(null, error.code);
      case "consent_required":
      case "oidc_unavailable":
        return authErrorUrl(slug, error.code);
      default:
        return assertNever(error);
    }
  }
}
