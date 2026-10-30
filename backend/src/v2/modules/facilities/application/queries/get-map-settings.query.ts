// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Result } from "../../../../shared/application/result";
export interface MapSettings {
  /** XYZ tile template with {z}, {x} and {y}. */
  tileUrl: string;
  attribution: string;
}
/**
 * Map tiles of this deployment (#26). The tile server receives the visitor's IP, so a deployment
 * may point it at its own or the provincial council's server instead of OpenStreetMap.
 */
@Injectable()
export class GetMapSettings {
  async execute(
    _args: Record<string, never>,
  ): Promise<Result<MapSettings, never>> {
    return Result.ok({
      tileUrl:
        process.env.MAP_TILE_URL ||
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        process.env.MAP_ATTRIBUTION || "© OpenStreetMap contributors",
    });
  }
}
