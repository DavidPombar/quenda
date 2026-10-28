// SPDX-License-Identifier: AGPL-3.0-or-later
import { AccessWindow } from "../access-window";
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AccessRepository } from "../../domain/access.repository";
import { AccessKeyRepository } from "../../domain/access-key.repository";
import { AccessDay } from "../../domain/access.read-model";
import { RETIRED_KEY_HOURS } from "./get-jwks.query";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetAccessDayError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/** Everything a door device needs to work offline for one local day. */
@Injectable()
export class GetAccessDay {
  constructor(
    private readonly access: AccessRepository,
    private readonly keys: AccessKeyRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly window: AccessWindow,
  ) {}
  async execute(args: {
    principal: Principal;
    date?: string;
  }): Promise<Result<AccessDay, GetAccessDayError>> {
    if (!can(args.principal, "access:control"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    let date: Temporal.PlainDate;
    try {
      date = args.date
        ? Temporal.PlainDate.from(args.date)
        : now.toZonedDateTimeISO(settings.timezone).toPlainDate();
    } catch {
      return Result.err(failure("validation"));
    }
    const from = date
      .toZonedDateTime({ timeZone: settings.timezone })
      .toInstant();
    const to = date
      .add({ days: 1 })
      .toZonedDateTime({ timeZone: settings.timezone })
      .toInstant();
    const bookings = await this.access.day(settings.id, from, to);
    return Result.ok({
      date,
      syncedAt: now,
      issuer: settings.slug,
      keys: await this.keys.published(
        settings.id,
        now.subtract({ hours: RETIRED_KEY_HOURS }),
      ),
      bookings: bookings.map(({ openingCalendar, ...booking }) => ({
        ...booking,
        validFrom: this.window.of({
          ...booking,
          openingCalendar,
          timezone: settings.timezone,
        }).from,
      })),
      revoked: bookings
        .filter((booking) => booking.status !== "confirmed")
        .map((booking) => booking.id),
    });
  }
}
