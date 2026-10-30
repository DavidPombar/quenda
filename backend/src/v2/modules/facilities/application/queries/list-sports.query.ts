// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SportRepository } from "../../domain/sport.repository";
import { Sport } from "../../domain/sport.entity";
import { Result } from "../../../../shared/application/result";
/** Sports to filter the catalogue by: visible and offered by a facility, one per code. */
@Injectable()
export class ListSports {
  constructor(private readonly sports: SportRepository) {}
  async execute(args: {
    municipalities: string[];
  }): Promise<Result<Sport[], never>> {
    return Result.ok(await this.sports.listShared(args.municipalities));
  }
}
