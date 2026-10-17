// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  applyDecorators,
  Controller,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ProblemFilter } from "./problem.filter";
export function V2Controller(path: string) {
  return applyDecorators(
    Controller(`v2/${path}`),
    ApiTags(path),
    UseFilters(ProblemFilter),
    UsePipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    ),
  );
}
