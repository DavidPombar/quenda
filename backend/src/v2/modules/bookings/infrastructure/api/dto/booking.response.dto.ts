// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  CATEGORIES,
  type TariffCategory,
} from "../../../../../shared/application/categories";
import { Booking } from "../../../domain/booking.entity";
export class BookingResponseDTO {
  @ApiProperty({ description: "Booking UUID" }) id!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Booked resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Start instant" }) start!: string;
  @ApiProperty({ description: "End instant" }) end!: string;
  @ApiProperty({ description: "Booking state" }) status!: Booking["status"];
  @ApiProperty({ description: "Creation instant" }) createdAt!: string;
  @ApiProperty({
    enum: [...CATEGORIES, "general"],
    nullable: true,
    description: "Tariff category applied when booked; null for older bookings",
  })
  tariffCategory!: TariffCategory | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Indicative price in EUR cents applied when booked",
  })
  priceCents!: number | null;
  static from(value: Booking): BookingResponseDTO {
    return {
      id: value.id,
      facilityId: value.facilityId,
      resourceId: value.resourceId,
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status,
      tariffCategory: value.tariffCategory,
      priceCents: value.priceCents,
      createdAt: value.createdAt.toString(),
    };
  }
}
