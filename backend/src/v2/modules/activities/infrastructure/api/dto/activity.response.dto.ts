// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type {
  ActivityPrice,
  ActivitySession,
  LocalizedText,
  WeeklyRule,
} from "../../../domain/activity.entity";
import type {
  ManagedActivity,
  ManagedActivityDetails,
  PublicActivity,
  PublicActivityDetails,
  PublicActivityPage,
} from "../../../domain/activity.read-model";
import { SPORT_ARTS } from "../../../../facilities/domain/sport.repository";
import type { SportArt } from "../../../../facilities/domain/sport.entity";
import { CATEGORIES } from "../../../../../shared/application/categories";
import type { TariffCategory } from "../../../../../shared/application/categories";
export class LocalizedTextResponseDTO {
  @ApiProperty({ description: "Galician" }) gl!: string;
  @ApiProperty({ description: "Spanish; empty means use the Galician text" })
  es!: string;
}
export class WeeklyRuleResponseDTO {
  @ApiProperty({ type: [Number], description: "ISO weekdays, 1 = Monday" })
  weekdays!: number[];
  @ApiProperty({ description: "Local start time (HH:MM)" })
  startsLocal!: string;
  @ApiProperty({ description: "Local end time (HH:MM)" }) endsLocal!: string;
  @ApiProperty({ description: "First day (YYYY-MM-DD)" }) startsOn!: string;
  @ApiProperty({ description: "Last day, included" }) endsOn!: string;
  @ApiProperty({ type: [String], description: "Dates without a session" })
  exceptions!: string[];
}
export class ActivityPriceResponseDTO {
  @ApiProperty({ enum: ["general", ...CATEGORIES] })
  category!: TariffCategory;
  @ApiProperty({ description: "Indicative price in EUR cents" })
  priceCents!: number;
}
export class ActivitySessionResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() start!: string;
  @ApiProperty() end!: string;
  @ApiProperty({ enum: ["active", "cancelled"] }) status!:
    | "active"
    | "cancelled";
  @ApiProperty({ type: String, nullable: true })
  cancellationReason!: string | null;
  static from(value: ActivitySession): ActivitySessionResponseDTO {
    return {
      id: value.id,
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status,
      cancellationReason: value.cancellationReason,
    };
  }
}
/** Fields the backoffice and the catalogue share. */
class ActivityFieldsDTO {
  @ApiProperty() id!: string;
  @ApiProperty() facilityId!: string;
  @ApiProperty() facilityName!: string;
  @ApiProperty() facilityAddress!: string;
  @ApiProperty() resourceId!: string;
  @ApiProperty({ description: "Court or lane" }) resourceName!: string;
  @ApiProperty({ description: "Sport code" }) sport!: string;
  @ApiProperty({ type: LocalizedTextResponseDTO })
  sportName!: LocalizedText;
  @ApiProperty({ enum: SPORT_ARTS }) sportArt!: SportArt;
  @ApiProperty({ type: LocalizedTextResponseDTO }) name!: LocalizedText;
  @ApiProperty({ type: LocalizedTextResponseDTO })
  description!: LocalizedText;
  @ApiProperty({ type: WeeklyRuleResponseDTO }) rule!: WeeklyRule;
  @ApiProperty() places!: number;
  @ApiProperty({ type: Number, nullable: true }) minAge!: number | null;
  @ApiProperty({ type: Number, nullable: true }) maxAge!: number | null;
  @ApiProperty({ description: "First day of enrolment (YYYY-MM-DD)" })
  enrolmentOpensOn!: string;
  @ApiProperty({ description: "Last day of enrolment, included" })
  enrolmentClosesOn!: string;
  @ApiProperty({ type: [ActivityPriceResponseDTO] })
  prices!: ActivityPrice[];
  @ApiProperty({ enum: ["draft", "published", "cancelled"] })
  status!: "draft" | "published" | "cancelled";
  @ApiProperty({ type: String, nullable: true })
  cancellationReason!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Start of the next active session",
  })
  nextSession!: string | null;
}
const fields = (
  value: ManagedActivity | Omit<PublicActivity, "enrolment">,
): ActivityFieldsDTO => ({
  id: value.id,
  facilityId: value.facilityId,
  facilityName: value.facilityName,
  facilityAddress: value.facilityAddress,
  resourceId: value.resourceId,
  resourceName: value.resourceName,
  sport: value.sport,
  sportName: value.sportName,
  sportArt: value.sportArt,
  name: value.name,
  description: value.description,
  rule: value.rule,
  places: value.places,
  minAge: value.minAge,
  maxAge: value.maxAge,
  enrolmentOpensOn: value.enrolmentOpensOn,
  enrolmentClosesOn: value.enrolmentClosesOn,
  prices: value.prices,
  status: value.status,
  cancellationReason: value.cancellationReason,
  nextSession: value.nextSession?.toString() ?? null,
});
export class ManagedActivityResponseDTO extends ActivityFieldsDTO {
  @ApiProperty({ description: "RFC 5545 VCALENDAR of the weekly rule" })
  schedule!: string;
  @ApiProperty({ description: "Active sessions that have not started" })
  upcomingSessions!: number;
  static from(value: ManagedActivity): ManagedActivityResponseDTO {
    return {
      ...fields(value),
      schedule: value.schedule,
      upcomingSessions: value.upcomingSessions,
    };
  }
}
export class ManagedActivityDetailsResponseDTO extends ManagedActivityResponseDTO {
  @ApiProperty({ type: [ActivitySessionResponseDTO] })
  sessions!: ActivitySessionResponseDTO[];
  static from(value: ManagedActivityDetails): ManagedActivityDetailsResponseDTO {
    return {
      ...ManagedActivityResponseDTO.from(value),
      sessions: value.sessions.map(ActivitySessionResponseDTO.from),
    };
  }
}
export class PublicActivityResponseDTO extends ActivityFieldsDTO {
  @ApiProperty({
    enum: ["upcoming", "open", "closed"],
    description: "Whether people can enrol today",
  })
  enrolment!: "upcoming" | "open" | "closed";
  static from(value: PublicActivity): PublicActivityResponseDTO {
    return { ...fields(value), enrolment: value.enrolment };
  }
}
export class PublicActivityDetailsResponseDTO extends PublicActivityResponseDTO {
  @ApiProperty({
    type: [ActivitySessionResponseDTO],
    description: "Upcoming sessions, cancelled ones included",
  })
  sessions!: ActivitySessionResponseDTO[];
  static from(value: PublicActivityDetails): PublicActivityDetailsResponseDTO {
    return {
      ...PublicActivityResponseDTO.from(value),
      sessions: value.sessions.map(ActivitySessionResponseDTO.from),
    };
  }
}
export class PublicActivityPageResponseDTO {
  @ApiProperty({ type: [PublicActivityResponseDTO] })
  items!: PublicActivityResponseDTO[];
  @ApiProperty({ description: "Activities matching the filters" })
  total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  static from(value: PublicActivityPage): PublicActivityPageResponseDTO {
    return {
      items: value.items.map(PublicActivityResponseDTO.from),
      total: value.total,
      page: value.page,
      pageSize: value.pageSize,
    };
  }
}
