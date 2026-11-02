// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpException } from "@nestjs/common";
import { AppError } from "../../application/errors";
export class ProblemException extends HttpException {
  /** `extensions` are RFC 9457 extension members, such as the dates an activity clashes on. */
  constructor(
    status: number,
    readonly problem: AppError,
    readonly extensions: Record<string, unknown> = {},
  ) {
    super(problem.code, status);
  }
}
