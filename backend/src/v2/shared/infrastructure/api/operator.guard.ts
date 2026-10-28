// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  createParamDecorator,
} from "@nestjs/common";
import type { Request } from "express";
import { OperatorSessionRepository } from "../../../modules/operators/domain/operator-session.repository";
import { Clock } from "../../application/clock";
import { OperatorPrincipal } from "../../application/operator-principal";
import { ProblemException } from "./problem";
export const OPERATOR_COOKIE = "quenda_operator_session";
type OperatorRequest = Request & { operator: OperatorPrincipal };
export function operatorSessionToken(request: Request) {
  return (
    request.headers.cookie
      ?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${OPERATOR_COOKIE}=`))
      ?.slice(OPERATOR_COOKIE.length + 1) ?? ""
  );
}
/** Separate from the tenant session so an operator never reaches tenant endpoints. */
@Injectable()
export class OperatorGuard implements CanActivate {
  constructor(
    private readonly sessions: OperatorSessionRepository,
    private readonly clock: Clock,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OperatorRequest>();
    const operator = await this.sessions.find(
      operatorSessionToken(request),
      this.clock.now(),
    );
    if (!operator) throw new ProblemException(401, { code: "unauthorized" });
    request.operator = operator;
    return true;
  }
}
export const CurrentOperator = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<OperatorRequest>().operator,
);
