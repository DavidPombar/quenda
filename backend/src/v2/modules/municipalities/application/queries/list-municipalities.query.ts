// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
@Injectable()
export class ListMunicipalities {
  constructor(private readonly municipalities: Municipalities) {}
  async execute(_args: Record<string, never>) {
    return Result.ok(await this.municipalities.list());
  }
}
