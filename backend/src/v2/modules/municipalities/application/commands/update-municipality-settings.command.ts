// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  EditableSettings,
  MunicipalitySettingsRepository,
} from "../../domain/municipality-settings.repository";
import { isAccessiblePrimaryColor } from "../../domain/primary-color";
import { HolidayCalendar } from "../../../facilities/domain/holiday-calendar";
import {
  LegalTexts,
  Municipalities,
  MunicipalitySettings,
} from "../../../../shared/application/municipality-settings";
import { normaliseCategories } from "../../../../shared/application/categories";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateMunicipalitySettingsError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"insufficient_contrast">
  | AppError<"invalid_holidays">;
export type SettingsPatch = Partial<EditableSettings> & {
  legalTexts?: LegalTexts;
};
const editable = [
  "locale",
  "advanceDays",
  "cancellationHours",
  "maxActiveBookings",
  "contact",
  "primaryColor",
  "holidaysCalendar",
  "enabledCategories",
  "noShowLimit",
  "noShowWindowDays",
  "noShowBlockDays",
] as const satisfies readonly (keyof EditableSettings)[];
/**
 * New rules apply to new reservations and changes only: existing bookings keep the cancellation
 * deadline they were made with, and bookings on newly declared holidays are kept and reported.
 */
@Injectable()
export class UpdateMunicipalitySettings {
  constructor(
    private readonly municipalities: Municipalities,
    private readonly settings: MunicipalitySettingsRepository,
    private readonly holidays: HolidayCalendar,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    patch: SettingsPatch;
  }): Promise<
    Result<
      { settings: MunicipalitySettings; affectedBookings: number },
      UpdateMunicipalitySettingsError
    >
  > {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const tenantId = args.principal.tenantId;
    await this.settings.lock(tenantId);
    const existing = await this.municipalities.find(tenantId);
    if (!existing) return Result.err(failure("not_found"));
    const patch = {
      ...args.patch,
      primaryColor: args.patch.primaryColor?.toLowerCase(),
      enabledCategories:
        args.patch.enabledCategories &&
        normaliseCategories(args.patch.enabledCategories),
    };
    const next: MunicipalitySettings = { ...existing };
    for (const key of editable)
      if (patch[key] !== undefined) Object.assign(next, { [key]: patch[key] });
    if (!isAccessiblePrimaryColor(next.primaryColor))
      return Result.err(failure("insufficient_contrast"));
    if (!this.holidays.validate(next.holidaysCalendar))
      return Result.err(failure("invalid_holidays"));
    const changed = editable.filter(
      (key) => JSON.stringify(existing[key]) !== JSON.stringify(next[key]),
    );
    const legalChanged =
      patch.legalTexts !== undefined &&
      (patch.legalTexts.gl !== existing.legalTexts.gl ||
        patch.legalTexts.es !== existing.legalTexts.es);
    if (!changed.length && !legalChanged)
      return Result.ok({ settings: existing, affectedBookings: 0 });
    const now = this.clock.now();
    await this.settings.save(
      tenantId,
      Object.fromEntries(changed.map((key) => [key, next[key]])),
    );
    if (legalChanged && patch.legalTexts) {
      next.legalTexts = patch.legalTexts;
      next.legalVersion = await this.settings.publishLegalTexts(
        tenantId,
        patch.legalTexts,
        now.toZonedDateTimeISO(existing.timezone).toPlainDate(),
        now,
      );
    }
    const affectedBookings = changed.includes("holidaysCalendar")
      ? (
          await this.settings.upcomingHolidayExposedStarts(tenantId, now)
        ).filter((start) => {
          const date = start
            .toZonedDateTimeISO(existing.timezone)
            .toPlainDate();
          return (
            this.holidays.isHoliday(next.holidaysCalendar, date) &&
            !this.holidays.isHoliday(existing.holidaysCalendar, date)
          );
        }).length
      : 0;
    // Calendar text can be large, so only a marker records that it changed.
    const audited = changed.filter((key) => key !== "holidaysCalendar");
    const pick = (source: MunicipalitySettings) =>
      Object.fromEntries(audited.map((key) => [key, source[key]]));
    await this.audit.record(args.principal, "municipality.updated", tenantId, {
      before: pick(existing),
      after: pick(next),
      ...(changed.includes("holidaysCalendar")
        ? { holidaysCalendarChanged: true, affectedBookings }
        : {}),
      ...(legalChanged
        ? {
            legalVersion: {
              before: existing.legalVersion,
              after: next.legalVersion,
            },
          }
        : {}),
    });
    return Result.ok({ settings: next, affectedBookings });
  }
}
