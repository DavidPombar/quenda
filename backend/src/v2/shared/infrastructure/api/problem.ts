// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpException } from "@nestjs/common";
import { AppError } from "../../application/errors";
export class ProblemException extends HttpException {
  constructor(
    status: number,
    readonly problem: AppError,
  ) {
    super(problem.code, status);
  }
}
