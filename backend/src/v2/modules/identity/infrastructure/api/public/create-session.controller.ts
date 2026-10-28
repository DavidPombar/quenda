// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Post, Res } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { SensitiveEndpoint } from "../../../../../shared/infrastructure/api/rate-limit";
import { assertNever } from "../../../../../shared/application/errors";
import {
  CreateSession,
  CreateSessionError,
} from "../../../application/commands/create-session.command";
import { CreateSessionRequestDTO } from "../dto/create-session.request.dto";
import { SessionResponseDTO } from "../dto/session.response.dto";
import { setSessionCookie } from "./auth-cookies";
@V2Controller("public/sessions")
export class CreateSessionController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(CreateSession);
  }
  @Post()
  @SensitiveEndpoint()
  @ApiOperation({
    summary: "Open a demo session; explicitly disabled unless DEMO_MODE=true",
  })
  @ApiCreatedResponse({ type: SessionResponseDTO })
  async handle(
    @Body() body: CreateSessionRequestDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.operation.execute({
      slug: body.slug,
      role: body.role,
      legalVersion: body.legalVersion,
    });
    return result.fold((value) => {
      setSessionCookie(response, value.token);
      return SessionResponseDTO.from(value.principal);
    }, this.handleError);
  }
  private handleError(this: void, error: CreateSessionError): never {
    switch (error.code) {
      case "demo_disabled":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "consent_required":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
