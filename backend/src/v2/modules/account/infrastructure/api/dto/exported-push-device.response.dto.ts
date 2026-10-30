// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedPushDevice } from "../../../domain/account.read-model";
export class ExportedPushDeviceResponseDTO {
  @ApiProperty({ description: "Origin of the browser's push service" })
  service!: string;
  @ApiProperty({ description: "Browser that subscribed" }) userAgent!: string;
  @ApiProperty({ description: "Instant push notices were turned on" })
  createdAt!: string;
  static from(value: ExportedPushDevice): ExportedPushDeviceResponseDTO {
    return {
      service: value.service,
      userAgent: value.userAgent,
      createdAt: value.createdAt.toString(),
    };
  }
}
