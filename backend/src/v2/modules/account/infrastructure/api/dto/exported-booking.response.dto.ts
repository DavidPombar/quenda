// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedBooking } from "../../../domain/account.read-model";
import {
  CATEGORIES,
  type TariffCategory,
} from "../../../../../shared/application/categories";
export class ExportedBookingResponseDTO {
  @ApiProperty({ description: "Booking UUID" }) id!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Booked resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Court or space display name" })
  resourceName!: string;
  @ApiProperty({ description: "Sport" }) sport!: string;
  @ApiProperty({ description: "Start instant" }) start!: string;
  @ApiProperty({ description: "End instant" }) end!: string;
  @ApiProperty({
    enum: ["confirmed", "cancelled", "no_show"],
    description: "Booking state",
  })
  status!: ExportedBooking["status"];
  @ApiProperty({ description: "Creation instant" }) createdAt!: string;
  @ApiProperty({ description: "Cancellation instant", nullable: true })
  cancelledAt!: string | null;
  @ApiProperty({
    enum: [...CATEGORIES, "general"],
    nullable: true,
    description: "Tariff category applied when booked",
  })
  tariffCategory!: TariffCategory | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Indicative price in EUR cents applied when booked",
  })
  priceCents!: number | null;
  @ApiProperty({
    enum: ["citizen", "municipality"],
    nullable: true,
    description: "Who cancelled",
  })
  cancelledBy!: ExportedBooking["cancelledBy"];
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Municipal reason",
  })
  cancellationReason!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Instant access staff recorded the entry",
  })
  checkedInAt!: string | null;
  static from(value: ExportedBooking): ExportedBookingResponseDTO {
    return {
      id: value.id,
      facilityId: value.facilityId,
      facilityName: value.facilityName,
      resourceId: value.resourceId,
      resourceName: value.resourceName,
      sport: value.sport,
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status,
      createdAt: value.createdAt.toString(),
      cancelledAt: value.cancelledAt ? value.cancelledAt.toString() : null,
      tariffCategory: value.tariffCategory,
      priceCents: value.priceCents,
      cancelledBy: value.cancelledBy,
      cancellationReason: value.cancellationReason,
      checkedInAt: value.checkedInAt?.toString() ?? null,
    };
  }
}
