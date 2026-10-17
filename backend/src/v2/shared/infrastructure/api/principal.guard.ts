// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  createParamDecorator,
} from "@nestjs/common";
import type { Request } from "express";
import { SessionRepository } from "../../../modules/identity/domain/session.repository";
import { Clock } from "../../application/clock";
import { Principal } from "../../application/principal";
import { ProblemException } from "./problem";
export type AuthenticatedRequest = Request & { principal: Principal };
export function sessionToken(request: Request) {
  return (
    request.headers.cookie
      ?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("quenda_session="))
      ?.slice(15) ?? ""
  );
}
@Injectable()
export class PrincipalGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = await this.sessions.find(
      sessionToken(request),
      this.clock.now(),
    );
    if (!principal) throw new ProblemException(401, { code: "unauthorized" });
    request.principal = principal;
    return true;
  }
}
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().principal,
);
