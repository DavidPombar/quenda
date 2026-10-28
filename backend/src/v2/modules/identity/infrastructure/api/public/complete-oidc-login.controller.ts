// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Logger, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  ErrorCode,
  assertNever,
} from "../../../../../shared/application/errors";
import {
  ConsumeLoginAttempt,
  ConsumeLoginAttemptError,
} from "../../../application/commands/consume-login-attempt.command";
import {
  ExchangeOidcCode,
  ExchangeOidcCodeError,
} from "../../../application/queries/exchange-oidc-code.query";
import {
  CompleteOidcLogin,
  CompleteOidcLoginError,
} from "../../../application/commands/complete-oidc-login.command";
import {
  appUrl,
  authErrorUrl,
  clearLoginCookie,
  loginCookieMatches,
  setSessionCookie,
} from "./auth-cookies";
function param(request: Request, name: string) {
  const value = request.query[name];
  return typeof value === "string" && value.length <= 4096 ? value : null;
}
function signInError(
  error:
    ConsumeLoginAttemptError | ExchangeOidcCodeError | CompleteOidcLoginError,
): ErrorCode {
  switch (error.code) {
    case "login_rejected":
    case "login_expired":
    case "oidc_unavailable":
    case "consent_required":
      return error.code;
    case "not_found":
      return "login_rejected";
    default:
      return assertNever(error);
  }
}
/**
 * The identity provider's redirect target (response_mode=query, so a GET that needs no custom
 * header). It never answers with JSON: every outcome is a 303 back to the citizen app.
 */
@V2Controller("public/auth/oidc/callback")
export class CompleteOidcLoginController {
  private readonly logger = new Logger(CompleteOidcLoginController.name);
  private readonly consume;
  private readonly exchange;
  private readonly complete;
  constructor(commands: Commands, queries: Queries) {
    this.consume = commands.get(ConsumeLoginAttempt);
    this.exchange = queries.get(ExchangeOidcCode);
    this.complete = commands.get(CompleteOidcLogin);
  }
  @Get()
  @ApiOperation({
    summary: "Finish an electronic identification (OIDC) sign-in",
    description:
      "Checks `state` against the `quenda_login` cookie, consumes the attempt, redeems the code outside any transaction, then finds or creates the citizen (assurance `eid`) and opens an 8-hour session.",
  })
  @ApiQuery({ name: "code", required: false })
  @ApiQuery({ name: "state", required: false })
  @ApiQuery({ name: "iss", required: false, description: "RFC 9207 issuer" })
  @ApiQuery({
    name: "error",
    required: false,
    description: "Error returned by the identity provider",
  })
  @ApiResponse({
    status: 303,
    description:
      "Success: redirect to PUBLIC_URL + returnTo with the `quenda_session` cookie. Failure: redirect to PUBLIC_URL/app/<slug>/instalacions?authError=<login_rejected|login_expired|oidc_unavailable|consent_required> (or /app/ when the attempt is unknown). Always clears `quenda_login`.",
  })
  async handle(@Req() request: Request, @Res() response: Response) {
    clearLoginCookie(response);
    let slug: string | null = null;
    const fail = (code: ErrorCode) =>
      response.redirect(303, authErrorUrl(slug, code));
    try {
      const state = param(request, "state");
      if (!state || !loginCookieMatches(request, state))
        return fail("login_rejected");
      const consumed = await this.consume.execute({ state });
      const attempt = consumed.fold(
        (value) => {
          slug = value.slug;
          return value.attempt;
        },
        () => null,
      );
      const providerError = param(request, "error");
      if (providerError)
        return fail(
          ["temporarily_unavailable", "server_error"].includes(providerError)
            ? "oidc_unavailable"
            : "login_rejected",
        );
      if (!attempt)
        return fail(consumed.fold(() => "login_rejected", signInError));
      const code = param(request, "code");
      if (!code) return fail("login_rejected");
      const exchanged = await this.exchange.execute({
        attempt,
        state,
        code,
        issuer: param(request, "iss"),
      });
      const claims = exchanged.fold(
        (value) => value,
        () => null,
      );
      if (!claims)
        return fail(exchanged.fold(() => "login_rejected", signInError));
      const session = await this.complete.execute({
        tenantId: attempt.tenantId,
        legalVersion: attempt.legalVersion,
        claims,
      });
      session.fold(
        (value) => {
          setSessionCookie(response, value.token);
          response.redirect(303, appUrl(attempt.returnTo));
        },
        (error) => fail(signInError(error)),
      );
    } catch (error) {
      this.logger.error(
        `OIDC callback failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
      fail("oidc_unavailable");
    }
  }
}
