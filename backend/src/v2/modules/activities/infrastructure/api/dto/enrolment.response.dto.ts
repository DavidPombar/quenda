// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type {
  ManagedEnrolment,
  ManagedEnrolmentPage,
  MyEnrolment,
} from "../../../domain/enrolment.read-model";
import type { EnrolmentStatus } from "../../../domain/enrolment.entity";
const STATUSES = ["enrolled", "waiting", "left", "removed", "cancelled"];
export class EnrolmentActivityNameDTO {
  @ApiProperty() gl!: string;
  @ApiProperty({ description: "Empty means use the Galician text" })
  es!: string;
}
export class MyEnrolmentResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() activityId!: string;
  @ApiProperty({ type: EnrolmentActivityNameDTO })
  activityName!: EnrolmentActivityNameDTO;
  @ApiProperty({ enum: ["draft", "published", "cancelled"] })
  activityStatus!: MyEnrolment["activityStatus"];
  @ApiProperty() facilityId!: string;
  @ApiProperty() facilityName!: string;
  @ApiProperty() resourceName!: string;
  @ApiProperty({ enum: STATUSES }) status!: EnrolmentStatus;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Place in the waiting list, from 1",
  })
  position!: number | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: String, nullable: true }) enrolledAt!: string | null;
  @ApiProperty({ type: String, nullable: true }) endedAt!: string | null;
  @ApiProperty({ type: String, nullable: true }) nextSession!: string | null;
  @ApiProperty({ description: "Sessions cancelled since the person enrolled" })
  cancelledSessions!: number;
  static from(value: MyEnrolment): MyEnrolmentResponseDTO {
    return {
      ...value,
      createdAt: value.createdAt.toString(),
      enrolledAt: value.enrolledAt?.toString() ?? null,
      endedAt: value.endedAt?.toString() ?? null,
      nextSession: value.nextSession?.toString() ?? null,
    };
  }
}
export class ManagedEnrolmentResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty({ enum: STATUSES }) status!: EnrolmentStatus;
  @ApiProperty({ type: Number, nullable: true }) position!: number | null;
  @ApiProperty({ description: "Display name of the person" }) name!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Null once the account is deleted",
  })
  email!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: String, nullable: true }) enrolledAt!: string | null;
  @ApiProperty({ type: String, nullable: true }) endedAt!: string | null;
  @ApiProperty({ type: String, nullable: true }) removalReason!: string | null;
  static from(value: ManagedEnrolment): ManagedEnrolmentResponseDTO {
    return {
      ...value,
      createdAt: value.createdAt.toString(),
      enrolledAt: value.enrolledAt?.toString() ?? null,
      endedAt: value.endedAt?.toString() ?? null,
    };
  }
}
export class ManagedEnrolmentPageResponseDTO {
  @ApiProperty({ type: [ManagedEnrolmentResponseDTO] })
  items!: ManagedEnrolmentResponseDTO[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  static from(value: ManagedEnrolmentPage): ManagedEnrolmentPageResponseDTO {
    return {
      items: value.items.map(ManagedEnrolmentResponseDTO.from),
      total: value.total,
      page: value.page,
      pageSize: value.pageSize,
    };
  }
}
