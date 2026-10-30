// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SportRepository } from "../../domain/sport.repository";
import { Sport } from "../../domain/sport.entity";
import { Result } from "../../../../shared/application/result";
/** Visible sports of some municipalities (all when empty), for catalogue filters (#26). */
@Injectable()
export class ListSports {
  constructor(private readonly sports: SportRepository) {}
  async execute(args: {
    municipalities: readonly string[];
  }): Promise<Result<Sport[], never>> {
    return Result.ok(await this.sports.visible(args.municipalities));
  }
}
