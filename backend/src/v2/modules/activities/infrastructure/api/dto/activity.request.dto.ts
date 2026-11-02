// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { SPORT_CODE } from "../../../../facilities/domain/sport.repository";
import { CATEGORIES } from "../../../../../shared/application/categories";
import type { TariffCategory } from "../../../../../shared/application/categories";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const TARIFFS = ["general", ...CATEGORIES] as const;
export class LocalizedTextRequestDTO {
  @ApiProperty({ description: "Galician" })
  @IsString()
  @MaxLength(2000)
  gl!: string;
  @ApiProperty({ description: "Spanish; empty means use the Galician text" })
  @IsString()
  @MaxLength(2000)
  es!: string;
}
export class WeeklyRuleRequestDTO {
  @ApiProperty({ type: [Number], description: "ISO weekdays, 1 = Monday" })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  weekdays!: number[];
  @ApiProperty({ description: "Local start time of every session (HH:MM)" })
  @Matches(TIME)
  startsLocal!: string;
  @ApiProperty({ description: "Local end time of every session (HH:MM)" })
  @Matches(TIME)
  endsLocal!: string;
  @ApiProperty({ description: "First day (YYYY-MM-DD)" })
  @Matches(DATE)
  startsOn!: string;
  @ApiProperty({ description: "Last day, included (YYYY-MM-DD)" })
  @Matches(DATE)
  endsOn!: string;
  @ApiProperty({
    type: [String],
    description: "Dates without a session (YYYY-MM-DD)",
  })
  @IsArray()
  @ArrayMaxSize(200)
  @Matches(DATE, { each: true })
  exceptions!: string[];
}
export class ActivityPriceRequestDTO {
  @ApiProperty({
    enum: TARIFFS,
    description: "General tariff or a user category",
  })
  @IsIn(TARIFFS)
  category!: TariffCategory;
  @ApiProperty({ description: "Indicative price for the whole activity, in EUR cents" })
  @IsInt()
  @Min(0)
  @Max(10000000)
  priceCents!: number;
}
export class ActivityRequestDTO {
  @ApiProperty() @IsUUID() facilityId!: string;
  @ApiProperty({ description: "Court or lane; a whole court occupies its parts" })
  @IsUUID()
  resourceId!: string;
  @ApiProperty({ description: "Sport code of the municipality's catalogue" })
  @Matches(SPORT_CODE)
  sport!: string;
  @ApiProperty({ type: LocalizedTextRequestDTO })
  @ValidateNested()
  @Type(() => LocalizedTextRequestDTO)
  name!: LocalizedTextRequestDTO;
  @ApiProperty({ type: LocalizedTextRequestDTO })
  @ValidateNested()
  @Type(() => LocalizedTextRequestDTO)
  description!: LocalizedTextRequestDTO;
  @ApiProperty({ type: WeeklyRuleRequestDTO })
  @ValidateNested()
  @Type(() => WeeklyRuleRequestDTO)
  rule!: WeeklyRuleRequestDTO;
  @ApiProperty({ minimum: 1, maximum: 500 })
  @IsInt()
  @Min(1)
  @Max(500)
  places!: number;
  @ApiProperty({ type: Number, nullable: true, description: "Youngest age accepted" })
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsInt()
  @Min(0)
  @Max(120)
  minAge!: number | null;
  @ApiProperty({ type: Number, nullable: true, description: "Oldest age accepted" })
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsInt()
  @Min(0)
  @Max(120)
  maxAge!: number | null;
  @ApiProperty({ description: "First day of the enrolment period (YYYY-MM-DD)" })
  @Matches(DATE)
  enrolmentOpensOn!: string;
  @ApiProperty({
    description: "Last day of the enrolment period, by the activity's last day",
  })
  @Matches(DATE)
  enrolmentClosesOn!: string;
  @ApiProperty({ type: [ActivityPriceRequestDTO] })
  @IsArray()
  @ArrayMaxSize(TARIFFS.length)
  @ValidateNested({ each: true })
  @Type(() => ActivityPriceRequestDTO)
  prices!: ActivityPriceRequestDTO[];
}
