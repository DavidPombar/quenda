// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type {
  Allocation,
  SeasonConflict,
} from "../../../domain/season.read-model";
export class SeasonConflictResponseDTO {
  @ApiProperty() occurrenceId!: string;
  @ApiProperty() start!: string;
  @ApiProperty() end!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      "One-off booking kept on that date; null when another club holds it",
  })
  bookingId!: string | null;
  static from(value: SeasonConflict): SeasonConflictResponseDTO {
    return {
      occurrenceId: value.occurrenceId,
      start: value.start.toString(),
      end: value.end.toString(),
      bookingId: value.bookingId,
    };
  }
}
export class SeasonDateResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() start!: string;
  @ApiProperty() end!: string;
}
export class AllocationResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() campaignId!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() organizationName!: string;
  @ApiProperty() facilityId!: string;
  @ApiProperty() facilityName!: string;
  @ApiProperty() resourceId!: string;
  @ApiProperty() resourceName!: string;
  @ApiProperty({ type: [Number] }) weekdays!: number[];
  @ApiProperty() startsLocal!: string;
  @ApiProperty() endsLocal!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: String, nullable: true }) cancelledAt!: string | null;
  @ApiProperty({ type: String, nullable: true })
  cancellationReason!: string | null;
  @ApiProperty({ description: "Dates holding the court" }) active!: number;
  @ApiProperty({ description: "Dates withdrawn" }) cancelled!: number;
  @ApiProperty({ type: [SeasonConflictResponseDTO] })
  conflicts!: SeasonConflictResponseDTO[];
  @ApiProperty({ type: [SeasonDateResponseDTO] })
  dates!: SeasonDateResponseDTO[];
  static from(value: Allocation): AllocationResponseDTO {
    return {
      ...value,
      createdAt: value.createdAt.toString(),
      cancelledAt: value.cancelledAt?.toString() ?? null,
      conflicts: value.conflicts.map(SeasonConflictResponseDTO.from),
      dates: value.dates.map((item) => ({
        id: item.id,
        start: item.start.toString(),
        end: item.end.toString(),
      })),
    };
  }
}
export class AssignmentResponseDTO {
  @ApiProperty({ type: AllocationResponseDTO })
  allocation!: AllocationResponseDTO;
  @ApiProperty({ description: "Dates created" }) created!: number;
  @ApiProperty({ type: [SeasonConflictResponseDTO] })
  conflicts!: SeasonConflictResponseDTO[];
  static from(value: {
    allocation: Allocation;
    created: number;
    conflicts: SeasonConflict[];
  }): AssignmentResponseDTO {
    return {
      allocation: AllocationResponseDTO.from(value.allocation),
      created: value.created,
      conflicts: value.conflicts.map(SeasonConflictResponseDTO.from),
    };
  }
}
